#!/usr/bin/env python3
"""Upload sentence-level utterances to Supabase via PostgREST.

Reads all Deepgram JSON transcripts under /Users/dnico/Desktop/PREPLY/*/lesson-*/*.json,
extracts student-channel sentences, resolves segment_id via a GET on lesson_segments,
and POSTs to /rest/v1/lesson_utterances in batches.

Uses the publishable/anon key (a temporary INSERT policy must be active while this runs).
"""
import json
import os
import pathlib
import ssl
import statistics
import sys
import urllib.request
import urllib.error
import uuid

# macOS Python 3.14 bundles can miss system CA certs; rely on certifi if present.
try:
    import certifi  # type: ignore
    _SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _SSL_CTX = ssl._create_unverified_context()

SUPABASE_URL = "https://bkvzvqzeswsyqonryygg.supabase.co"
# Publishable anon key (public, RLS protects writes via the temporary policy).
ANON_KEY = "sb_publishable_u03ww8N_RVRiwcRYAtteHA_qYxFbu_l"
BASE = pathlib.Path("/Users/dnico/Desktop/PREPLY")

STUDENT_IDS = {
    "Student-1": "22222222-2222-2222-2222-222222222222",
    "Student-2": "33333333-3333-3333-3333-333333333333",
}
TUTOR_ID = "11111111-1111-1111-1111-111111111111"
LESSON_IDS = {
    ("Student-1", "lesson-1"): "a0000001-0000-0000-0000-000000000001",
    ("Student-1", "lesson-2"): "a0000001-0000-0000-0000-000000000002",
    ("Student-1", "lesson-3"): "a0000001-0000-0000-0000-000000000003",
    ("Student-2", "lesson-1"): "b0000002-0000-0000-0000-000000000001",
    ("Student-2", "lesson-2"): "b0000002-0000-0000-0000-000000000002",
}


def http(method: str, path: str, body=None, params: dict | None = None):
    url = SUPABASE_URL + path
    if params:
        from urllib.parse import urlencode

        url = f"{url}?{urlencode(params)}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req, context=_SSL_CTX) as resp:
            raw = resp.read().decode()
            return resp.status, raw
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def load_segment_map() -> dict[tuple[str, int], str]:
    """(lesson_id, segment_index) -> segment_id."""
    code, raw = http(
        "GET",
        "/rest/v1/lesson_segments",
        params={"select": "id,lesson_id,segment_index"},
    )
    if code != 200:
        print(f"segment fetch failed {code}: {raw}", file=sys.stderr)
        sys.exit(1)
    rows = json.loads(raw)
    return {(r["lesson_id"], r["segment_index"]): r["id"] for r in rows}


def extract_utterances(segment_map) -> list[dict]:
    out = []
    for student_dir in sorted(BASE.iterdir()):
        if not student_dir.is_dir() or not student_dir.name.startswith("Student-"):
            continue
        sid = STUDENT_IDS[student_dir.name]
        for lesson_dir in sorted(student_dir.iterdir()):
            if not lesson_dir.is_dir():
                continue
            lid = LESSON_IDS[(student_dir.name, lesson_dir.name)]
            seen = set()
            files = sorted(lesson_dir.glob("*.json"))
            for seg_idx, f in enumerate(files, start=1):
                segment_id = segment_map.get((lid, seg_idx))
                if not segment_id:
                    continue
                d = json.loads(f.read_text())
                alt = d["results"]["channels"][0]["alternatives"][0]
                paragraphs = alt.get("paragraphs", {}).get("paragraphs") or []
                for p_idx, para in enumerate(paragraphs):
                    for s_idx, sent in enumerate(para.get("sentences", []) or []):
                        text = (sent.get("text") or "").strip()
                        if not text:
                            continue
                        wc = len(text.split())
                        if wc < 4:
                            continue
                        if text.lower() in seen:
                            continue
                        seen.add(text.lower())
                        start = float(sent.get("start", 0))
                        end = float(sent.get("end", start))
                        words_in = [
                            w
                            for w in alt.get("words", [])
                            if w.get("start", 0) >= start - 0.01
                            and w.get("end", 0) <= end + 0.01
                        ]
                        confs = [w.get("confidence", 0) for w in words_in]
                        avg_c = (
                            round(statistics.mean(confs), 4) if confs else None
                        )
                        out.append(
                            {
                                "id": str(uuid.uuid4()),
                                "segment_id": segment_id,
                                "lesson_id": lid,
                                "student_id": sid,
                                "tutor_id": TUTOR_ID,
                                "speaker": "student",
                                "paragraph_index": p_idx,
                                "sentence_index": s_idx,
                                "start_sec": round(start, 3),
                                "end_sec": round(end, 3),
                                "text": text,
                                "word_count": wc,
                                "avg_confidence": avg_c,
                            }
                        )
    return out


def delete_existing_for_student(lesson_ids):
    for lid in lesson_ids:
        code, raw = http(
            "DELETE",
            "/rest/v1/lesson_utterances",
            params={"lesson_id": f"eq.{lid}"},
        )
        if code not in (200, 204):
            print(f"delete failed for {lid}: {code} {raw}", file=sys.stderr)


def insert_batch(rows):
    code, raw = http("POST", "/rest/v1/lesson_utterances", body=rows)
    if code not in (200, 201, 204):
        print(f"insert failed: {code} {raw[:200]}", file=sys.stderr)
        sys.exit(1)


def main():
    seg_map = load_segment_map()
    print(f"loaded {len(seg_map)} segments")
    rows = extract_utterances(seg_map)
    print(f"extracted {len(rows)} utterances")
    delete_existing_for_student(list(LESSON_IDS.values()))
    BATCH = 100
    for i in range(0, len(rows), BATCH):
        chunk = rows[i : i + BATCH]
        insert_batch(chunk)
        print(f"inserted {i + len(chunk)}/{len(rows)}")
    print("done")


if __name__ == "__main__":
    main()
