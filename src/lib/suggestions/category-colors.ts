/**
 * category-colors.ts: the CSS variable for each category's color.
 * One source for the dots and leader lines so every view uses the same token.
 */
import type { Category } from "@/types/suggestion";

export const CATEGORY_COLOR_VAR: Record<Category, string> = {
  correctness: "var(--cat-correct)",
  clarity: "var(--cat-clarity)",
  tone: "var(--cat-tone)",
  style: "var(--cat-style)",
};
