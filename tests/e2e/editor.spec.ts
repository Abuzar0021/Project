import { test, expect } from "@playwright/test";
import { notes, openSampleDraft } from "./helpers";

test.describe("the editor", () => {
  test("shows notes beside the text in three categories", async ({ page }) => {
    await openSampleDraft(page);
    await expect(notes(page).filter({ hasText: "Spelling" })).toContainText(
      "receive",
    );
    await expect(notes(page).filter({ hasText: "Wordy" })).toBeVisible();
    await expect(
      notes(page).filter({ hasText: "Not your voice" }),
    ).toContainText("We'll");
    await expect(page.locator(".mark-spelling")).toHaveText("recieve");
    await expect(page.locator(".mark-voice")).toHaveCount(1);
  });

  test("J moves between notes and Enter accepts", async ({ page }) => {
    await openSampleDraft(page);
    const spelling = notes(page).filter({ hasText: "Spelling" });
    const accept = spelling.getByRole("button", { name: /Accept/ });

    // Focus starts outside the text, so single-letter keys drive the notes.
    for (let i = 0; i < 10 && !(await accept.isVisible()); i++) {
      await page.keyboard.press("j");
    }
    await expect(accept).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Draft text")).toContainText(
      "you will receive",
    );
    await expect(spelling).toHaveCount(0);
  });

  test("S keeps your version and remembers it", async ({ page }) => {
    await openSampleDraft(page);
    const plainer = notes(page).filter({ hasText: "Plainer word" });
    await plainer.getByRole("button").first().click();
    await plainer.getByRole("button", { name: /Stet/ }).click();
    await expect(page.getByText(/Kept\. Margin won.t flag/)).toContainText(
      "in any of your drafts",
    );
    await expect(page.getByLabel("Draft text")).toContainText("utilize");

    await page.goto("/app/settings");
    await expect(
      page.getByRole("region", { name: "Kept suggestions" }),
    ).toContainText("utilize");
  });

  test("autosaves the title and the text", async ({ page }) => {
    await openSampleDraft(page);
    await page.getByLabel("Draft title").fill("Pricing update, final");
    await page.getByLabel("Draft text").click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type(" Saved line.");
    await expect(
      page.getByRole("status").filter({ hasText: /^Saved$/ }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Draft title")).toHaveValue(
      "Pricing update, final",
    );
    await expect(page.getByLabel("Draft text")).toContainText("Saved line.");
  });

  test("the command bar opens with Ctrl K and makes a new draft", async ({
    page,
  }) => {
    await openSampleDraft(page);
    await page.keyboard.press("Control+k");
    const bar = page.getByRole("dialog", { name: "Command bar" });
    await expect(bar).toBeVisible();
    await bar.getByPlaceholder("Type a command or search").fill("new draft");
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Draft title")).toHaveValue("");
    await expect(page.getByText("Nothing to fix.")).toBeVisible();
  });

  test("rhythm and theme toggles stick", async ({ page }) => {
    await openSampleDraft(page);
    const rhythm = page.getByRole("button", { name: "Rhythm" });
    await expect(rhythm).toHaveAttribute("aria-pressed", "true");
    await rhythm.click();
    await expect(rhythm).toHaveAttribute("aria-pressed", "false");

    await page.getByRole("button", { name: "Switch light or dark" }).click();
    await expect(page.locator(".app").first()).toHaveAttribute(
      "data-theme",
      "light",
    );
    await page.reload();
    await expect(page.locator(".app").first()).toHaveAttribute(
      "data-theme",
      "light",
    );
    await expect(page.getByRole("button", { name: "Rhythm" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("the Free plan shows spelling only", async ({ page }) => {
    await openSampleDraft(page, "free");
    await expect(notes(page)).toHaveCount(1);
    await expect(notes(page).first()).toContainText("Spelling");
    await expect(page.getByRole("button", { name: "Rhythm" })).toHaveCount(0);
    await expect(page.getByText("Sounds like you")).toHaveCount(0);
  });

  test("drafts list, tags and delete", async ({ page }) => {
    await openSampleDraft(page);
    await page
      .getByRole("navigation", { name: "Drafts" })
      .getByRole("link", { name: /# launch/ })
      .click();
    await expect(page.getByRole("heading", { name: "# launch" })).toBeVisible();
    const row = page
      .locator("main")
      .getByRole("link", { name: /Onboarding email 2/ });
    await expect(row).toBeVisible();

    await row.click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.keyboard.press("Control+k");
    await page.getByPlaceholder("Type a command or search").fill("delete");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/app\/d\//);
    await expect(
      page.getByRole("navigation", { name: "Drafts" }),
    ).not.toContainText("Onboarding email 2");
  });
});
