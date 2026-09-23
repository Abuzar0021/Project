/**
 * Phase 1 editor behavior: typing updates the word count, edits survive a
 * reload (localStorage autosave), and "New draft" clears the document back to
 * the empty placeholder state.
 */
import { test, expect } from "@playwright/test";

test.describe("editor foundation", () => {
  test("word count reflects the document", async ({ page }) => {
    await page.goto("/");
    const editor = page.locator(".ProseMirror");
    await editor.click();
    // Replace everything with a known phrase so the count is deterministic.
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Delete");
    await editor.pressSequentially("one two three four five");
    await expect(page.getByText("5 words")).toBeVisible();
  });

  test("edits survive a reload", async ({ page }) => {
    await page.goto("/");
    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await editor.pressSequentially(" persistedmarker");
    // Wait past the 500ms autosave debounce before reloading.
    await page.waitForTimeout(800);
    await page.reload();
    await expect(page.locator(".ProseMirror")).toContainText("persistedmarker");
  });

  test("undo restores text after an edit", async ({ page }) => {
    await page.goto("/");
    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await editor.pressSequentially(" undoablemarker");
    await expect(editor).toContainText("undoablemarker");
    await page.keyboard.press("ControlOrMeta+z");
    await expect(editor).not.toContainText("undoablemarker");
  });

  test("New draft clears the document", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Document menu" }).click();
    await page.getByRole("menuitem", { name: "New draft" }).click();
    await expect(page.getByText("0 words")).toBeVisible();
    // The sample content is gone and the editor sits in its empty state.
    await expect(page.getByText("Weekly product update")).toHaveCount(0);
    await expect(page.locator(".ProseMirror p.is-editor-empty")).toBeVisible();
  });
});
