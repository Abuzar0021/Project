# DESIGN.md: Margin

Design spec for **Margin**, a Grammarly-style writing assistant demo. This file is the single source of truth for visual and interaction decisions. If code and this file disagree, this file wins. If this file is silent, choose the quieter option.

---

## 1. Product concept

**One line:** A writing editor where suggestions live in the margin, the way a copy editor's pencil notes sit beside a manuscript.

**Audience:** People who write for work (emails, reports, docs) and want corrections without losing focus.

**Primary job:** Let the writer fix problems in place, fast, without the interface competing with their text.

**The signature idea (spend boldness here, keep everything else quiet):**
Suggestions are not dumped in a generic right-hand list. Each one is a **margin note pinned to the exact line it refers to**. Notes stack and slide to avoid overlapping, and the active note pulls itself level with its text. This is the memorable element. Everything else in the UI is restrained so this reads clearly.

---

## 2. Design principles

Reference points: **Bear** for the writing surface (warm, quiet, confident use of negative space, nothing decorative) and **Linear** for the interface chrome (precise, custom, no default component-kit look). The fusion: a calm page to write on, wrapped in an interface that feels built, not assembled.

1. **The text is the hero.** Chrome recedes further than in a typical SaaS tool, closer to Bear's restraint than Grammarly's density.
2. **Every mark earns its place.** No decoration that doesn't encode information.
3. **Nothing borrowed from a component kit at default settings.** Every button, card, and input is intentionally spaced and styled, the way Linear's are.
4. **Motion is felt, not seen.** Subtle, physical, never a flourish.
5. **The product never announces that it's a tool, or that AI built it.** It reads as software someone designed, full stop.

---

## 3. Color tokens

Defined as CSS custom properties in `src/styles/tokens.css`. Components never use raw hex values.

### Light theme (default)

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F3F4F1` | App background (cool grey-green, deliberately not cream) |
| `--sheet` | `#FFFFFF` | Writing surface |
| `--ink` | `#1C2127` | Primary text |
| `--ink-muted` | `#5B6470` | Secondary text, metadata |
| `--rule` | `#E2E5E0` | Borders, dividers |
| `--pencil` | `#2449C9` | Primary action, focus ring, active note border |

### Suggestion categories

| Category | Token | Hex | Underline stroke | Meaning |
|---|---|---|---|---|
| Correctness | `--cat-correct` | `#C8372D` | wavy, 1.5px | Spelling, grammar, punctuation |
| Clarity | `--cat-clarity` | `#2466D6` | dotted, 2px | Wordiness, redundancy, long sentences |
| Tone | `--cat-tone` | `#7B4BC4` | dashed, 1.5px | Hedging, intensifiers, passive voice |
| Style | `--cat-style` | `#13806A` | double, 1px | Repetition, variety |

Each category also gets a tint for backgrounds at 10% opacity (`--cat-correct-tint`, etc.), used only for the active mark highlight and the applied-fix flash.

### Dark theme

Same token names, remapped. The primary accent shifts to brass for a matte, premium feel.

| Token | Hex |
|---|---|
| `--paper` | `#16181B` |
| `--sheet` | `#1D2024` |
| `--ink` | `#E7E9EC` |
| `--ink-muted` | `#9AA2AD` |
| `--rule` | `#2C3036` |
| `--pencil` | `#C9A45C` |
| `--cat-correct` | `#F0766B` |
| `--cat-clarity` | `#6FA0F2` |
| `--cat-tone` | `#B18CEB` |
| `--cat-style` | `#4FC2A2` |

Theme follows `prefers-color-scheme`, with a manual toggle stored in `localStorage` that sets `data-theme` on `<html>`.

All text and underline colors must meet WCAG AA contrast against their surface. Verify with a contrast check before finishing each phase that introduces color.

### Flat color only

No gradients anywhere, not even subtle ones: not on buttons, not on backgrounds, not on the score ring. Linear and Bear both use flat color exclusively. A single flat accent color (`--pencil`, brass in dark mode) does everything a gradient would have done, with more restraint.

---

## 4. Typography

| Role | Family | Notes |
|---|---|---|
| Editor text | **Newsreader** (Google Fonts, variable opsz) | Reading-grade serif. The writer's words deserve book-like type. |
| Interface | **Instrument Sans** (Google Fonts) | Crisp, slightly narrow sans for chrome, notes, and buttons. |

Fallback stacks:
- Editor: `"Newsreader", "Iowan Old Style", Georgia, serif`
- UI: `"Instrument Sans", system-ui, -apple-system, "Segoe UI", sans-serif`

Load via `next/font/google` with `display: swap`.

### Type scale

| Token | Size / line-height | Family / weight | Use |
|---|---|---|---|
| `--t-display` | 34 to 44px (fluid) / 1.15 | Newsreader 500 | Marketing page headline only |
| `--t-doc-h1` | 32px / 1.25 | Newsreader 600 | Document title |
| `--t-doc-h2` | 24px / 1.3 | Newsreader 600 | Headings inside the doc |
| `--t-doc-body` | 19px / 1.65 | Newsreader 400 | Editor body |
| `--t-ui-lg` | 16px / 1.4 | Instrument Sans 500 | Panel titles, score number label |
| `--t-ui` | 14px / 1.45 | Instrument Sans 400 | Notes, buttons, most UI |
| `--t-ui-sm` | 12.5px / 1.4 | Instrument Sans 500 | Metadata, counts |
| `--t-score` | 40px / 1 | Instrument Sans 600, tabular nums | Score panel number |

Rules:
- Editor measure: max 68ch.
- Sentence case everywhere. **No all-caps labels.** No tracked-out eyebrow text above headings.
- Use `font-variant-numeric: tabular-nums` for word counts and scores.
- Never use em dashes in UI copy, comments, or docs.

---

## 5. Spacing, radius, elevation

**Spacing scale (px):** 4, 8, 12, 16, 24, 32, 48, 64. Tokens `--s-1` through `--s-8`.

**Radius by hierarchy (not one radius for everything):**
- Sheet: 2px (it is paper, it should feel flat and physical)
- Buttons, inputs, chips: 6px
- Margin notes: 8px
- Popover card, bottom sheet: 12px

**Elevation:**
- Sheet: 1px `--rule` border, no shadow.
- Margin notes: no shadow at rest. Active note: 1.5px `--pencil` border plus `0 4px 16px rgb(28 33 39 / 0.10)`.
- Popover card: `0 1px 2px rgb(28 33 39 / 0.08), 0 8px 28px rgb(28 33 39 / 0.14)`.

No gradients anywhere.

---

## 6. Motion

| Moment | Motion | Duration / easing |
|---|---|---|
| Popover card opens | Fade + 4px rise | 120ms, `cubic-bezier(0.2, 0, 0, 1)` |
| Note becomes active | Slides to its anchor line, border fades in | 180ms, same easing |
| Fix applied | New text gets a category-tint wash that fades out | 600ms, ease-out |
| Note removed | Fade out, remaining notes slide to close the gap | 160ms |

That is the full list. Nothing animates on page load. Under `prefers-reduced-motion: reduce`, all of the above become instant, except the applied-fix wash, which becomes a static tint for 600ms then disappears.

Motion in Bear and Linear is short, physical, and single-purpose: it confirms one state change and disappears. No parallax, no staggered reveals, no bouncy easing. Keep every timing and easing curve above; the discipline is in never adding a new animation "for polish." The one sanctioned exception is the dithered logo on the marketing page hero (8.7), which responds to the pointer and is static under reduced motion.

---

## 7. Layout

### Desktop (1100px and up)

```
+---------------------------------------------------------------------+
| Margin    Untitled draft          [All][Correct][Clarity][Tone][Sty] |
|                                          1,248 words     Score 82 v  |
+---------------------------------------------------------------------+
|  |                                           |                      |
|  |   +-----------------------------------+   |  [note] Possible     |
|m |   |  Weekly product update            |   |   typo  ~~shiped~~   |
|i |   |                                   |   |   shipped            |
|n |   |  Last week our team shiped the    |   |                      |
|i |   |  new onboarding flow. Their was   |   |  [note] Wrong word   |
|m |   |  alot of debate about wether...   |   |   ~~Their~~ There    |
|a |   |                                   |   |                      |
|p |   |                                   |   |  [note] Hedging      |
|  |   +-----------------------------------+   |   "sort of"          |
+---------------------------------------------------------------------+
  ^ 8px issue          ^ sheet, centered,         ^ margin rail, 300px,
    minimap strip        max 68ch text              notes pinned to lines
```

- Left-aligned text inside a centered sheet.
- Rail width 300px, left edge 32px from the sheet.
- Minimap is a thin vertical strip pinned to the left edge of the viewport.
- Top bar: 56px tall, `--sheet` background, bottom border `--rule`.

### Tablet (768 to 1099px)

- Rail collapses to 44px wide: shows only colored dots at each anchor line. Clicking a dot opens the popover card at the mark.
- Minimap stays.

### Mobile (under 768px)

- No rail, no minimap.
- Marks stay inline. Tapping a mark opens the **bottom sheet** version of the suggestion card.
- Category filter becomes a horizontally scrollable chip row.
- Score opens as a full-height sheet.

---

## 8. Components

At least four custom components. None come from a UI kit. Each lives in its own folder with the component, its styles, and a short header comment explaining what it does and why.

### 8.1 Suggestion mark (inline)

Rendered as a ProseMirror inline decoration, not a DOM wrapper component.

| State | Visual |
|---|---|
| Rest | Category underline stroke, `text-underline-offset: 4px` |
| Hover | Underline thickens by 0.5px, cursor pointer |
| Active (card open or note active) | Category tint background, 2px radius |
| Filtered out | No decoration at all |
| Ignored | Removed |

Requirements:
- Stays anchored while the user types anywhere else in the document.
- Disappears immediately if the user edits inside its range (it will be rechecked).

### 8.2 Suggestion card (popover and bottom sheet)

Opens on click of a mark, Enter on a focused note, or keyboard shortcut.

```
+-----------------------------------------+
| (o) Correctness . Possible typo         |
|                                         |
|  ~~shiped~~   shipped                   |
|               shape  ship               |
|                                         |
|  The word may be misspelled.            |
|                                         |
|  [ Apply ]  Dismiss   Ignore this rule  |
+-----------------------------------------+
```

- Header: category dot + category name + short title from the rule.
- Primary replacement shown next to the struck-through original. Up to 2 alternates as secondary buttons.
- One-sentence explanation in plain words (shorten LanguageTool messages, max ~120 chars, full text in a `title` attribute).
- Actions, named consistently through the flow:
  - **Apply** (primary): replaces text. Toast reads "Applied".
  - **Dismiss**: hides this instance only. Toast reads "Dismissed" with **Undo**.
  - **Ignore this rule**: hides all instances of the rule, persisted.
  - For spelling issues, a fourth action: **Add to dictionary**.
- Positioned below the mark, flips above if there is no room. Never covers the mark itself.
- Width 320px. Max 1 card open at a time.
- Esc closes and returns focus to the editor at the mark.
- On mobile this becomes a bottom sheet with the same content and full-width buttons.

### 8.3 Margin rail (the signature component)

A column of margin notes, each vertically aligned with the line its mark sits on.

Note contents (compact):
```
| (o) Possible typo                 |
|     ~~shiped~~ shipped            |
```

Layout algorithm (implemented as a pure function in `src/lib/layout/rail-layout.ts`, fully unit tested):
1. Input: list of `{ id, anchorTop, height }` sorted by `anchorTop`, plus optional `activeId`.
2. Without an active note: place each note at `max(anchorTop, previousBottom + 8)`.
3. With an active note: pin the active note at exactly its `anchorTop`. Lay out notes above it upward (each at `min(anchorTop, nextTop - 8 - height)`), and notes below it downward as in step 2.
4. Output: `{ id, top }` for each note.

Behavior:
- Hovering a note highlights its mark and draws a 1px leader line from note to mark in the category color.
- Clicking a note makes it active, scrolls its mark into view if needed, and expands it to show Apply / Dismiss inline.
- Notes for filtered-out categories are hidden and the layout reflows.
- Recalculates on: document change, window resize, font load, filter change. Batch recalcs into one `requestAnimationFrame`.
- Must stay smooth (no visible jank) with 150 notes.

### 8.4 Issue minimap

An 8px wide vertical strip on the left edge of the viewport.

- Represents the entire document height.
- Each issue is a 2 to 3px tall tick at its relative position, in its category color.
- A translucent `--ink` window at 8% opacity shows the currently visible region.
- Click or drag anywhere to scroll the document there.
- Hover shows a tiny tooltip with the count of issues in that region.
- Hidden below 768px.

### 8.5 Score panel

Opened from the score button in the top bar. Anchored dropdown on desktop, full sheet on mobile.

```
+------------------------------------+
|  82                                |
|  Overall score                     |
|                                    |
|  Correctness   ########--   4      |
|  Clarity       #########-   2      |
|  Tone          ######----   6      |
|  Style         #########-   1      |
|                                    |
|  Reading level     Grade 9         |
|  Avg sentence      18 words        |
|  Passive voice     3 sentences     |
|  Tone reads as     Tentative       |
|                                    |
|  Scores are estimates based on     |
|  the issues found, not a grade     |
|  of your writing.                  |
+------------------------------------+
```

- Bars are simple filled rects, category colored, no rounded pills.
- Clicking a category row filters the editor to that category.
- Score updates live but debounced (same cadence as checking).

### 8.6 Status indicator

Small text in the top bar next to the word count.

| State | Copy |
|---|---|
| Idle, all checked | "All checked" |
| Checking | "Checking..." (only shown if a check takes longer than 400ms) |
| Checker unreachable | "Checking paused. Can't reach the checker, retrying in 10s." |
| Document empty | Nothing shown |

### 8.7 Logo mark

A simple two-shape glyph, not a wordmark alone, not an icon-heavy symbol. It states the product's core relationship visually: a solid bar (the page's edge) beside a solid dot (a note pinned to it), the same relationship every margin note in the app draws between text and its annotation.

- **Shapes:** one rounded vertical bar, one filled circle positioned beside it. Solid fills only, both shapes the same flat color, `--ink`. `--ink` already inverts with the theme (near black in light mode, near white in dark mode), so the mark never stays fixed black on a dark page.
- **No gradient, no outline-only version, no drop shadow.** The mark must survive rendering as a flat silhouette at 16px (browser tab favicon) as easily as at 240px.
- **Source file:** `public/margin-mark.svg`, solid black on a transparent background. It is the `imageSrc` input to the dithered logo (adapted from Componentry's `@componentry/dithered-logo`, vendored at `src/components/marketing/DitheredLogo.tsx`) on the marketing page hero, and is rendered as a flat static SVG everywhere else (top bar, favicon, app icon).
- **Where the dithered, interactive version appears:** only on the marketing page hero, once, as the signature moment. Never inside the app itself. The editor's top bar uses the plain flat SVG, per section 2's rule that chrome recedes and never performs for its own sake.
- **Wordmark pairing:** "Margin" set in Instrument Sans, sentence case, medium weight, sitting to the right of the mark with consistent optical spacing. No tagline stacked underneath it in the primary lockup.

---

## 9. Empty, loading, and error states

- **Empty document:** placeholder in the editor: "Start writing, or paste a draft. Suggestions appear in the margin." Rail shows nothing.
- **No issues found:** rail shows a single quiet line at the top: "No suggestions right now."
- **Checker down:** existing marks stay, status indicator explains, automatic retry with backoff (10s, 20s, 40s, cap 60s).
- **Very long paste (over 50,000 characters):** check the visible region first, then the rest in the background.

Errors never apologize and are never vague. They say what happened and what the user can do.

---

## 10. Keyboard map

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + J` | Jump to next suggestion (opens its card) |
| `Ctrl/Cmd + Shift + J` | Previous suggestion |
| `Enter` (card open) | Apply primary replacement |
| `1`, `2`, `3` (card open) | Apply that replacement |
| `D` (card open) | Dismiss |
| `Esc` | Close card, return focus to editor |
| `Ctrl/Cmd + Z` | Undo, including undoing an applied fix |

Show a small "Keyboard shortcuts" link in the top bar that opens a simple sheet listing these.

---

## 11. Accessibility floor

- Visible focus ring on everything: 2px `--pencil` outline, 2px offset.
- Marks have `aria-describedby` pointing to a visually hidden description ("Correctness suggestion: possible typo").
- Rail is a `role="list"`; notes are `role="listitem"` with buttons inside.
- Card uses `role="dialog"` with a label. Focus moves into it when opened by keyboard.
- Announce "Applied" / "Dismissed" through an `aria-live="polite"` region.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Target sizes at least 32px on desktop, 44px on touch.

---

## 12. Copy guidelines

- Plain verbs, sentence case, no filler.
- Same name for the same action everywhere: Apply produces "Applied".
- Name things by what users understand ("Ignore this rule"), never by implementation ("Disable LT rule ID").
- No em dashes. No arrows appended to buttons. No middle-dot meta strings in body copy (the single dot in the card header is the one exception, as a category separator).

---

## 13. Things that must not appear

These are the tells of templated or AI-generated UI. Reject them in review.

- Identical rounded cards with the same grey shadow everywhere
- Gradient washes or glassmorphism
- All-caps tracked eyebrow labels
- `01 / 02 / 03` numbering on things that are not a sequence
- Fade-and-slide-up on every section load
- One word in a headline set in a different color or italic
- Generic shadcn / component-kit look left at defaults
- Monospace used just to look technical
- Stock icons for everything; use icons only where they add meaning (category dot, close, chevron)

Beyond that list, explicitly exclude the specific tells that make a product look AI-generated to someone looking for it:

- **No "AI" badges, pills, or chips anywhere in the UI.** No small purple or blue rounded tag reading "AI" or "Powered by AI" next to any feature. The product doesn't need to announce its own mechanism.
- **No sparkle, wand, or magic-star icons.** These are the single most recognizable AI-tool visual cliché as of 2026. Use plain, literal icons only (a checkmark, a pencil, a dot), never a glowing star or sparkle glyph for "smart" features.
- **No gradient buttons, gradient text, or gradient backgrounds**, purple-to-blue or otherwise. Flat color only, per section 3.
- **No glassmorphism** (frosted, blurred translucent panels). Linear and Bear both use solid, flat surfaces.
- **No watermark, badge, or "made with" credit line of any kind** in the footer, corner, or loading screen. Nothing that names a tool, platform, or framework used to build the product.
- **No generic centered-hero-with-gradient-CTA layout.** That composition (big centered headline, one paragraph, one gradient button, soft blurred shapes floating behind) is the default output of nearly every AI page-builder and is recognizable on sight.
- **No default shadcn/ui, Tailwind UI, or component-kit styling left unmodified.** If a component's shadow, radius, or spacing matches an off-the-shelf kit's defaults exactly, it hasn't been designed, it's been assembled. Every component in this spec is custom per section 8.
- **No emoji in interface copy, buttons, or empty states.** Plain, direct language only, per section 12.
- **No loading skeletons with shimmer gradients.** Use a plain, flat, low-opacity placeholder instead, no animated sheen.

The test before shipping any screen: would this be at home in Bear or Linear's own UI? If it reads as "clearly a modern web app template" rather than "clearly this specific product," it fails and gets redesigned, not just recolored.

---

## 14. Marketing page

A single page, standalone from the app, built with the same tokens and typography as the product, not a different "landing page template" aesthetic layered on top. It lives at `/`; the editor lives at `/app`.

### Hero

Explicitly avoids the generic pattern banned in section 13 (centered headline, one paragraph, gradient button, soft blurred shapes). Instead:

- **Two-column layout**, not centered. Left: the wordmark plus the dithered logo mark (interactive, per 8.7), a headline, one sentence of subtext, and a single primary button. Right: a real screenshot of the actual product mid-use, showing real text with a real margin note pinned beside it, cursor visible mid-interaction. Not an illustration, not an abstract shape: the actual interface doing the thing the product does.
- **Headline:** states the mechanism plainly, does not oversell. Something in the register of "Suggestions that live where you're writing, not where they get in the way." No "revolutionize," "supercharge," or "unlock" language.
- **Subtext:** one sentence, plain, no bullet list of adjectives.
- **Primary button:** single action, "Open the editor", flat color, no gradient, no icon.
- **No secondary "Watch a demo" button, no logos-of-companies-that-trust-us row.** This product has no customers yet; a fabricated trust row would itself be a tell.

### Below the fold

- **Three feature sections max**, each pairing one sentence of copy with one real screenshot or a small interactive fragment of the actual UI, never a stock illustration or icon grid.
- **One section addresses the actual differentiation directly** (the margin-note approach vs. a popup sidebar), since this is the single clearest thing that separates the product from Grammarly. The copy from the original proposal to Callum already states this well; reuse it.
- **No pricing section** until pricing is finalized.
- **Footer:** minimal. No "made with" credit, no social icon row unless real accounts exist to link to.

### What this page must not do

Everything in section 13 applies here in full, and additionally: no auto-playing background video, no scroll-triggered stagger animations on any section (motion stays purposeful per section 6, not decorative), no fake testimonial quotes.
