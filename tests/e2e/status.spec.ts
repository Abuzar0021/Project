/**
 * Phase 7 e2e: the checker-down state. With no reachable checker the status
 * indicator shows the paused copy and existing (local-rule) marks stay.
 */
import { test, expect } from "@playwright/test";

test("shows the paused status when the checker is unreachable", async ({
  page,
}) => {
  // Fail every check request to simulate an unreachable checker.
  await page.route("**/api/check", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Cannot reach the checker." }),
    }),
  );
  await page.goto("/");

  await expect(
    page.getByText(
      "Checking paused. Can't reach the checker, retrying in 10s.",
    ),
  ).toBeVisible({ timeout: 6000 });

  // Local-rule marks (tone, clarity) remain despite the checker being down.
  expect(await page.locator(".margin-mark").count()).toBeGreaterThan(0);
});
