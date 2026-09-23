/**
 * Phase 6 e2e: the score panel. Fixing an issue raises the score within a
 * debounce cycle, and clicking a category row filters the editor.
 */
import { test, expect, type Page } from "@playwright/test";

async function mockChecker(page: Page): Promise<void> {
  await page.route("**/api/check", async (route) => {
    const body = route.request().postDataJSON() as { text?: string };
    const text = body.text ?? "";
    const idx = text.indexOf("shiped");
    const matches =
      idx >= 0
        ? [
            {
              offset: idx,
              length: 6,
              message: "Possible spelling mistake found.",
              replacements: ["shipped"],
              rule: {
                id: "MORFOLOGIK_RULE_EN_US",
                issueType: "misspelling",
                category: { id: "TYPOS" },
              },
            },
          ]
        : [];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ matches }),
    });
  });
}

async function scoreValue(page: Page): Promise<number> {
  const text = await page
    .getByRole("button", { name: /Open score panel/ })
    .innerText();
  return Number(text.replace(/\D/g, ""));
}

test.describe("score panel", () => {
  test("fixing an issue raises the score", async ({ page }) => {
    await mockChecker(page);
    await page.goto("/");
    await expect(
      page.locator(".margin-mark--correctness").first(),
    ).toBeVisible();
    const before = await scoreValue(page);

    await page.locator(".margin-mark--correctness").first().click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Apply", exact: true })
      .click();
    await page.waitForTimeout(700);

    const after = await scoreValue(page);
    expect(after).toBeGreaterThan(before);
  });

  test("clicking a category row filters the editor", async ({ page }) => {
    await mockChecker(page);
    await page.goto("/");
    await expect(page.locator(".margin-mark--clarity").first()).toBeVisible();

    await page.getByRole("button", { name: /Open score panel/ }).click();
    const panel = page.getByRole("dialog", { name: "Score" });
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: /Tone/ }).click();

    // Filtered to tone: clarity marks gone, panel closed.
    await expect(page.locator(".margin-mark--clarity")).toHaveCount(0);
    await expect(panel).toHaveCount(0);
  });
});
