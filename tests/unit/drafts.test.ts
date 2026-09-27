import { describe, it, expect, beforeEach } from "vitest";
import {
  createDraft,
  deleteDraft,
  docText,
  editedAgo,
  getDraft,
  listDrafts,
  paragraphsToDoc,
  saveDraft,
  seedDrafts,
  tagCounts,
} from "@/lib/drafts";
import {
  buildProfile,
  addUploadedText,
  uploadedSamples,
  resetUploads,
} from "@/lib/voice/profile";
import { must } from "./helpers";

const EMAIL = "mira@northwind.co";

beforeEach(() => localStorage.clear());

describe("drafts", () => {
  it("seeds the sample drafts once, newest first", () => {
    seedDrafts(EMAIL);
    seedDrafts(EMAIL);
    const drafts = listDrafts(EMAIL);
    expect(drafts).toHaveLength(4);
    expect(drafts[0]?.title).toBe("Pricing update for early customers");
    expect(tagCounts(drafts)[0]).toEqual({ tag: "customers", count: 2 });
  });

  it("creates, saves and deletes a draft", () => {
    const draft = must(createDraft(EMAIL, null), "draft");
    expect(draft?.title).toBe("");
    const saved = saveDraft(EMAIL, draft.id, {
      title: "Notes",
      content: paragraphsToDoc(["One two three."]),
    });
    expect(saved?.words).toBe(3);
    expect(getDraft(EMAIL, draft.id)?.title).toBe("Notes");
    deleteDraft(EMAIL, draft.id);
    expect(getDraft(EMAIL, draft.id)).toBeNull();
  });

  it("stops at the plan's draft limit", () => {
    createDraft(EMAIL, 1);
    expect(createDraft(EMAIL, 1)).toBeNull();
  });

  it("reads plain text from a document", () => {
    expect(docText(paragraphsToDoc(["First.", "Second."]))).toBe(
      "First.\nSecond.",
    );
  });

  it("says when a draft was edited", () => {
    const now = Date.parse("2026-09-27T12:00:00Z");
    expect(editedAgo("2026-09-27T11:56:00Z", now)).toBe("Edited 4 min ago");
    expect(editedAgo("2026-09-27T09:00:00Z", now)).toBe("Edited 3 hours ago");
    expect(editedAgo("2026-09-25T12:00:00Z", now)).toBe("Edited 2 days ago");
    expect(editedAgo("2026-09-27T12:00:00Z", now)).toBe("Edited just now");
  });
});

describe("voice profile", () => {
  it("learns from other drafts over 150 words and from uploads", () => {
    seedDrafts(EMAIL);
    const drafts = listDrafts(EMAIL);
    const pricing = must(drafts[0], "draft");
    const fromDrafts = buildProfile(EMAIL, drafts, pricing.id);
    expect(fromDrafts?.count).toBe(3);

    addUploadedText(EMAIL, "We'll see. It's fine.");
    expect(uploadedSamples(EMAIL)).toHaveLength(1);
    expect(buildProfile(EMAIL, drafts, pricing.id)?.uploads).toBe(1);
    resetUploads(EMAIL);
    expect(uploadedSamples(EMAIL)).toHaveLength(0);
  });

  it("has no profile before any writing", () => {
    expect(buildProfile(EMAIL, [])).toBeNull();
  });
});
