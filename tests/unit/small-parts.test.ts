import { describe, it, expect, beforeEach } from "vitest";
import { addStet, isKept, listStet, normalize, removeStet } from "@/lib/stet";
import { entitlementsFor } from "@/lib/entitlements";
import { layoutNotes } from "@/lib/notes-layout";
import { barLabel, barWidth } from "@/lib/rhythm";
import { splitSentences } from "@/lib/text/sentences";
import { readMinutes } from "@/lib/text/word-count";
import { categoryFor, labelFor, shortenReason } from "@/lib/categories";
import { planById, PLANS } from "@/lib/plans";
import { getPrefs, setPrefs } from "@/lib/prefs";
import type { RawMatch } from "@/types/languagetool";
import { must } from "./helpers";

beforeEach(() => localStorage.clear());

describe("stet memory", () => {
  const EMAIL = "mira@northwind.co";

  it("remembers a kept suggestion across drafts", () => {
    addStet(EMAIL, {
      ruleId: "local:plainer:utilize",
      original: " Utilize ",
      scope: "all",
      draftId: "d1",
    });
    const rules = listStet(EMAIL);
    expect(
      isKept(
        { ruleId: "local:plainer:utilize", original: "utilize" },
        rules,
        "d2",
      ),
    ).toBe(true);
  });

  it("keeps it to one draft on the Free plan", () => {
    addStet(EMAIL, {
      ruleId: "R",
      original: "utilize",
      scope: "draft",
      draftId: "d1",
    });
    const rules = listStet(EMAIL);
    expect(isKept({ ruleId: "R", original: "utilize" }, rules, "d1")).toBe(
      true,
    );
    expect(isKept({ ruleId: "R", original: "utilize" }, rules, "d2")).toBe(
      false,
    );
  });

  it("forgets a rule on undo", () => {
    const rule = addStet(EMAIL, {
      ruleId: "R",
      original: "x",
      scope: "all",
      draftId: "d1",
    });
    removeStet(EMAIL, rule.id);
    expect(listStet(EMAIL)).toHaveLength(0);
    expect(normalize("  Two   Words ")).toBe("two words");
  });
});

describe("entitlements", () => {
  it("limits Free to spelling, twenty drafts and one-draft stet", () => {
    expect(entitlementsFor("free")).toEqual({
      categories: ["spelling"],
      rhythm: false,
      voice: false,
      stetScope: "draft",
      draftLimit: 20,
    });
  });

  it("opens everything on Pro and Team", () => {
    expect(entitlementsFor("pro").categories).toEqual([
      "spelling",
      "clarity",
      "voice",
    ]);
    expect(entitlementsFor("team").draftLimit).toBeNull();
  });
});

describe("note layout", () => {
  it("aligns notes to their marks and pushes down on collision", () => {
    const placed = layoutNotes([
      { id: "a", anchorTop: 100, height: 40 },
      { id: "b", anchorTop: 110, height: 40 },
      { id: "c", anchorTop: 400, height: 40 },
    ]);
    expect(placed).toEqual([
      { id: "a", top: 92 },
      { id: "b", top: 140 },
      { id: "c", top: 392 },
    ]);
  });
});

describe("rhythm", () => {
  it("sizes bars by word count within the gutter", () => {
    expect(barWidth(21, 60)).toBe(30);
    expect(barWidth(100, 60)).toBe(60);
    expect(barWidth(0, 60)).toBe(4);
    expect(barLabel(12)).toBe("12 words");
    expect(barLabel(31)).toBe("31 words, consider splitting");
    expect(barLabel(1)).toBe("1 word");
  });

  it("splits sentences with offsets", () => {
    const text = "  First one. Second one here!";
    const [first, second] = splitSentences(text);
    expect(first).toMatchObject({ start: 2, text: "First one.", words: 2 });
    const { start, end } = must(second, "sentence");
    expect(text.slice(start, end)).toBe("Second one here!");
  });

  it("estimates read time", () => {
    expect(readMinutes(10)).toBe(1);
    expect(readMinutes(460)).toBe(2);
  });
});

describe("categories", () => {
  const match = (id: string, issueType?: string): RawMatch => ({
    offset: 0,
    length: 1,
    message: "m",
    replacements: [],
    rule: { id: "R", category: { id }, issueType },
  });

  it("maps server rules to the three categories", () => {
    expect(categoryFor(match("TYPOS"))).toBe("spelling");
    expect(categoryFor(match("MISC", "duplication"))).toBe("spelling");
    expect(categoryFor(match("REDUNDANCY"))).toBe("clarity");
    expect(categoryFor(match("SOMETHING_NEW"))).toBe("clarity");
    expect(labelFor(match("PLAIN_ENGLISH"))).toBe("Plainer word");
    expect(labelFor(match("MISC", "duplication"))).toBe("Repeated word");
  });

  it("shortens long reasons at a word", () => {
    const reason = shortenReason("word ".repeat(60));
    expect(reason.length).toBeLessThanOrEqual(123);
    expect(reason.endsWith("...")).toBe(true);
  });
});

describe("plans and preferences", () => {
  it("finds plans by id", () => {
    expect(planById("pro")?.price).toEqual({ yearly: 12, monthly: 15 });
    expect(planById("nope")).toBeUndefined();
    expect(PLANS).toHaveLength(3);
  });

  it("remembers the rhythm choice per person", () => {
    expect(getPrefs("a@b.co").rhythm).toBe(true);
    setPrefs("a@b.co", { rhythm: false });
    expect(getPrefs("a@b.co").rhythm).toBe(false);
  });
});
