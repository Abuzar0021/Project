/**
 * Phase 4 e2e: the suggestion card. LanguageTool is mocked at /api/check so a
 * correctness suggestion appears on "shiped"; the tests cover Apply (with a
 * single-step undo), Dismiss with Undo, and Ignore this rule surviving a reload.
 */
import { test, expect, type Page } from "@playwright/test";

// Return a TYPOS match for "shiped" positioned from the posted text.
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
              shortMessage: "Spelling",
              replacements: ["shipped", "shaped"],
              rule: {
                id: "MORFOLOGIK_RULE_EN_US",
                issueType: "misspelling",
                category: { id: "TYPOS", name: "Typo" },
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

test.describe("suggestion card", () => {
  test("apply replaces the text and undo restores it", async ({ page }) => {
    await mockChecker(page);
    await page.goto("/");

    const mark = page.locator(".margin-mark--correctness").first();
    await expect(mark).toBeVisible();
    await mark.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("shiped")).toBeVisible();

    await dialog.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(page.getByText("Applied")).toBeVisible();
    await expect(page.locator(".ProseMirror")).toContainText("shipped");

    // Single-step undo restores the original word.
    await page.locator(".ProseMirror").click();
    await page.keyboard.press("ControlOrMeta+z");
    await expect(page.locator(".ProseMirror")).toContainText("shiped");
  });

  test("dismiss hides the mark and undo brings it back", async ({ page }) => {
    await mockChecker(page);
    await page.goto("/");

    await page.locator(".margin-mark--correctness").first().click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Dismiss" })
      .click();
    await expect(page.locator(".margin-mark--correctness")).toHaveCount(0);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(
      page.locator(".margin-mark--correctness").first(),
    ).toBeVisible();
  });

  test("ignore this rule persists across a reload", async ({ page }) => {
    await mockChecker(page);
    await page.goto("/");

    await page.locator(".margin-mark--correctness").first().click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Ignore this rule" })
      .click();
    await expect(page.locator(".margin-mark--correctness")).toHaveCount(0);

    await page.reload();
    // Give the checker a moment; the ignored rule must stay hidden.
    await page.waitForTimeout(800);
    await expect(page.locator(".margin-mark--correctness")).toHaveCount(0);
  });
});
