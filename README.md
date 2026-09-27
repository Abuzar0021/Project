# Margin

A writing editor where suggestions live in the margin, the way a copy editor's
pencil notes sit beside a manuscript. Each suggestion is a note pinned to the
exact line it refers to, not an item in a generic list.

See `DESIGN.md` for the visual and interaction spec and
`docs/ARCHITECTURE.md` for how the checking pipeline works.

## Stack

- Next.js 15 (App Router), React 19, TypeScript strict
- Tailwind CSS v4 with all design values in `src/styles/tokens.css`
- TipTap v2 for the editor
- Zustand for client state
- Self-hosted LanguageTool as the grammar engine, reached only through
  `/api/check`
- Vitest for unit tests, Playwright for end-to-end tests
- pnpm as the package manager

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Start the grammar engine (separate terminal). The dev override publishes it
#    to localhost so the app, run on the host, can reach it.
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up languagetool
#    Verify it:
curl "http://localhost:8010/v2/languages"

# 3. Point the app at it
cp .env.example .env.local

# 4. Run the app
pnpm dev
```

Open http://localhost:3000 for the marketing page, or http://localhost:3000/app
for the editor. The app also runs without LanguageTool: the tone, clarity, and
style rules run in the browser, and the status bar shows the checker as paused.

## Screenshots

Every product image (the marketing page shots, `docs/screenshots/`, and the iOS
app icon) comes from the real app. With the app running, regenerate them all:

```bash
node scripts/capture-screenshots.mjs
```

The checker is stubbed with LanguageTool's responses for the sample draft, so
captures are deterministic. Rebuild afterwards: the marketing page reads the
image sizes from `src/components/marketing/shots.json` at build time.

If Playwright's browser download is blocked or slow, point the capture script
and `pnpm e2e` at any installed Chromium with `PLAYWRIGHT_CHROMIUM_PATH`.

## Scripts

| Script               | What it does                |
| -------------------- | --------------------------- |
| `pnpm dev`           | Start the dev server        |
| `pnpm build`         | Production build            |
| `pnpm start`         | Serve the production build  |
| `pnpm lint`          | ESLint                      |
| `pnpm typecheck`     | TypeScript, no emit         |
| `pnpm test`          | Vitest unit tests           |
| `pnpm test:coverage` | Unit tests with coverage    |
| `pnpm e2e`           | Playwright end-to-end tests |
| `pnpm format`        | Prettier write              |

## Production (Docker)

```bash
docker compose -f docker/docker-compose.yml up --build
```

This runs `web` and `languagetool` on an internal network. LanguageTool has no
published ports, so only `web` can reach it. Put Caddy in front of `web:3000`
for HTTPS; see `docker/Caddyfile.example`.

## Project layout

```
src/
  app/       Routes: / (marketing), /app (editor), /api/check, icons
  components/ editor, card, rail, minimap, score, status, brand, marketing,
             ui primitives
  lib/       Pure logic: checking pipeline, editor plugins, layout, scoring
  store/     Zustand stores
  styles/    tokens.css and globals.css
  types/     Shared domain types
tests/       unit (Vitest) and e2e (Playwright)
docker/      Dockerfile, compose files, and a Caddy example
docs/        Architecture notes and screenshots
public/      The logo mark source and the marketing page captures
scripts/     capture-screenshots.mjs
```

## Where to start reading

In order, the five files that explain the most:

1. `docs/ARCHITECTURE.md`: the checking pipeline and the hard problems.
2. `src/lib/checking/scheduler.ts`: debounce, concurrency, abort, backoff,
   staleness.
3. `src/lib/checking/extract.ts`: text and the position map that anchors marks.
4. `src/lib/editor/suggestions-plugin.ts`: how marks render and stay anchored.
5. `src/lib/layout/rail-layout.ts`: the margin rail stacking algorithm.
