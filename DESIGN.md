# Margin: DESIGN.md

The single source of truth for how Margin looks, reads and behaves. This version replaces every earlier DESIGN.md and DESIGN-update.md. If code and this file disagree, this file wins. If this file is silent, match `reference/prototype.html`.

`reference/prototype.html` is a working clickable prototype of every screen described here. Open it in a browser before building anything. Copy its values (colors, sizes, spacing, copy) exactly. Do not copy its code structure; it is one HTML file, the product is a Next.js app.

---

## 1. Product in one paragraph

Margin is a writing editor that checks spelling, clarity and tone, and leaves short notes in the margin beside the text instead of in a popup or sidebar. It learns how the user writes from their past drafts and flags edits that would make them sound generic. It remembers every suggestion the user rejects ("stet") so it never nags twice.

### Signature features (the things that make it look like no other product)

1. **Margin notes.** Suggestions sit in a right-hand column, each aligned to the line it refers to.
2. **Rhythm gutter.** A left-hand column with one horizontal bar per sentence. Bar length is word count. Sentences over 30 words turn amber.
3. **Sounds like you.** A voice meter in the top bar, driven by a voice profile built from the user's own writing, and a "Not your voice" note category.
4. **Stet memory.** Rejecting a suggestion with Stet stores it. The same suggestion is never shown again for that user.

### Design references

- **Linear** for everything outside the writing page: typography, marketing site, sidebar, command bar, keyboard-first behavior, density, dark-first color.
- **Bear** for the writing page itself: calm, wide margins, nothing moving while you type.
- **Grammarly** for the checking model: category-coded underlines, one suggestion at a time, accept or dismiss.

---

## 2. Principles

1. The text is the hero. Interface chrome is quiet, small and precise.
2. Every visual element encodes information. No decoration.
3. Keyboard first. Every action in the editor has a key.
4. Nothing looks like a component kit. Every component is styled from the tokens in this file.
5. The product never announces that it uses AI.
6. Plain language. Say what happens, in as few words as possible.

---

## 3. Things that must never appear

Any of these in a PR is a bug.

- "AI" badges, pills, chips or labels. No "Powered by AI", no "AI-powered".
- Sparkle, magic wand, stars, or glowing icons.
- Gradients of any kind on buttons, text, backgrounds, borders or charts. The only exception is the single soft glow shadow under the landing page product frame (section 8.2).
- Glassmorphism panels. The sticky nav's background blur is the only blur allowed.
- Purple-to-blue anything.
- Emoji in interface copy, buttons, headings or empty states.
- A centered hero with a gradient button and floating blurred shapes.
- Unmodified shadcn/ui, Radix Themes, Tailwind UI, DaisyUI, MUI or Chakra styling. Headless primitives (Radix Primitives, cmdk) are fine; their look must come from this file.
- Shimmer or animated gradient loading skeletons. Use flat placeholders at low opacity.
- Scroll-triggered fade-in or stagger animations on marketing sections. Content is visible at rest.
- Fake social proof: customer logo rows, testimonials, user counts. The product has no customers yet.
- "Made with", "Built with", framework or tool credits anywhere.
- Words: revolutionize, supercharge, unlock, seamless, effortless, elevate, empower, game-changer, cutting-edge, magic.
- Em dashes in any interface copy. Use a comma, a period or a colon.
- A numeric "writing score" out of 100. The voice meter replaces it.

---

## 4. Color tokens

Define these as CSS custom properties. Tailwind (if used) must read from them; never use Tailwind's default palette classes like `bg-gray-900` or `text-indigo-500`.

### 4.1 Marketing and auth (dark only, like Linear)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#08090A` | Page background |
| `--bg-2` | `#0E0F11` | Inputs, raised areas, product frame |
| `--panel` | `#121316` | Small panels |
| `--panel-2` | `#17181B` | Buttons on dark (OAuth) |
| `--line` | `rgba(255,255,255,.08)` | Borders, dividers, grid gaps |
| `--line-2` | `rgba(255,255,255,.14)` | Stronger borders, secondary buttons |
| `--tx` | `#F7F8F8` | Primary text, primary button fill |
| `--tx-2` | `#8A8F98` | Secondary text, nav links |
| `--tx-3` | `#5E626A` | Tertiary text, fine print |
| `--accent` | `#8C9EFF` | Focus rings, "Most writers" tag, sparing highlights |

Marketing pages have no light theme.

### 4.2 App (dark default, light optional)

| Token | Dark | Light |
|---|---|---|
| `--app` | `#0E0F11` | `#F4F4F2` |
| `--side` | `#121316` | `#EFEFEC` |
| `--page` | `#16171A` | `#FFFFFF` |
| `--ink` | `#E4E5E9` | `#1B1B1F` |
| `--ink-2` | `#9A9CA5` | `#5E5F66` |
| `--ink-3` | `#63656D` | `#9A9BA1` |
| `--rule` | `#24262B` | `#E3E3DF` |
| `--hover` | `#1D1F23` | `#E7E7E3` |
| `--ac` | `#8C9EFF` | `#3552D4` |
| `--ac-soft` | `rgba(140,158,255,.12)` | `rgba(53,82,212,.09)` |
| `--spell` | `#F0766E` | `#C23A34` |
| `--clar` | `#8C9EFF` | `#3552D4` |
| `--voice` | `#4CC2AE` | `#17806F` |
| `--warn` | `#E3A948` | `#B7791F` |
| `--bar` | `#34373E` | `#C9CAD0` |

Theme preference is stored per user (database, not localStorage only) with values `system | dark | light`. Default `dark`.

---

## 5. Typography

Linear's typography: Inter for everything, a tighter display cut for large headings, negative tracking that grows with size, medium weights instead of bold.

### 5.1 Faces

Load with `next/font/google`, self-hosted, `display: swap`.

- **Inter** (400, 500, 600): all UI and body text, including the writing page. Enable OpenType features `"cv11", "ss01", "ss03"` on `body`.
- **Inter Tight** (500, 600): display headings only (d1, d2, d3, document title, logo wordmark).
- **JetBrains Mono** (400, 500): keyboard hints, counts, percentages, word counts.

No other fonts. No serif anywhere.

### 5.2 Scale

| Name | Face | Size | Weight | Line height | Tracking |
|---|---|---|---|---|---|
| d1 | Inter Tight | `clamp(44px, 7vw, 84px)` | 500 | 1.0 | -0.035em |
| d2 | Inter Tight | `clamp(32px, 4.4vw, 52px)` | 500 | 1.05 | -0.03em |
| d3 | Inter Tight | 20px | 500 | 1.25 | -0.015em |
| price | Inter Tight | 44px | 500 | 1.0 | -0.03em, tabular numbers |
| doc-title | Inter Tight | 30px | 600 | 1.2 | -0.025em |
| lead | Inter | `clamp(17px, 1.6vw, 20px)` | 400 | 1.5 | 0 |
| body (marketing) | Inter | 15px | 400 | 1.55 | 0 |
| nav link | Inter | 14.5px | 400 | 1 | 0 |
| writing page | Inter | 17px | 400 | 1.75 | -0.006em, max 64ch |
| note fix text | Inter | 14.5px | 400 | 1.45 | 0 |
| app UI | Inter | 13px | 400/500 | 1.45 | 0 |
| app small | Inter | 11.5 to 12.5px | 400/500 | 1.4 | 0 |
| mono | JetBrains Mono | 11 to 13px | 400/500 | 1 | 0 |

Headings use `text-wrap: balance`. Numbers that line up use `font-variant-numeric: tabular-nums`.

---

## 6. Shape, spacing, elevation

- Spacing unit 4px. Common gaps: 4, 6, 8, 10, 14, 18, 24, 28, 32, 40, 56, 72.
- Radius: 5px small app buttons, 6px app chips and sidebar items, 8px inputs and marketing buttons, 10px small panels, 12px command bar, 14px large marketing panels and product frame, 999px pill buttons (nav Sign up, billing toggle).
- Borders do the separating. Shadows only on: the active margin note, the command bar, and the landing product frame.
- Grids of panels use the Linear technique: container background `--line`, `gap: 1px`, cells filled with `--bg`. This gives hairline dividers without doubled borders.
- Max content width on marketing: 1200px with side padding `clamp(16px, 4vw, 32px)`.

---

## 7. Motion

Short, single-purpose, never decorative.

| What | Duration | Easing |
|---|---|---|
| Hover color changes | 150ms | ease |
| Margin note moving to new position | 250ms | cubic-bezier(.2,.7,.2,1) |
| Accept: strikethrough appears, then replacement text | 280ms before swap | ease |
| Replacement text highlight fading out | 1200ms | ease |
| Note fading out after resolve | 200ms | ease |
| Stet memory confirmation | visible 6s, fades 300ms | ease |
| Voice meter width change | 400ms | ease |

Everything respects `prefers-reduced-motion: reduce` by removing transitions and animations.

---

## 8. Marketing site

Routes: `/` landing, `/pricing`. Placeholder routes `/changelog`, `/contact`, `/privacy`, `/terms` render a simple page with the nav, a d1 heading and "Coming soon." in `--tx-2`.

### 8.1 Nav (all marketing pages)

- Sticky, height 64px, background `rgba(8,9,10,.82)` with `backdrop-filter: saturate(1.4) blur(12px)`, 1px bottom border `--line`.
- Left: logo mark (20px) + "Margin" in Inter Tight 18px 600, tracking -0.02em.
- Right, in order: links Product, Pricing, Changelog, Contact (pill-shaped hover and active state: `rgba(255,255,255,.06)` background, text goes `--tx`), a 1px x 20px vertical divider, "Log in" text link, "Sign up" pill button (fill `--tx`, text `--bg`, 999px radius, 8px 16px padding, weight 500).
- Below 900px: hide links and divider, keep Log in and Sign up.

### 8.2 Landing page `/`

In order, each section separated by a 1px `--line` top border and `clamp(72px,10vw,120px)` vertical padding:

1. **Hero.** Left-aligned, not centered.
   - d1: "The writing editor / that keeps your voice" (line break after "editor" on desktop).
   - Row below with space-between: lead paragraph left ("Margin checks spelling, clarity and tone, then leaves short notes beside your text. It learns how you write, so its edits sound like you."), and right-aligned "**New** Stet memory →" link.
   - Product frame: the real editor component running in demo mode with sample data, 600px tall, 1px `--line-2` border, 14px radius, `box-shadow: 0 40px 120px -40px rgba(140,158,255,.18)`. This must be the actual `<Editor>` component, not a screenshot, so it stays correct as the editor changes. It is interactive (click notes, accept, stet) but does not capture global keyboard shortcuts.
2. **Feedback where you're already looking.** Two-column header (d2 left, lead right, aligned to bottom). Below it a 2x2 hairline grid (section 6) of four cells: Notes in the margin, Sentence rhythm, Sounds like you, Stet memory. Each cell: d3 title, one sentence in `--tx-2`, then a small live visual pinned to the bottom (a note card, rhythm bars, voice meter, stet confirmation). Copy is in the prototype.
3. **Built for the keyboard.** Two-column header, then a wrapping row of key chips (J K, Enter, S, R, ⌘K) each with a label.
4. **Your drafts stay yours.** Two-column header, then three columns: "No training on your text", "Delete means gone", "Cancel in one click". These are product promises; each must be true in the implementation.
5. **Closing CTA.** d2 "Write your next draft in Margin" left, "See pricing →" and Sign up pill right.
6. **Footer.** Four columns: logo; Product (Features, Pricing, Changelog); Company (About, Contact); Legal (Privacy, Terms). No social icons unless real accounts exist. No credit line.

### 8.3 Pricing `/pricing`

- d1 "Pricing", lead "Start free. Upgrade when Margin has learned enough of your voice to be worth it."
- Billing toggle pill (Yearly with green "−20%" note / Monthly). Default Yearly.
- Three plans in a hairline grid. Pro cell uses `--bg-2` and a white filled button; others use outline buttons.
  - Free, $0: Spelling and grammar, Margin notes, Up to 20 drafts, Light and dark themes. Button "Get started".
  - Pro, $12 yearly / $15 monthly, "Most writers" tag in `--accent`: Everything in Free, Clarity and tone notes, Sentence rhythm, Sounds-like-you voice profile, Stet memory across drafts, Unlimited drafts. Button "Start 14-day trial".
  - Team, $18 yearly / $22 monthly per member: Everything in Pro, Shared style guide, Team word list and stet list, Admin and billing controls, Google sign-in for the whole team. Button "Start 14-day trial".
  - Prices are placeholders until the client confirms. Keep them in one config file.
- Comparison table with group rows (Checking, Your voice, Workspace). Table scrolls horizontally inside its own container on narrow screens.
- Questions: two-column grid of four Q&As (copy in prototype).
- Checklist bullets are drawn with CSS (a rotated L), not an icon font or emoji.

---

## 9. Auth and onboarding

All auth pages: full-height centered column, max width 360px (onboarding 420px), dark marketing tokens.

- **Sign up `/signup`:** logo mark 32px (links home), h1 "Create your Margin account" (Inter Tight 24px 500), "Continue with Google" button (`--panel-2`, 1px `--line`), "or" divider, Name field, Work email field, white "Continue with email" button, "Already have an account? Log in", terms line.
- **Log in `/login`:** same layout, h1 "Log in to Margin", Google button, Email field, "Email me a login link" button, "No account yet? Sign up". No passwords.
- **Check your email state:** after submitting email, replace the form with "Check your email" and "We sent a login link to {email}. It expires in 15 minutes." plus "Use a different email".
- **Onboarding `/welcome`** (first login only): 3-step progress bar (thin 24x3px segments), h1 "Teach Margin how you write", one sentence explaining files are used only for the voice profile, dashed drop zone ("Drop files here or choose files", ".txt, .md or .docx"), list of added files with "Added" in `--voice`, white "Continue to editor" button, "Skip for now" link.
- Field labels sit above inputs in 13px `--tx-2`. Focus border `--accent`. Errors appear under the field in `--spell` color with a plain sentence ("Enter an email address like name@company.com").

---

## 10. App shell `/app`

Full viewport, CSS grid: 236px sidebar + main. No page scroll; the document area scrolls.

### 10.1 Sidebar

- Workspace row: mark 16px + workspace name (600) + chevron.
- Search button: bordered, `--page` fill, "Search or jump to" + `⌘K` hint in mono. Opens the command bar.
- Group 1: Inbox, All drafts, Shared with me, each with a 6px dot and mono count.
- Group 2 "Recent": last 8 drafts by updated time, word count in mono on the right, current draft highlighted with `--hover` and weight 500.
- Group 3 "Tags": `# tag` rows with counts.
- Bottom: user row (22px initials avatar, name, "Log out" link). Clicking the row opens Settings.
- Below 820px the sidebar is hidden and reachable from a menu button in the top bar.

### 10.2 Top bar (44px)

- Breadcrumb: "All drafts / # tag / **Draft title**".
- Right tools, as chips (6px radius, transparent border, `--hover` on hover, `--rule` border when toggled on):
  - Rhythm toggle (three-bar icon + "Rhythm"), on by default, key R.
  - "Sounds like you" + 44x4px meter bar in `--voice` + percentage in mono.
  - Note count in mono + "notes".
  - Theme toggle (half-filled circle icon).
- Below 820px chip labels hide, icons and numbers stay.

### 10.3 Status bar (30px)

Word count, read time, save state ("Saved", "Saving", "Offline, changes kept on this device"), and right-aligned key hints: J K move, ↵ accept, S stet, ⌘K commands.

### 10.4 Command bar (⌘K / Ctrl+K)

Built on `cmdk`. Centered at 14vh from top, max width 560px, 12px radius, dark panel even in light theme, backdrop `rgba(0,0,0,.45)`. Input 15px, results grouped under small headings: This draft, View, Go to, Account. Arrow keys move, Enter runs, Escape closes. Minimum commands: Next note, Accept all spelling notes, Toggle sentence rhythm, Switch light/dark, Read as (customer, manager, non-native speaker: placeholder until built), New draft, Go to any draft by title, Settings, Pricing, Log out.

---

## 11. The editor

### 11.1 Layout

A centered three-column grid inside the scroll area: `72px` rhythm gutter, `minmax(0, 640px)` page, `260px` margin notes, 28px column gap, 56px top padding, 120px bottom padding.

- 1100px and below: `40px / 1fr / 230px`, 18px gap.
- 820px and below: `20px / 1fr`, notes move below the text as a stacked list.

The page has no card or border. Text sits directly on `--app`. Title is doc-title, then a meta row (edited time, tags) in `--ink-3`, then body.

### 11.2 Underlines (marks)

Category is shown by line shape and color, so it works for color-blind users.

| Category | Line | Color | Examples |
|---|---|---|---|
| Spelling and grammar | solid 1.5px | `--spell` | typos, agreement |
| Clarity | dotted 2px | `--clar` | passive voice, wordiness, plainer word, long sentence |
| Voice | wavy 1px | `--voice` | phrasing unlike the user's own writing |

`text-underline-offset: 4px`. The active mark gets `--ac-soft` background. Marks never change text color.

### 11.3 Margin notes

Each note, top to bottom: header row (12px swatch drawn in the category's line style + label such as "Passive voice"), the fix line (original struck through in `--ink-3`, then replacement), and when active, a one-sentence reason in `--ink-2` and two buttons: **Accept ↵** (filled `--ink`) and **Stet S** (outline).

Positioning algorithm (run on load, on resize, after any text change, after fonts load):
1. For each open note in document order, target top = its mark's top relative to the text column, minus 8px.
2. Actual top = max(target, previous note's bottom + 8px).
3. Animate `top` with the 250ms curve.
Inactive notes show only header and fix line. The active note gets `--page` fill, 1px `--rule` border and a soft shadow.

Resolving:
- **Accept:** mark gets strikethrough, after 280ms the text is replaced and briefly highlighted (1.2s fade). Note fades and the next open note becomes active.
- **Stet:** mark styling is removed, text unchanged, the rule is saved to stet memory, and a dashed-border confirmation replaces the note: "Kept. Margin won't flag "{text}" again in any of your drafts. Undo". It fades after 6s.

### 11.4 Rhythm gutter

- Split the document into sentences with `Intl.Segmenter(locale, { granularity: "sentence" })`.
- For each sentence, draw a 4px tall, 2px radius bar in the gutter, vertically centered on the sentence's first line, right-aligned, width = `min(gutterWidth, words * gutterWidth / 42)`, minimum 4px.
- Color `--bar`; over 30 words `--warn`.
- Hover a bar: bar turns `--ac`, its sentence gets `--ac-soft` background, tooltip shows "{n} words" or "{n} words, consider splitting".
- Recompute on text change (debounced 150ms) and resize. R toggles visibility (opacity fade).

### 11.5 Sounds like you

- Meter value 0 to 100 in the top bar. It measures how close the current draft is to the user's voice profile, a set of measurable writing habits computed from their own drafts.
- Hover or click opens a small popover: "Based on 41 of your drafts", and the two or three biggest differences in plain words ("You usually use contractions", "Your sentences here run longer than usual").
- With no profile yet, the meter shows "Add writing" and links to the onboarding upload.
- Voice notes use label "Not your voice" and a reason that cites the user's own habit ("Across your 41 drafts you write "we'd", never "we shall".").

### 11.6 Empty and edge states

- New draft: title placeholder "Untitled" in `--ink-3`, body placeholder "Start writing. Notes will appear in the margin."
- No notes: count shows 0 and the notes column shows "Nothing to fix." in `--ink-3` once, near the top.
- Checker unreachable: status bar shows "Checking paused, retrying" in `--warn`. Never a modal.

---

## 12. Keyboard map (editor)

Shortcuts that are single letters only fire when focus is not inside the text or an input. Inside the text, use the Alt variants.

| Key | Alt variant | Action |
|---|---|---|
| J or ↓ | Alt+J | Next note |
| K or ↑ | Alt+K | Previous note |
| Enter | Alt+Enter | Accept active note |
| S | Alt+S | Stet active note |
| R | Alt+R | Toggle rhythm gutter |
| Esc | | Return focus to the text |
| ⌘K / Ctrl+K | | Command bar |
| ⌘N / Ctrl+N | | New draft (app only) |

---

## 13. Copy rules

- Sentence case everywhere, including buttons and headings.
- Buttons state the action: "Accept", "Stet", "Continue with email", "Start 14-day trial".
- Note reasons are one sentence, second person, no hedging, no exclamation marks.
- No em dashes. No emoji. No banned words from section 3.
- Errors say what happened and what to do next.

---

## 14. Responsive

- Marketing: two-column splits, grids and plan cards collapse to one column below 900px. The hero product frame stays but becomes 560px tall and shows the mobile editor layout.
- App: see 10.1, 10.2, 11.1. Nothing may scroll horizontally except the pricing table container.
- Minimum side gutter 16px at every width.

---

## 15. Accessibility floor

- Text contrast 4.5:1 minimum (check `--tx-3` and `--ink-3` only for non-essential text).
- Every interactive element reachable by Tab, visible focus ring (2px `--accent`/`--ac`, 2px offset).
- Margin notes are a `role="list"`; the active note is announced with `aria-live="polite"`: "Passive voice. Suggest: the team decided. Press Enter to accept, S to keep yours."
- Marks have `aria-describedby` pointing at their note.
- Rhythm gutter is `aria-hidden`; the same information is available via the command "Show long sentences".
- Reduced motion respected (section 7).

---

## 16. Logo

The mark is a rounded vertical bar with a filled circle beside it (a page edge with a note pinned to it). Source: `reference/margin-mark.svg`. Solid fill only, `currentColor`. Used at 16px (app), 20px (nav), 32px (auth). The wordmark is "Margin" in Inter Tight 600, tracking -0.02em. Favicon: the mark on transparent, white in dark browser themes, `#08090A` in light.

Optional: the dithered interactive version of the mark (Componentry `@componentry/dithered-logo`) may appear once, in the landing hero above the headline, only if it looks right next to the new typography. It never appears in the app.
