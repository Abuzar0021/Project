/**
 * Phase 3 e2e: suggestion marks render from the local rules (which need no
 * network), the category filter shows and hides them, and editing inside a mark
 * removes it. LanguageTool is not required for these because tone and clarity
 * come from the browser-side rules.
 */
import { test, expect } from "@playwright/test";

test.describe("suggestion marks", () => {
  test("marks render for the sample document", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".margin-mark").first()).toBeVisible();
    expect(await page.locator(".margin-mark").count()).toBeGreaterThan(0);
  });

  test("the category filter shows and hides marks", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".margin-mark--clarity").first()).toBeVisible();

    // Filtering to Tone hides clarity marks and keeps tone marks.
    await page.getByRole("button", { name: "Tone", exact: true }).click();
    await expect(page.locator(".margin-mark--clarity")).toHaveCount(0);
    expect(await page.locator(".margin-mark--tone").count()).toBeGreaterThan(0);

    // Back to All restores clarity marks.
    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(page.locator(".margin-mark--clarity").first()).toBeVisible();
  });

  test("editing inside a mark removes it", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".margin-mark--tone").first()).toBeVisible();
    const before = await page.locator(".margin-mark--tone").count();

    // "maybe" is a hedging (tone) mark in the first paragraph.
    await page.dblclick("text=maybe");
    await page.keyboard.type("x");
    await page.waitForTimeout(600);

    const after = await page.locator(".margin-mark--tone").count();
    expect(after).toBeLessThan(before);
  });
});
