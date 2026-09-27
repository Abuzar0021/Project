import { countWords } from "./word-count";

export interface Sentence {
  start: number;
  end: number;
  text: string;
  words: number;
}

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("en", { granularity: "sentence" })
    : null;

function fallbackSegments(text: string): { segment: string; index: number }[] {
  const out: { segment: string; index: number }[] = [];
  const pattern = /[^.!?]+[.!?]*\s*/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    out.push({ segment: match[0], index: match.index });
  }
  return out;
}

/** Split text into sentences with offsets, ignoring surrounding whitespace. */
export function splitSentences(text: string): Sentence[] {
  const segments = segmenter
    ? Array.from(segmenter.segment(text), (s) => ({
        segment: s.segment,
        index: s.index,
      }))
    : fallbackSegments(text);

  const sentences: Sentence[] = [];
  for (const { segment, index } of segments) {
    const lead = segment.length - segment.trimStart().length;
    const body = segment.trim();
    if (!body) continue;
    const start = index + lead;
    sentences.push({
      start,
      end: start + body.length,
      text: body,
      words: countWords(body),
    });
  }
  return sentences;
}
