import {
  averageSentence,
  contractionRate,
  formalPerThousand,
  type VoiceSample,
} from "./features";

export interface VoiceReading {
  score: number;
  differences: string[];
}

interface Gap {
  weight: number;
  size: number;
  text: string;
}

/** How much a short draft is allowed to say about a habit, from 0 to 1. */
const evidence = (seen: number, enough: number) => Math.min(1, seen / enough);

function contractionUses(sample: VoiceSample): number {
  return Object.values(sample.contractions).reduce(
    (sum, c) => sum + c.short + c.long,
    0,
  );
}

/** How close a draft is to the writer's usual habits, from 0 to 100. */
export function readVoice(
  profile: VoiceSample,
  draft: VoiceSample,
): VoiceReading {
  const gaps: Gap[] = [];

  const usual = contractionRate(profile);
  const now = contractionRate(draft);
  if (usual !== null && now !== null) {
    gaps.push({
      weight: 40,
      size: Math.abs(usual - now) * evidence(contractionUses(draft), 6),
      text:
        now < usual
          ? "You usually use contractions"
          : "You use more contractions here than usual",
    });
  }

  const usualLength = averageSentence(profile);
  const nowLength = averageSentence(draft);
  if (usualLength > 0 && nowLength > 0) {
    gaps.push({
      weight: 30,
      size:
        Math.min(1, Math.abs(nowLength - usualLength) / usualLength) *
        evidence(draft.sentences, 5),
      text:
        nowLength > usualLength
          ? "Your sentences here run longer than usual"
          : "Your sentences here are shorter than usual",
    });
  }

  const usualFormal = formalPerThousand(profile);
  const nowFormal = formalPerThousand(draft);
  gaps.push({
    weight: 20,
    size:
      Math.min(1, Math.abs(nowFormal - usualFormal) / 20) *
      evidence(draft.words, 300),
    text:
      nowFormal > usualFormal
        ? "This draft is more formal than you usually are"
        : "This draft is less formal than you usually are",
  });

  const usualBang = profile.sentences
    ? profile.exclamations / profile.sentences
    : 0;
  const nowBang = draft.sentences ? draft.exclamations / draft.sentences : 0;
  gaps.push({
    weight: 10,
    size:
      Math.min(1, Math.abs(nowBang - usualBang) * 4) *
      evidence(draft.sentences, 5),
    text:
      nowBang > usualBang
        ? "More exclamation marks than you usually use"
        : "Fewer exclamation marks than you usually use",
  });

  const penalty = gaps.reduce((sum, gap) => sum + gap.weight * gap.size, 0);
  const differences = gaps
    .filter((gap) => gap.weight * gap.size >= 3)
    .sort((a, b) => b.weight * b.size - a.weight * a.size)
    .slice(0, 3)
    .map((gap) => gap.text);

  return {
    score: Math.max(0, Math.min(100, Math.round(100 - penalty))),
    differences,
  };
}
