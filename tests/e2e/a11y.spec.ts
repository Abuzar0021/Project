/**
 * Phase 7 accessibility pass: axe finds no WCAG A/AA violations on the main
 * states (default, card open, score open, and mobile).
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function mockChecker(page: Page): Promise<void> {
  await page.route("**/api/check", async (route) => {
    const body = route.request().postDataJSON() as { text?: string };
    const idx = (body.text ?? "").indexOf("shiped");
    const matches =
      idx >= 0
        ? [
            {
              offset: idx,
              length: 6,
              message: "Possible spelling mistake found.",
              replacements: ["shipped", "shaped"],
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

async function scan(page: Page) {
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
}

test.describe("accessibility", () => {
  test("default state has no violations", async ({ page }) => {
    await mockChecker(page);
    await page.goto("/");
    await expect(page.locator(".margin-mark").first()).toBeVisible();
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test("card open has no violations", async ({ page }) => {
    await mockChecker(page);
    await page.goto("/");
    await page.locator(".margin-mark--correctness").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test("score panel open has no violations", async ({ page }) => {
    await mockChecker(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Open score panel/ }).click();
    await expect(page.getByRole("dialog", { name: "Score" })).toBeVisible();
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test("mobile default has no violations", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await mockChecker(page);
    await page.goto("/");
    await expect(page.locator(".margin-mark").first()).toBeVisible();
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });
});
