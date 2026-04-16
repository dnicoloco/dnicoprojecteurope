import type { LessonUtterance } from "@/lib/db";

export type ConversationTurn = {
  speaker: "student" | "tutor";
  utterances: LessonUtterance[];
  startSec: number;
  endSec: number;
  combinedText: string;
};

export function chunkIntoTurns(
  utterances: LessonUtterance[],
): ConversationTurn[] {
  if (utterances.length === 0) return [];

  // Sort by start_sec to ensure chronological order
  const sorted = [...utterances].sort((a, b) => a.start_sec - b.start_sec);

  const turns: ConversationTurn[] = [];
  let current: ConversationTurn = {
    speaker: sorted[0].speaker,
    utterances: [sorted[0]],
    startSec: sorted[0].start_sec,
    endSec: sorted[0].end_sec,
    combinedText: sorted[0].text,
  };

  for (let i = 1; i < sorted.length; i++) {
    const u = sorted[i];

    if (u.speaker === current.speaker) {
      // Same speaker — accumulate into current turn
      current.utterances.push(u);
      current.endSec = Math.max(current.endSec, u.end_sec);
      current.combinedText += " " + u.text;
    } else {
      // Speaker changed — push current turn and start a new one
      turns.push(current);
      current = {
        speaker: u.speaker,
        utterances: [u],
        startSec: u.start_sec,
        endSec: u.end_sec,
        combinedText: u.text,
      };
    }
  }

  // Push the final turn
  turns.push(current);

  return turns;
}
