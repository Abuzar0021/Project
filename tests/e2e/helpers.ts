import { expect, type Page } from "@playwright/test";

let counter = 0;

/** A fresh address per test, so accounts never collide between runs. */
export function uniqueEmail(prefix = "writer"): string {
  counter += 1;
  return `${prefix}.${Date.now()}.${counter}@northwind.co`;
}

/** Stand in for LanguageTool so runs do not depend on a checker server. */
export async function offlineChecker(page: Page): Promise<void> {
  await page.route("**/api/check", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ matches: [] }),
    }),
  );
}

export async function signUp(
  page: Page,
  options: { plan?: string; name?: string } = {},
): Promise<string> {
  const email = uniqueEmail();
  await offlineChecker(page);
  await page.goto(
    options.plan ? `/signup?plan=${options.plan}&period=yearly` : "/signup",
  );
  await page.getByLabel("Name").fill(options.name ?? "Mira Tan");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page).toHaveURL(/\/welcome$/);
  return email;
}

/** Sign up, skip onboarding and land in the sample draft. */
export async function openSampleDraft(
  page: Page,
  plan?: string,
): Promise<string> {
  const email = await signUp(page, { plan });
  await page.getByRole("link", { name: "Skip for now" }).click();
  await expect(page).toHaveURL(/\/app\/d\//);
  await expect(
    page
      .getByRole("list", { name: "Margin notes" })
      .getByRole("listitem")
      .first(),
  ).toBeVisible();
  return email;
}

export const notes = (page: Page) =>
  page.getByRole("list", { name: "Margin notes" }).getByRole("listitem");
