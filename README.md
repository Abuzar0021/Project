# Margin

A writing editor where suggestions live in the margin, the way a copy editor's
pencil notes sit beside a manuscript. Each suggestion is a note pinned to the
exact line it refers to, not an item in a generic list.

This is a demo build. See `DESIGN.md` for the visual and interaction spec, and
`docs/ARCHITECTURE.md` (added in a later phase) for how the checking pipeline
works.

## Stack

- Next.js 15 (App Router), React 19, TypeScript strict
- Tailwind CSS v4 with all design values in `src/styles/tokens.css`
- TipTap v2 for the editor (added in Phase 1)
- Zustand for client state (added in Phase 2)
- Self-hosted LanguageTool as the grammar engine, reached only through
  `/api/check`
- Vitest for unit tests, Playwright for end-to-end tests
- pnpm as the package manager

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Start the grammar engine (separate terminal)
docker compose -f docker/docker-compose.yml up languagetool
#    Verify it:
curl "http://localhost:8010/v2/languages"

# 3. Point the app at it
cp .env.example .env.local

# 4. Run the app
pnpm dev
```

Open http://localhost:3000.

## Scripts

| Script           | What it does                |
| ---------------- | --------------------------- |
| `pnpm dev`       | Start the dev server        |
| `pnpm build`     | Production build            |
| `pnpm start`     | Serve the production build  |
| `pnpm lint`      | ESLint                      |
| `pnpm typecheck` | TypeScript, no emit         |
| `pnpm test`      | Vitest unit tests           |
| `pnpm e2e`       | Playwright end-to-end tests |
| `pnpm format`    | Prettier write              |

## Project layout

```
src/
  app/       Next.js routes and the /api/check endpoint
  components/ Editor shell, card, rail, minimap, score, status, ui primitives
  lib/       Pure logic: checking pipeline, editor plugins, layout, scoring
  store/     Zustand stores
  styles/    tokens.css and globals.css
  types/     Shared domain types
tests/       unit (Vitest) and e2e (Playwright)
docker/      LanguageTool compose file and a Caddy example
docs/        Architecture notes
```
