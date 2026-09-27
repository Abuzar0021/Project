import { describe, it, expect } from "vitest";
import {
  averageSentence,
  combine,
  contractionRate,
  formalPerThousand,
  measure,
} from "@/lib/voice/features";
import { readVoice } from "@/lib/voice/meter";
import { voiceIssues } from "@/lib/voice/notes";
import { profileFromTexts } from "@/lib/voice/profile";

const CASUAL = [
  "We'll send it today. We'll call you after. It's a quick fix and we don't expect trouble.",
  "We'll be there at nine. It's fine if you can't make it, we'll share notes.",
];

describe("measure", () => {
  it("counts contractions against their long forms", () => {
    const sample = measure("We'll go. We will stay. We shall see.");
    expect(sample.contractions["we'll"]).toEqual({ short: 1, long: 2 });
  });

  it("accepts curly apostrophes", () => {
    expect(measure("We’ll go.").contractions["we'll"]?.short).toBe(1);
  });

  it("reports rates and averages", () => {
    const sample = combine(CASUAL.map(measure));
    expect(contractionRate(sample)).toBe(1);
    expect(averageSentence(sample)).toBeGreaterThan(3);
    expect(
      formalPerThousand(measure("Kindly utilize the form.")),
    ).toBeGreaterThan(0);
    expect(contractionRate(measure("Plain words only."))).toBeNull();
  });
});

describe("readVoice", () => {
  const profile = profileFromTexts(CASUAL).sample;

  it("scores a draft in the writer's own habits near the top", () => {
    const reading = readVoice(
      profile,
      measure("We'll ship it Friday. It's ready and we don't need more time."),
    );
    expect(reading.score).toBeGreaterThanOrEqual(90);
  });

  it("scores a stiff draft lower and says why", () => {
    const stiff = measure(
      "We shall utilize the process. We will not proceed hereby. Kindly note we shall revert. We are grateful. It is done.",
    );
    const reading = readVoice(profile, stiff);
    expect(reading.score).toBeLessThan(80);
    expect(reading.differences).toContain("You usually use contractions");
  });
});

describe("voiceIssues", () => {
  const profile = profileFromTexts(CASUAL, 41);

  it("flags a long form the writer never uses and cites the habit", () => {
    const [issue] = voiceIssues(
      "We shall be delighted to help.",
      profile.sample,
      profile.count,
    );
    expect(issue?.label).toBe("Not your voice");
    expect(issue?.replacements).toEqual(["We'll"]);
    expect(issue?.reason).toBe(
      'Across your 41 drafts you write "we\'ll", never "we shall".',
    );
  });

  it("stays quiet without enough evidence of a habit", () => {
    const thin = profileFromTexts(["We'll see."]);
    expect(voiceIssues("We shall see.", thin.sample, thin.count)).toHaveLength(
      0,
    );
  });
});
