import { test, expect } from "@playwright/test";
import { openSampleDraft } from "./helpers";

test.describe("settings", () => {
  test("switching plans from the pricing page", async ({ page }) => {
    await openSampleDraft(page, "free");
    await page.goto("/pricing");
    await page
      .getByRole("link", { name: "Start 14-day trial" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/app\/settings\?plan=pro/);
    await page.getByRole("button", { name: "Switch plan" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "You're on Pro now." }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Plan and billing" }),
    ).toContainText("Pro, trial until");
  });

  test("cancelling is one click", async ({ page }) => {
    await openSampleDraft(page);
    await page.goto("/app/settings");
    await page.getByRole("button", { name: "Cancel plan" }).click();
    await expect(
      page.getByRole("region", { name: "Plan and billing" }),
    ).toContainText("Free");
  });

  test("changing the name updates the sidebar", async ({ page }) => {
    await openSampleDraft(page);
    await page.goto("/app/settings");
    await page.getByLabel("Name").fill("Mira Okafor");
    await page.getByLabel("Name").blur();
    await expect(
      page.getByRole("navigation", { name: "Drafts" }),
    ).toContainText("Mira Okafor");
  });

  test("deleting the account removes everything", async ({ page }) => {
    const email = await openSampleDraft(page);
    await page.goto("/app/settings");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete account" }).click();
    await expect(page).toHaveURL("/");
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Log in with email" }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText(
      "no account",
    );
  });
});
