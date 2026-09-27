/**
 * Measures writing habits for the voice profile: contractions against their
 * long forms, sentence length, formal words and exclamation marks. Only the
 * counts are kept, never the text.
 */

import { splitSentences } from "@/lib/text/sentences";
import { countWords } from "@/lib/text/word-count";

/** A contraction and the longer forms a writer could use instead. */
export interface ContractionPair {
  short: string;
  long: string[];
}

export const PAIRS: ContractionPair[] = [
  { short: "we'll", long: ["we will", "we shall"] },
  { short: "we'd", long: ["we would"] },
  { short: "we're", long: ["we are"] },
  { short: "I'm", long: ["I am"] },
  { short: "I'll", long: ["I will", "I shall"] },
  { short: "don't", long: ["do not"] },
  { short: "doesn't", long: ["does not"] },
  { short: "can't", long: ["cannot", "can not"] },
  { short: "won't", long: ["will not"] },
  { short: "isn't", long: ["is not"] },
  { short: "aren't", long: ["are not"] },
  { short: "it's", long: ["it is"] },
  { short: "that's", long: ["that is"] },
  { short: "they're", long: ["they are"] },
];

export const FORMAL_WORDS = [
  "kindly",
  "shall",
  "hereby",
  "utilize",
  "herewith",
  "pursuant",
];

/** Counts only. The text a sample came from is never kept. */
export interface VoiceSample {
  words: number;
  sentences: number;
  sentenceWordsSq: number;
  exclamations: number;
  contractions: Record<string, { short: number; long: number }>;
  formal: Record<string, number>;
}

const count = (text: string, phrase: string) => {
  const pattern = phrase.replace(/'/g, "['’]").replace(/ /g, "\\s+");
  return (text.match(new RegExp(`\\b${pattern}\\b`, "gi")) ?? []).length;
};

export function measure(text: string): VoiceSample {
  const sentences = splitSentences(text);
  const contractions: VoiceSample["contractions"] = {};
  for (const pair of PAIRS) {
    contractions[pair.short] = {
      short: count(text, pair.short),
      long: pair.long.reduce((sum, form) => sum + count(text, form), 0),
    };
  }
  const formal: VoiceSample["formal"] = {};
  for (const word of FORMAL_WORDS) formal[word] = count(text, word);

  return {
    words: countWords(text),
    sentences: sentences.length,
    sentenceWordsSq: sentences.reduce((sum, s) => sum + s.words * s.words, 0),
    exclamations: (text.match(/!/g) ?? []).length,
    contractions,
    formal,
  };
}

export function emptySample(): VoiceSample {
  return {
    words: 0,
    sentences: 0,
    sentenceWordsSq: 0,
    exclamations: 0,
    contractions: {},
    formal: {},
  };
}

export function combine(samples: VoiceSample[]): VoiceSample {
  const total = emptySample();
  for (const s of samples) {
    total.words += s.words;
    total.sentences += s.sentences;
    total.sentenceWordsSq += s.sentenceWordsSq;
    total.exclamations += s.exclamations;
    for (const [key, value] of Object.entries(s.contractions)) {
      const current = total.contractions[key] ?? { short: 0, long: 0 };
      total.contractions[key] = {
        short: current.short + value.short,
        long: current.long + value.long,
      };
    }
    for (const [key, value] of Object.entries(s.formal)) {
      total.formal[key] = (total.formal[key] ?? 0) + value;
    }
  }
  return total;
}

export function contractionRate(sample: VoiceSample): number | null {
  let short = 0;
  let long = 0;
  for (const value of Object.values(sample.contractions)) {
    short += value.short;
    long += value.long;
  }
  return short + long === 0 ? null : short / (short + long);
}

export function averageSentence(sample: VoiceSample): number {
  return sample.sentences === 0 ? 0 : sample.words / sample.sentences;
}

export function formalPerThousand(sample: VoiceSample): number {
  if (sample.words === 0) return 0;
  const formal = Object.values(sample.formal).reduce((sum, n) => sum + n, 0);
  return (formal / sample.words) * 1000;
}
