import { test, expect } from "@playwright/test";
import { offlineChecker, signUp } from "./helpers";

test.describe("sign up and log in", () => {
  test("a new writer signs up, adds writing and lands in a draft", async ({
    page,
  }) => {
    await signUp(page);
    await expect(
      page.getByRole("heading", { name: "Teach Margin how you write" }),
    ).toBeVisible();

    await page.getByLabel(/Drop files here/).setInputFiles({
      name: "old-email.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "We'll send the notes today. It's a short update and we don't expect any surprises, so we'll keep it brief.",
      ),
    });
    await expect(
      page.getByRole("listitem").filter({ hasText: "old-email.txt" }),
    ).toContainText("Added");

    await page.getByRole("link", { name: "Continue to editor" }).click();
    await expect(page).toHaveURL(/\/app\/d\//);
    await expect(page.getByLabel("Draft title")).toHaveValue(
      "Pricing update for early customers",
    );
  });

  test("the form explains what is missing", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Continue with email" }).click();
    await expect(page.getByText("Enter your name.")).toBeVisible();
    await expect(page.getByText("Enter your email address.")).toBeVisible();
    await page.getByLabel("Work email").fill("mira@");
    await page.getByRole("button", { name: "Continue with email" }).click();
    await expect(
      page.getByText("Enter an email address like name@company.com"),
    ).toBeVisible();
  });

  test("Google sign-in says it is not connected yet", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await expect(
      page.getByText(/Google sign-in isn.t connected in this preview/),
    ).toBeVisible();
  });

  test("logging out and back in keeps the drafts", async ({ page }) => {
    const email = await signUp(page);
    await page.getByRole("link", { name: "Skip for now" }).click();
    await expect(page).toHaveURL(/\/app\/d\//);

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();

    await offlineChecker(page);
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Log in with email" }).click();
    await expect(page).toHaveURL(/\/app\/d\//);
    await expect(
      page.getByRole("navigation", { name: "Drafts" }),
    ).toContainText("Q4 board memo");
  });

  test("an unknown email gets a way forward", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@northwind.co");
    await page.getByRole("button", { name: "Log in with email" }).click();
    const alert = page.locator("form").getByRole("alert");
    await expect(alert).toContainText("no account for that email");
    await alert.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("the app asks you to log in first and sends you back after", async ({
    page,
  }) => {
    await page.goto("/app/settings");
    await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fsettings/);
  });

  test("signed in visitors skip the auth pages", async ({ page }) => {
    await signUp(page);
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/app/);
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Open Margin" })).toBeVisible();
  });
});
