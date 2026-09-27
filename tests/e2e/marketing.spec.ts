/**
 * Marketing page e2e (DESIGN 14). The page renders its hero and sends the one
 * primary action to the editor, carries none of the section 13 tells, shows
 * the screenshot for the active theme, and its dithered mark draws dots but
 * holds still under reduced motion.
 */
import { test, expect, type Page } from "@playwright/test";

/** Snapshot of the dithered mark's pixels, for before/after comparisons. */
async function markPixels(page: Page): Promise<string> {
  return page
    .locator("main canvas")
    .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
}

async function markHasDots(page: Page): Promise<boolean> {
  return page.locator("main canvas").evaluate((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx || canvas.width === 0) return false;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return true;
    return false;
  });
}

test.describe("marketing page", () => {
  test("hero states the product and opens the editor", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Suggestions that live where you're writing/,
      }),
    ).toBeVisible();

    // One primary action in the hero, and it leads to the working editor.
    const hero = page.locator("section").first();
    await expect(hero.getByRole("link")).toHaveCount(1);
    await hero.getByRole("link", { name: "Open the editor" }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.locator(".ProseMirror")).toBeVisible();
  });

  test("has three feature sections at most", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(3);
  });

  test("carries none of the section 13 tells", async ({ page }) => {
    await page.goto("/");
    const found = await page.evaluate(() => {
      const problems: string[] = [];
      for (const el of Array.from(document.querySelectorAll("*"))) {
        const style = getComputedStyle(el);
        if (style.backgroundImage.includes("gradient")) {
          problems.push(`gradient on ${el.tagName}`);
        }
        if (style.backdropFilter && style.backdropFilter !== "none") {
          problems.push(`backdrop-filter on ${el.tagName}`);
        }
      }
      return problems;
    });
    expect(found).toEqual([]);

    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/\bAI\b|powered by|made with|built with/i);
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(text).not.toMatch(/\u2014/);
  });

  test("shows the screenshot that matches the theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    const visible = page.locator("main img").filter({ visible: true }).first();
    await expect(visible).toHaveAttribute("src", /hero-dark/);
    const loaded = await visible.evaluate(
      (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
    );
    expect(loaded).toBe(true);
  });

  test("the dithered mark draws and reacts to the pointer", async ({
    page,
  }) => {
    await page.goto("/");
    await expect.poll(() => markHasDots(page)).toBe(true);
    const before = await markPixels(page);

    const box = await page.locator("main canvas").boundingBox();
    if (!box) throw new Error("canvas has no box");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width / 2 + 6, box.y + box.height / 2);
    await expect.poll(() => markPixels(page)).not.toBe(before);
  });

  test("the dithered mark holds still under reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect.poll(() => markHasDots(page)).toBe(true);
    const before = await markPixels(page);

    const box = await page.locator("main canvas").boundingBox();
    if (!box) throw new Error("canvas has no box");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width / 2 + 6, box.y + box.height / 2);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
    expect(await markPixels(page)).toBe(before);
  });
});
