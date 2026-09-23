/**
 * Smoke e2e test: the app boots, the editor shell renders, and the sample draft
 * loads with its deliberate errors intact. Feature-level e2e tests arrive in
 * later phases.
 */
import { test, expect } from "@playwright/test";

test("home page loads the editor shell and sample draft", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Margin/);

  // Wordmark in the top bar.
  await expect(page.getByText("Margin", { exact: true })).toBeVisible();

  // Sample document content is present, including a deliberate typo.
  await expect(
    page.getByRole("heading", { level: 1, name: "Weekly product update" }),
  ).toBeVisible();
  await expect(page.getByText("shiped")).toBeVisible();

  // Word count is shown.
  await expect(page.getByText(/\bwords\b/)).toBeVisible();
});
