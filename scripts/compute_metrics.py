#!/usr/bin/env python3
"""Computes per-segment + per-lesson metrics from the Preply JSON dataset and
emits SQL INSERT statements ready for Supabase.

Usage:
    python3 scripts/compute_metrics.py <dataset_root> <output_dir>

The script produces one SQL file per lesson so each batch stays under MCP's
statement size limit. The ingester uploads them in order.
"""
from __future__ import annotations

import json
import os
import statistics
import sys
import uuid
from dataclasses import dataclass, asdict
from pathlib import Path

ALGO_VERSION = "1.0.0"

# Student IDs match the seed migration (seed_demo_personas).
STUDENT_IDS = {
    "Student-1": "22222222-2222-2222-2222-222222222222",
    "Student-2": "33333333-3333-3333-3333-333333333333",
}
TUTOR_ID = "11111111-1111-1111-1111-111111111111"

# Lesson IDs match seed_demo_personas.
LESSON_IDS = {
    ("Student-1", "lesson-1"): "a0000001-0000-0000-0000-000000000001",
    ("Student-1", "lesson-2"): "a0000001-0000-0000-0000-000000000002",
    ("Student-1", "lesson-3"): "a0000001-0000-0000-0000-000000000003",
    ("Student-2", "lesson-1"): "b0000002-0000-0000-0000-000000000001",
    ("Student-2", "lesson-2"): "b0000002-0000-0000-0000-000000000002",
}

FILLERS = {
    "um", "uh", "uhm", "er", "erm", "ah", "eh", "hmm",
    "like", "okay", "ok", "so", "well", "yeah", "right",
}
STUDENT_CHANNEL = 0
TUTOR_CHANNEL = 1


@dataclass
class SegmentMetrics:
    segment_id: str
    segment_index: int
    duration_sec: float
    student_word_count: int
    talk_ratio_pct: float
    wpm: float
    clarity: float
    filler_pct: float
    vocab: int
    latency_sec: float
    quality_flags: list[str]


def compute_segment(raw: dict, index: int) -> SegmentMetrics:
    channels = raw["results"]["channels"]
    stu_alt = channels[STUDENT_CHANNEL]["alternatives"][0]
    tut_alt = channels[TUTOR_CHANNEL]["alternatives"][0]
    stu_words = stu_alt.get("words", [])
    tut_words = tut_alt.get("words", [])

    all_words = stu_words + tut_words
    duration_sec = max((w.get("end", 0) for w in all_words), default=0.0)

    total_words = len(stu_words) + len(tut_words)
    talk_ratio = (len(stu_words) / total_words * 100) if total_words else 0.0
    wpm = (len(stu_words) / (duration_sec / 60)) if duration_sec else 0.0

    confidences = [w.get("confidence", 0.0) for w in stu_words]
    clarity = statistics.mean(confidences) if confidences else 0.0

    fillers = sum(1 for w in stu_words if w.get("word", "").lower() in FILLERS)
    filler_pct = (fillers / len(stu_words) * 100) if stu_words else 0.0

    vocab = len({w.get("word", "").lower() for w in stu_words})

    # Response latency: student start after tutor end, within 10s, excluding noise.
    latencies: list[float] = []
    for tw in tut_words:
        te = tw.get("end", 0)
        for sw in stu_words:
            ss = sw.get("start", 0)
            if ss > te:
                gap = ss - te
                if 0.2 < gap < 10:
                    latencies.append(gap)
                break
    median_latency = statistics.median(latencies) if latencies else 0.0

    quality: list[str] = []
    if duration_sec < 60:
        quality.append("short_chunk")
    if clarity and clarity < 0.7:
        quality.append("low_confidence")
    run, max_run = 0, 0
    for w in stu_words:
        if w.get("confidence", 1.0) < 0.5:
            run += 1
            max_run = max(max_run, run)
        else:
            run = 0
    if max_run >= 5:
        quality.append("mic_issue")

    return SegmentMetrics(
        segment_id=str(uuid.uuid4()),
        segment_index=index,
        duration_sec=round(duration_sec, 3),
        student_word_count=len(stu_words),
        talk_ratio_pct=round(talk_ratio, 3),
        wpm=round(wpm, 3),
        clarity=round(clarity, 6),
        filler_pct=round(filler_pct, 3),
        vocab=vocab,
        latency_sec=round(median_latency, 3),
        quality_flags=quality,
    )


def sql_literal(v) -> str:
    """Escape a Python value for inline SQL."""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, list):
        inner = ",".join(sql_literal(x) for x in v)
        return f"ARRAY[{inner}]::text[]"
    if isinstance(v, dict):
        escaped = json.dumps(v, ensure_ascii=False).replace("'", "''")
        return f"'{escaped}'::jsonb"
    s = str(v).replace("'", "''")
    return f"'{s}'"


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: compute_metrics.py <dataset_root> <output_dir>", file=sys.stderr)
        sys.exit(2)
    root = Path(sys.argv[1])
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)

    for student_dir in sorted(root.iterdir()):
        if not student_dir.is_dir() or not student_dir.name.startswith("Student-"):
            continue
        student_key = student_dir.name
        student_id = STUDENT_IDS[student_key]
        for lesson_dir in sorted(student_dir.iterdir()):
            if not lesson_dir.is_dir():
                continue
            lesson_key = lesson_dir.name
            lesson_id = LESSON_IDS[(student_key, lesson_key)]
            files = sorted(lesson_dir.glob("*.json"))
            segment_rows: list[tuple[SegmentMetrics, dict]] = []
            lesson_stu_words: list[str] = []

            for i, f in enumerate(files, start=1):
                raw = json.loads(f.read_text())
                m = compute_segment(raw, i)
                segment_rows.append((m, raw))
                stu_words = raw["results"]["channels"][STUDENT_CHANNEL]["alternatives"][0].get("words", [])
                lesson_stu_words.extend(w.get("word", "").lower() for w in stu_words)

            # Lesson rollups, computed from raw for accuracy (esp. vocab).
            total_sec = sum(m.duration_sec for m, _ in segment_rows)
            total_stu_words = sum(m.student_word_count for m, _ in segment_rows)
            if total_stu_words == 0:
                continue
            lesson_talk = sum(m.talk_ratio_pct * m.student_word_count for m, _ in segment_rows) / total_stu_words
            lesson_wpm = (total_stu_words / (total_sec / 60)) if total_sec else 0.0
            lesson_clarity = sum(m.clarity * m.student_word_count for m, _ in segment_rows) / total_stu_words
            lesson_filler = sum(m.filler_pct * m.student_word_count for m, _ in segment_rows) / total_stu_words
            lesson_vocab = len(set(lesson_stu_words))
            latencies_all = [m.latency_sec for m, _ in segment_rows if m.latency_sec > 0]
            lesson_latency = statistics.median(latencies_all) if latencies_all else 0.0
            flags = sorted({f for m, _ in segment_rows for f in m.quality_flags})

            # Write one SQL file per lesson.
            lines: list[str] = []
            lines.append("begin;")
            lines.append(f"delete from public.lesson_segments where lesson_id = '{lesson_id}';")
            lines.append(f"delete from public.segment_metrics where lesson_id = '{lesson_id}';")
            lines.append(f"delete from public.lesson_metrics where lesson_id = '{lesson_id}';")
            for m, raw in segment_rows:
                # Segment row: derive happened_at from the lesson's happened_at + offset.
                lines.append(
                    "insert into public.lesson_segments "
                    "(id, lesson_id, segment_index, happened_at, raw) values "
                    f"({sql_literal(m.segment_id)}, {sql_literal(lesson_id)}, {m.segment_index}, "
                    f"(select happened_at + interval '{(m.segment_index-1)*5} minutes' from public.lessons where id = {sql_literal(lesson_id)}), "
                    f"{sql_literal(raw)});"
                )
                lines.append(
                    "insert into public.segment_metrics "
                    "(segment_id, lesson_id, student_id, tutor_id, segment_index, happened_at, "
                    "duration_sec, student_word_count, talk_ratio_pct, wpm, clarity, filler_pct, vocab, latency_sec, quality_flags, algo_version) "
                    f"select {sql_literal(m.segment_id)}, {sql_literal(lesson_id)}, {sql_literal(student_id)}, {sql_literal(TUTOR_ID)}, "
                    f"{m.segment_index}, s.happened_at, "
                    f"{m.duration_sec}, {m.student_word_count}, {m.talk_ratio_pct}, {m.wpm}, {m.clarity}, {m.filler_pct}, {m.vocab}, {m.latency_sec}, "
                    f"{sql_literal(m.quality_flags)}, {sql_literal(ALGO_VERSION)} "
                    f"from public.lesson_segments s where s.id = {sql_literal(m.segment_id)};"
                )
            # Lesson-level row, vocab computed from the full student word list.
            lines.append(
                "insert into public.lesson_metrics "
                "(lesson_id, student_id, tutor_id, happened_at, duration_min, student_word_count, "
                "talk_ratio_pct, wpm, clarity, filler_pct, vocab, latency_sec, quality_flags, algo_version) "
                f"select {sql_literal(lesson_id)}, {sql_literal(student_id)}, {sql_literal(TUTOR_ID)}, l.happened_at, "
                f"{round(total_sec/60, 3)}, {total_stu_words}, "
                f"{round(lesson_talk, 3)}, {round(lesson_wpm, 3)}, {round(lesson_clarity, 6)}, {round(lesson_filler, 3)}, "
                f"{lesson_vocab}, {round(lesson_latency, 3)}, {sql_literal(flags)}, {sql_literal(ALGO_VERSION)} "
                f"from public.lessons l where l.id = {sql_literal(lesson_id)};"
            )
            lines.append("commit;")
            out_file = out / f"{student_key.lower()}__{lesson_key}.sql"
            out_file.write_text("\n".join(lines) + "\n")
            print(f"wrote {out_file} ({out_file.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
