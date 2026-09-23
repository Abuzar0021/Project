/**
 * Phase 6 e2e: the issue minimap. Clicking near the bottom of the strip scrolls
 * the document toward that region. A long document is seeded so there is
 * something to scroll.
 */
import { test, expect, type Page } from "@playwright/test";

async function seedLongDoc(page: Page): Promise<void> {
  const paras = [
    "Last week our team shiped the new onboarding flow. Their was alot of debate about wether we should keep the old checklist.",
    "The report was written by the analytics team and it was reviewed by the product team and it was then sent to the leadership group who asked for changes.",
    "Next steps: collect feedback, fix the the edge cases, and share results on Friday.",
  ];
  const content: unknown[] = [];
  for (let i = 0; i < 20; i++) {
    content.push({
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: `Section ${i + 1}` }],
    });
    for (const t of paras)
      content.push({ type: "paragraph", content: [{ type: "text", text: t }] });
  }
  const doc = { type: "doc", content };
  await page.addInitScript((d) => {
    try {
      localStorage.setItem(
        "margin-draft",
        JSON.stringify({ doc: d, title: "Long draft" }),
      );
    } catch {
      /* ignore */
    }
  }, doc);
}

test("clicking the minimap scrolls the document", async ({ page }) => {
  await page.route("**/api/check", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ matches: [] }),
    }),
  );
  await seedLongDoc(page);
  await page.goto("/");
  await page.waitForTimeout(500);

  const workspace = page.getByTestId("workspace");
  const before = await workspace.evaluate((el) => el.scrollTop);

  const minimap = page.getByTestId("issue-minimap");
  const box = await minimap.boundingBox();
  if (!box) throw new Error("minimap not found");
  await page.mouse.click(box.x + 4, box.y + box.height - 12);
  await page.waitForTimeout(200);

  const after = await workspace.evaluate((el) => el.scrollTop);
  expect(after).toBeGreaterThan(before);
});
