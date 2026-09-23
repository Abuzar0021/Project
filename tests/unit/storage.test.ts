/**
 * Unit tests for localStorage persistence: the draft (document + title) and the
 * preferences (ignored rules, dictionary), including graceful handling of
 * missing or malformed data.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { loadDraft, saveDraft, clearDraft } from "@/lib/storage/doc-storage";
import {
  loadIgnoredRules,
  saveIgnoredRules,
  loadDictionary,
  saveDictionary,
} from "@/lib/storage/prefs";

beforeEach(() => localStorage.clear());

describe("doc-storage", () => {
  it("returns null when there is no draft", () => {
    expect(loadDraft()).toBeNull();
  });

  it("saves and loads a draft", () => {
    const doc = { type: "doc", content: [] };
    saveDraft({ doc, title: "My draft" });
    const loaded = loadDraft();
    expect(loaded?.title).toBe("My draft");
    expect(loaded?.doc).toEqual(doc);
  });

  it("clears a draft", () => {
    saveDraft({ doc: { type: "doc" }, title: "x" });
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("returns null for malformed data", () => {
    localStorage.setItem("margin-draft", "not json");
    expect(loadDraft()).toBeNull();
  });
});

describe("prefs storage", () => {
  it("round-trips ignored rules", () => {
    expect(loadIgnoredRules()).toEqual([]);
    saveIgnoredRules(["RULE_A", "RULE_B"]);
    expect(loadIgnoredRules()).toEqual(["RULE_A", "RULE_B"]);
  });

  it("round-trips the dictionary", () => {
    saveDictionary(["shiped", "wether"]);
    expect(loadDictionary()).toEqual(["shiped", "wether"]);
  });

  it("ignores malformed data", () => {
    localStorage.setItem("margin-ignored-rules", "{bad");
    expect(loadIgnoredRules()).toEqual([]);
  });
});
