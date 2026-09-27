/**
 * capture-screenshots.mjs: regenerate every product image from the real app.
 *
 * Writes:
 * - public/marketing/<shot>-<theme>.png   crops used by the marketing page (2x)
 * - src/components/marketing/shots.json   pixel sizes of those crops
 * - docs/screenshots/<theme>-<width>.png  full-window captures for the docs
 * - src/app/apple-icon.png                the iOS home screen icon (DESIGN 8.7)
 *
 * Usage: start the app (pnpm build && pnpm start, or pnpm dev), then run
 *   node scripts/capture-screenshots.mjs
 * BASE_URL overrides the default http://localhost:3000, and
 * PLAYWRIGHT_CHROMIUM_PATH runs a specific Chromium instead of Playwright's own.
 *
 * The checker is stubbed with the matches LanguageTool returns for the sample
 * draft, so captures are deterministic and need no LanguageTool server. The
 * tone, clarity, and style notes come from the app's own local rules.
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const THEMES = ["light", "dark"];
const DPR = 2;

// What LanguageTool reports for the sample draft's deliberate mistakes.
const LT_FIXTURE = [
  {
    needle: "shiped",
    message: "Possible spelling mistake found.",
    replacements: ["shipped", "shaped"],
    rule: {
      id: "MORFOLOGIK_RULE_EN_US",
      issueType: "misspelling",
      category: { id: "TYPOS" },
    },
  },
  {
    needle: "Their was",
    message: 'Did you mean "There was"?',
    replacements: ["There was"],
    rule: { id: "THEIR_IS", issueType: "grammar", category: { id: "GRAMMAR" } },
  },
  {
    needle: "alot",
    message: "Possible spelling mistake found.",
    replacements: ["a lot"],
    rule: {
      id: "MORFOLOGIK_RULE_EN_US",
      issueType: "misspelling",
      category: { id: "TYPOS" },
    },
  },
  {
    needle: "wether",
    message: "Possible spelling mistake found.",
    replacements: ["whether", "weather"],
    rule: {
      id: "MORFOLOGIK_RULE_EN_US",
      issueType: "misspelling",
      category: { id: "TYPOS" },
    },
  },
  {
    needle: "untill",
    message: "Possible spelling mistake found.",
    replacements: ["until"],
    rule: {
      id: "MORFOLOGIK_RULE_EN_US",
      issueType: "misspelling",
      category: { id: "TYPOS" },
    },
  },
  {
    needle: "the the",
    message: "Possible typo: you repeated a word.",
    replacements: ["the"],
    rule: {
      id: "ENGLISH_WORD_REPEAT_RULE",
      issueType: "duplication",
      category: { id: "MISC" },
    },
  },
];

async function stubChecker(page) {
  await page.route("**/api/check", async (route) => {
    const text = route.request().postDataJSON()?.text ?? "";
    const matches = [];
    for (const m of LT_FIXTURE) {
      const offset = text.indexOf(m.needle);
      if (offset < 0) continue;
      matches.push({
        offset,
        length: m.needle.length,
        message: m.message,
        replacements: m.replacements,
        rule: m.rule,
      });
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ matches }),
    });
  });
}

/** Open the editor with the sample draft and wait until every note is placed. */
async function openEditor(context) {
  const page = await context.newPage();
  await stubChecker(page);
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await page.locator(".margin-mark--correctness").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  // Rail layout settles on the next animation frames after the last check.
  await page.waitForTimeout(1200);
  return page;
}

const rectOf = (page, selector) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    });

/** Bounding rect of a substring inside the editor, found through a DOM Range. */
const textRect = (page, needle) =>
  page.evaluate((needle) => {
    const root = document.querySelector(".ProseMirror");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const at = node.textContent.indexOf(needle);
      if (at < 0) continue;
      const range = document.createRange();
      range.setStart(node, at);
      range.setEnd(node, at + needle.length);
      const r = range.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }
    throw new Error(`text not found: ${needle}`);
  }, needle);

const clip = (left, top, right, bottom) => ({
  x: Math.round(left),
  y: Math.round(top),
  width: Math.round(right - left),
  height: Math.round(bottom - top),
});

const railNote = (page, text) =>
  page.getByRole("listitem").filter({ hasText: text }).first();

/** Each marketing shot: set up one real interaction, return the crop. */
const SHOTS = {
  // Real text, a real note pinned beside it, the caret in the text, and the
  // pointer resting on a note so its leader line is drawn to the mark.
  async hero(page) {
    const word = await textRect(page, "debate");
    await page.mouse.click(word.right - 1, (word.top + word.bottom) / 2);
    const note = railNote(page, "sort of");
    await note.hover();
    // Arrow keys restart the caret blink, so the caret is on when we capture.
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    const sheet = await rectOf(page, '[class*="EditorShell_sheet"]');
    const text = await rectOf(page, ".ProseMirror");
    const rail = await rectOf(page, 'aside[aria-label="Suggestions"]');
    const box = await note.boundingBox();
    // Start just left of the text rather than at the sheet's edge: the crop
    // stays near 1:1 on the page, so the notes stay readable.
    return clip(
      text.left - 32,
      sheet.top - 24,
      rail.left + 316,
      Math.max(sheet.top + 500, box.y + box.height + 32),
    );
  },

  // The differentiation: an active note, expanded in place beside its line.
  async rail(page) {
    const note = railNote(page, "Possible typo");
    await note.getByText("Possible typo").click();
    // Park the pointer so no hover leader line crosses the text.
    await page.mouse.move(2, 2);
    await page.waitForTimeout(400);
    const sheet = await rectOf(page, '[class*="EditorShell_sheet"]');
    const text = await rectOf(page, ".ProseMirror");
    const rail = await rectOf(page, 'aside[aria-label="Suggestions"]');
    const box = await note.boundingBox();
    return clip(
      text.left - 32,
      sheet.top - 24,
      rail.left + 316,
      Math.max(box.y + box.height, sheet.top + 260) + 40,
    );
  },

  // The suggestion card opened from a mark.
  async card(page) {
    await page
      .locator(".margin-mark--correctness", { hasText: "wether" })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    // Park the pointer so the hovered mark does not draw a leader line.
    await page.mouse.move(2, 2);
    await page.waitForTimeout(300);
    const text = await rectOf(page, ".ProseMirror p");
    const card = await dialog.boundingBox();
    // Start at the text's left edge and the first paragraph, so no word or
    // heading is sliced by the crop.
    return clip(
      text.left - 24,
      text.top - 16,
      card.x + card.width + 40,
      card.y + card.height + 32,
    );
  },

  // The four underline strokes, one per category.
  async marks(page) {
    await page.mouse.move(2, 2);
    const first = await rectOf(page, ".ProseMirror p");
    const last = await page
      .locator(".ProseMirror p")
      .last()
      .evaluate((el) => el.getBoundingClientRect().bottom);
    const sheet = await rectOf(page, '[class*="EditorShell_sheet"]');
    return clip(sheet.left + 8, first.top - 20, sheet.right - 8, last + 12);
  },
};

async function captureMarketing(browser) {
  await mkdir(join(ROOT, "public/marketing"), { recursive: true });
  const sizes = {};
  for (const theme of THEMES) {
    for (const [name, setUp] of Object.entries(SHOTS)) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: DPR,
        colorScheme: theme,
      });
      const page = await openEditor(context);
      const region = await setUp(page);
      await page.screenshot({
        path: join(ROOT, `public/marketing/${name}-${theme}.png`),
        clip: region,
        caret: "initial",
        animations: "disabled",
      });
      sizes[name] = { width: region.width * DPR, height: region.height * DPR };
      await context.close();
      console.log(`marketing ${name}-${theme}`);
    }
  }
  await writeFile(
    join(ROOT, "src/components/marketing/shots.json"),
    `${JSON.stringify(sizes, null, 2)}\n`,
  );
}

async function captureDocs(browser) {
  for (const theme of THEMES) {
    for (const width of [1440, 900, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        colorScheme: theme,
      });
      const page = await openEditor(context);
      await page.mouse.move(2, 2);
      await page.screenshot({
        path: join(ROOT, `docs/screenshots/${theme}-${width}.png`),
      });
      await context.close();
      console.log(`docs ${theme}-${width}`);
    }
  }
}

// The iOS icon needs an opaque raster, so it is the flat mark on --paper.
async function captureAppleIcon(browser) {
  const page = await browser.newPage({ viewport: { width: 180, height: 180 } });
  await page.setContent(`<!doctype html>
<html><body style="margin:0;width:180px;height:180px;display:grid;place-items:center;background:#f3f4f1">
<svg width="120" height="120" viewBox="0 0 32 32"><rect x="6.5" y="5" width="7" height="22" rx="3.5" fill="#1c2127"/><circle cx="21" cy="11" r="4.5" fill="#1c2127"/></svg>
</body></html>`);
  await page.screenshot({ path: join(ROOT, "src/app/apple-icon.png") });
  await page.close();
  console.log("apple-icon");
}

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
});
try {
  await captureMarketing(browser);
  await captureDocs(browser);
  await captureAppleIcon(browser);
} finally {
  await browser.close();
}
