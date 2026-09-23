/**
 * Unit test for the category color map: one entry per category, all CSS vars.
 */
import { describe, it, expect } from "vitest";
import { CATEGORY_COLOR_VAR } from "@/lib/suggestions/category-colors";
import { CATEGORIES } from "@/types/suggestion";

describe("CATEGORY_COLOR_VAR", () => {
  it("has a CSS variable for every category", () => {
    for (const category of CATEGORIES) {
      expect(CATEGORY_COLOR_VAR[category]).toMatch(/^var\(--cat-/);
    }
  });
});
