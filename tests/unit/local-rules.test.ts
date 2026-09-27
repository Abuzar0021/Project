import { describe, it, expect } from "vitest";
import { matchCase, runLocalRules } from "@/lib/checking/local-rules";
import { passiveIssues } from "@/lib/checking/passive";
import { longSentenceIssues } from "@/lib/checking/long-sentence";
import { underlined } from "./helpers";

const byRule = (text: string, ruleId: string) =>
  runLocalRules(text).filter((i) => i.ruleId === ruleId);

describe("local rules", () => {
  it("catches common misspellings with a fix", () => {
    const [issue] = byRule("You will recieve it.", "local:spelling");
    expect(issue?.replacements).toEqual(["receive"]);
    expect(issue?.reason).toBe("I before E, except in this one.");
  });

  it("offers a shorter phrase and counts the words saved", () => {
    const [issue] = byRule("We did it in order to win.", "local:wordy");
    expect(issue?.replacements).toEqual(["to"]);
    expect(issue?.reason).toBe("Same meaning, two fewer words.");
  });

  it("offers a plainer word and keeps a capital", () => {
    const [issue] = byRule("Utilize the plan.", "local:plainer:utilize");
    expect(issue?.replacements).toEqual(["Use"]);
  });

  it("suggests cutting hedges and weak words", () => {
    expect(byRule("We just sort of decided.", "local:hedging")).toHaveLength(2);
    expect(
      byRule("It is very hard.", "local:weak-word")[0]?.replacements,
    ).toEqual([""]);
  });

  it("puts every issue in one of the three categories", () => {
    const text =
      "The plan was decided by the team. We just want to utilize it in order to recieve more.";
    for (const issue of runLocalRules(text)) {
      expect(["spelling", "clarity", "voice"]).toContain(issue.category);
    }
  });
});

describe("matchCase", () => {
  it("capitalizes only when the original was capitalized", () => {
    expect(matchCase("Utilize", "use")).toBe("Use");
    expect(matchCase("utilize", "use")).toBe("use");
    expect(matchCase("Very", "")).toBe("");
  });
});

describe("passive voice", () => {
  it("rewrites a short passive clause with its agent", () => {
    const text = "The new pricing was decided by the team after three weeks.";
    const [issue] = passiveIssues(text);
    expect(underlined(text, issue)).toBe("was decided by the team");
    expect(issue?.fix).toBe("the team decided");
    expect(issue?.rewrite).toEqual({
      offset: 0,
      length: 39,
      text: "The team decided the new pricing",
    });
  });

  it("flags a passive with no agent but offers no rewrite", () => {
    const [issue] = passiveIssues("The report was written quickly.");
    expect(issue?.label).toBe("Passive voice");
    expect(issue?.replacements).toEqual([]);
  });
});

describe("long sentences", () => {
  const long =
    "You don't need to do anything to keep your rate, since it will be applied to your account automatically and you will receive a confirmation email once the change goes live, along with a copy of your current invoice and a short note about what changes.";

  it("splits a long sentence at a natural break near the middle", () => {
    const [issue] = longSentenceIssues(long);
    expect(issue?.reason).toMatch(
      /^\d+ words\. Try splitting it after "automatically"\.$/,
    );
    expect(issue?.replacements).toEqual(["automatically. You"]);
    expect(underlined(long, issue)).toBe("automatically and you");
  });

  it("leaves sentences of forty words or fewer alone", () => {
    expect(longSentenceIssues("A short sentence. Another one.")).toHaveLength(
      0,
    );
  });

  it("still flags a long sentence with no clean break", () => {
    const words = Array.from({ length: 45 }, (_, i) => `word${i}`).join(" ");
    const [issue] = longSentenceIssues(`${words}.`);
    expect(issue?.replacements).toEqual([]);
    expect(issue?.reason).toBe("45 words. Try splitting it into two.");
  });
});
