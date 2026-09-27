import { test, expect } from "@playwright/test";

const PAGES = [
  "/",
  "/pricing",
  "/changelog",
  "/contact",
  "/privacy",
  "/terms",
  "/about",
  "/signup",
  "/login",
];

test.describe("marketing site", () => {
  test("every link on the public pages goes somewhere real", async ({
    page,
    request,
  }) => {
    const seen = new Set<string>();
    for (const path of ["/", "/pricing"]) {
      await page.goto(path);
      const hrefs = await page
        .locator("a[href^='/']")
        .evaluateAll((links) =>
          links.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""),
        );
      for (const href of hrefs) seen.add(href.split("#")[0] || "/");
    }
    for (const href of seen) {
      const response = await request.get(href, { maxRedirects: 0 });
      expect(response.status(), href).toBeLessThan(400);
    }
    for (const path of PAGES)
      expect(
        seen.has(path) || path === "/about",
        `${path} is linked`,
      ).toBeTruthy();
  });

  test("placeholder pages say coming soon", async ({ page }) => {
    for (const path of [
      "/changelog",
      "/contact",
      "/privacy",
      "/terms",
      "/about",
    ]) {
      await page.goto(path);
      await expect(page.getByText("Coming soon.")).toBeVisible();
    }
  });

  test("unknown pages show a helpful not found page", async ({ page }) => {
    const response = await page.goto("/nothing-here");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("link", { name: "Back to the home page" }),
    ).toBeVisible();
  });

  test("the hero draws the dithered mark and keeps the headline readable", async ({
    page,
  }) => {
    await page.goto("/");
    const drawn = () =>
      page
        .locator("main canvas")
        .first()
        .evaluate((canvas: HTMLCanvasElement) => {
          const ctx = canvas.getContext("2d");
          if (!ctx || canvas.width === 0) return false;
          const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 3; i < data.length; i += 4)
            if (data[i] !== 0) return true;
          return false;
        });
    await expect.poll(drawn).toBe(true);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "The writing editor that keeps your voice",
      }),
    ).toBeVisible();
  });

  test("the hero runs the real editor with the five sample notes", async ({
    page,
  }) => {
    await page.goto("/");
    const frameNotes = page
      .getByRole("list", { name: "Margin notes" })
      .getByRole("listitem");
    await expect(frameNotes).toHaveCount(5);
    await expect(frameNotes.first()).toContainText("Passive voice");

    await frameNotes
      .first()
      .getByRole("button", { name: /Accept/ })
      .click();
    await expect(page.getByLabel("Sample draft")).toContainText(
      "The team decided the new pricing",
    );
    await expect(frameNotes).toHaveCount(4);
  });

  test("stet in the hero shows the kept message with undo", async ({
    page,
  }) => {
    await page.goto("/");
    const frame = page.getByRole("list", { name: "Margin notes" });
    const utilize = frame
      .getByRole("listitem")
      .filter({ hasText: "Plainer word" });
    await utilize.getByRole("button").first().click();
    await utilize.getByRole("button", { name: /Stet/ }).click();
    await expect(frame.getByText(/Kept\. Margin won.t flag/)).toBeVisible();
    await frame.getByRole("button", { name: "Undo" }).click();
    await expect(
      frame.getByRole("listitem").filter({ hasText: "Plainer word" }),
    ).toBeVisible();
  });

  test("pricing switches between yearly and monthly", async ({ page }) => {
    await page.goto("/pricing");
    const pro = page
      .getByRole("heading", { name: /Most writers/ })
      .locator("..");
    await expect(pro).toContainText("$12");
    await page.getByRole("button", { name: "Monthly" }).click();
    await expect(pro).toContainText("$15");
    await expect(
      pro.getByRole("link", { name: "Start 14-day trial" }),
    ).toHaveAttribute("href", "/signup?plan=pro&period=monthly");
  });

  test("nothing scrolls sideways on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/", "/pricing", "/signup"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("carries none of the banned design tells", async ({ page }) => {
    for (const path of ["/", "/pricing"]) {
      await page.goto(path);
      const problems = await page.evaluate(() => {
        const found: string[] = [];
        for (const el of Array.from(document.querySelectorAll("*"))) {
          const style = getComputedStyle(el);
          if (style.backgroundImage.includes("gradient"))
            found.push(`gradient on ${el.tagName}`);
          // The sticky nav is the one place a blur is allowed.
          if (style.backdropFilter !== "none" && !el.closest("header"))
            found.push(`blur on ${el.tagName}`);
        }
        return found;
      });
      expect(problems, path).toEqual([]);
      const text = await page.locator("body").innerText();
      expect(text).not.toMatch(/\bAI\b|powered by|made with|built with/i);
      expect(text).not.toMatch(
        /revolutioni[sz]e|supercharge|unlock|seamless|effortless|game-changer|cutting-edge/i,
      );
      expect(text).not.toMatch(/\u2014/);
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});
