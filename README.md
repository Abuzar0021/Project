# Margin

A writing editor that checks spelling, clarity and tone, and leaves short notes
in the margin beside the text instead of in a popup or sidebar. It learns how
you write from your own drafts, flags edits that would make you sound generic,
and remembers every suggestion you turn down.

`DESIGN.md` is the spec for how everything looks and behaves;
`reference/prototype.html` is the clickable prototype it describes.
`docs/ARCHITECTURE.md` explains how checking works.

## What this build is

A complete, clickable product preview. Everything a visitor can see works:

- Marketing site: landing page (the hero runs the real editor), pricing with a
  yearly and monthly toggle, and placeholder pages for the footer links.
- Sign up, log in, log out, and onboarding with writing uploads.
- The app: drafts with autosave, margin notes with Accept and Stet, the rhythm
  gutter, the voice meter, stet memory, a command bar, settings, and light and
  dark themes. Plans gate features the way the pricing page describes.

Accounts, drafts, kept suggestions and voice profiles are stored in the
visitor's browser, so each tester gets a private workspace with no setup.
Nothing a tester writes leaves their device except the text sent to your own
LanguageTool server for spelling and grammar.

Not connected yet, by design: Supabase (accounts in a database, Google sign-in
and email login links) and Stripe (checkout and billing). The "Continue with
Google" button says so when pressed. Choosing or cancelling a plan updates the
preview account immediately, with no payment.

## Run it locally

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000. Sign up with any name and email to get a workspace
with four sample drafts.

Spelling and grammar come from LanguageTool. Without it the app still works:
clarity notes, the voice meter and a built-in list of common misspellings run in
the browser, and the status bar shows "Checking paused, retrying". To run
LanguageTool locally with Docker:

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up languagetool
```

## Environment variables

| Name                   | Needed for                                                    |
| ---------------------- | ------------------------------------------------------------- |
| `LANGUAGETOOL_URL`     | The LanguageTool server. Local: `http://localhost:8010`       |
| `LANGUAGETOOL_SECRET`  | Shared secret the VPS gateway checks. Empty for local Docker  |
| `NEXT_PUBLIC_SITE_URL` | Absolute URLs for link previews, such as the Open Graph image |

## Deploy

The app deploys to Vercel as a standard Next.js project. Set
`LANGUAGETOOL_URL` to the public HTTPS address of the LanguageTool server (never
localhost) and `LANGUAGETOOL_SECRET` to the value its Caddy gateway expects. The
VPS setup is in `docker/languagetool-vps/`.

## Scripts

| Script               | What it does                        |
| -------------------- | ----------------------------------- |
| `pnpm dev`           | Development server                  |
| `pnpm build`         | Production build                    |
| `pnpm start`         | Serve the production build          |
| `pnpm lint`          | ESLint                              |
| `pnpm typecheck`     | TypeScript                          |
| `pnpm test`          | Unit tests                          |
| `pnpm test:coverage` | Unit tests with coverage            |
| `pnpm e2e`           | Browser tests against a running app |

If Playwright's browser download is blocked, point `pnpm e2e` at any installed
Chromium with `PLAYWRIGHT_CHROMIUM_PATH`.

## Project layout

```
src/
  app/          (marketing) and (auth) route groups, /app, /api/check
  components/
    app/        Sidebar, top bar, status bar, command bar, draft and settings views
    editor/     The editor, margin notes, rhythm gutter, keyboard handling
    marketing/  Nav, footer, landing sections, pricing
    auth/       Sign up, log in, onboarding
    ui/         Button, Field, Kbd, Logo, Divider, Tooltip
  lib/          Checking pipeline, voice profile, drafts, accounts, plans
  styles/       tokens.css and globals.css
tests/          unit (Vitest) and e2e (Playwright)
reference/      The clickable prototype and the logo source
docker/         LanguageTool for local use and for the VPS
```
