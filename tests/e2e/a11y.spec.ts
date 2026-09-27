import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openSampleDraft } from "./helpers";

async function violations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  return results.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
}

test.describe("accessibility", () => {
  // A full axe scan of the landing page, with the live editor in it, is slow.
  test.describe.configure({ timeout: 90_000 });

  for (const path of ["/", "/pricing", "/signup", "/login"]) {
    test(`${path} has no violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await violations(page)).toEqual([]);
    });
  }

  test("the editor has no violations in dark and light", async ({ page }) => {
    await openSampleDraft(page);
    expect(await violations(page)).toEqual([]);
    await page.getByRole("button", { name: "Switch light or dark" }).click();
    expect(await violations(page)).toEqual([]);
  });

  test("settings has no violations", async ({ page }) => {
    await openSampleDraft(page);
    await page.goto("/app/settings");
    expect(await violations(page)).toEqual([]);
  });

  test("the editor works on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSampleDraft(page);
    expect(await violations(page)).toEqual([]);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: "Open sidebar" }).click();
    await expect(
      page.getByRole("navigation", { name: "Drafts" }),
    ).toBeVisible();
  });
});
