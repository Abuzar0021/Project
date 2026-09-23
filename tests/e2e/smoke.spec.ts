/**
 * Smoke e2e test: the app boots and serves the home page.
 * This proves the Playwright toolchain and the Next.js server work together
 * before any feature tests exist.
 */
import { test, expect } from "@playwright/test";

test("home page loads on the paper background", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Margin/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Margin" }),
  ).toBeVisible();
});
