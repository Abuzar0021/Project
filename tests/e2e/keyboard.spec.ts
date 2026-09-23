/**
 * Phase 7 e2e: keyboard-only flow. Ctrl/Cmd+J opens the next suggestion's card,
 * the card keyboard map works, and the shortcuts sheet opens.
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

test.describe("keyboard flow", () => {
  test("jump to a suggestion and dismiss it with the keyboard", async ({
    page,
  }) => {
    await mockChecker(page);
    await page.goto("/");
    await expect(page.locator(".margin-mark").first()).toBeVisible();

    await page.locator(".ProseMirror").click();
    await page.keyboard.press("ControlOrMeta+j");
    await expect(page.getByRole("dialog")).toBeVisible();

    // D dismisses from the card and returns focus to the editor.
    await page.keyboard.press("d");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Jump again reaches another suggestion.
    await page.keyboard.press("ControlOrMeta+j");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("the shortcuts sheet opens", async ({ page }) => {
    await mockChecker(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Shortcuts" }).click();
    const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Jump to next suggestion")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
});
