/**
 * Phase 8 e2e: on mobile the suggestion card is a bottom sheet, and Apply works
 * from it. The rail and minimap are hidden at this width.
 */
import { test, expect, type Page } from "@playwright/test";

async function mockChecker(page: Page): Promise<void> {
  await page.route("**/api/check", async (route) => {
    const idx = (
      (route.request().postDataJSON() as { text?: string }).text ?? ""
    ).indexOf("shiped");
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

test.use({ viewport: { width: 390, height: 800 } });

test("tapping a mark opens the bottom sheet and Apply works", async ({
  page,
}) => {
  await mockChecker(page);
  await page.goto("/");

  // Rail and minimap are hidden at mobile width.
  await expect(page.getByRole("list", { name: "Suggestions" })).toHaveCount(0);

  await page.locator(".margin-mark--correctness").first().click();
  const sheet = page.getByRole("dialog", { name: "Suggestion" });
  await expect(sheet).toBeVisible();

  await sheet.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByText("Applied")).toBeVisible();
  await expect(page.locator(".ProseMirror")).toContainText("shipped");
});
