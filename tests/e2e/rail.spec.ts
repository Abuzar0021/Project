/**
 * Phase 5 e2e: the margin rail. Notes render beside the text, clicking a note
 * expands it with an inline Apply (not the popover card), and an empty document
 * shows the quiet empty-state line.
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

test.describe("margin rail", () => {
  test("renders notes beside the text", async ({ page }) => {
    await mockChecker(page);
    await page.goto("/");
    await expect(page.getByRole("list", { name: "Suggestions" })).toBeVisible();
    expect(await page.getByRole("listitem").count()).toBeGreaterThan(3);
  });

  test("clicking a note expands it and applies inline", async ({ page }) => {
    await mockChecker(page);
    await page.goto("/");

    const note = page
      .getByRole("listitem")
      .filter({ hasText: "Possible typo" })
      .first();
    await expect(note).toBeVisible();
    await note.getByText("Possible typo").click();

    // Inline Apply appears in the rail note, and no popover dialog opens.
    const apply = note.getByRole("button", { name: "Apply", exact: true });
    await expect(apply).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await apply.click();
    await expect(page.getByText("Applied")).toBeVisible();
    await expect(page.locator(".ProseMirror")).toContainText("shipped");
  });

  test("shows the empty state for an empty document", async ({ page }) => {
    await mockChecker(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Document menu" }).click();
    await page.getByRole("menuitem", { name: "New draft" }).click();
    await expect(page.getByText("No suggestions right now.")).toBeVisible();
  });
});
