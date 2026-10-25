# AGENTS.md

## What this project is

Nearby Tech is a **personal, single-user, static event radar** for Nashik and
online tech events. It is not a directory business and not an app with users.

The working folder may still be called `HackathonFinderNearMe`; the product and
GitHub repository are **Nearby Tech** / `nearby-tech`.

Do not add features that need a backend, accounts, a database, a runtime
chatbot, alerts, saved events, chat, calendar sync, or additional aggregators.
The public contract is the static JSON in `data/` and the React page that reads
it.

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm refresh
pnpm refresh:fast
```

- `pnpm build` must pass before a change is considered done.
- `pnpm refresh` does a full source fetch and link verification.
- `pnpm refresh:fast` skips link checks but must preserve the previous
  `linkStatus`/`lastVerified` values.
- `pnpm refresh -- --source=devfolio` is for local debugging. It carries events
  from unselected sources as stale.
- `pnpm refresh -- --dry-run` writes nothing.

## Data path

```text
sources → normalise → merge/dedupe → link verify → data/*.json → Vite build → Pages
```

1. Adapters live in `scripts/sources/`. Each fetches and parses one source with
   deterministic HTML/JSON code. **No LLM generation belongs in this path.**
2. `scripts/lib/normalize.mjs` owns the event schema, lane classification,
   source priority, de-duplication, and merge rules.
3. `scripts/refresh.mjs` orchestrates, carries last-good data, archives old
   events, and writes JSON atomically.
4. `scripts/lib/verify.mjs` checks links, caches results for 24 hours, and sends
   events whose event page and source page both fail to the review queue.

### Files

- `data/events.json` — generated. Never edit by hand.
- `data/sources.json` — generated health data. Never edit by hand.
- `data/review.json` — generated review queue. Never edit by hand.
- `data/manual.json` — the human-owned input. Edit this for hand-added events.
- `data/cache/links.json` — link-check cache, safe to delete to force checks.

### Invariants

- **Manual entries win.** `data/manual.json` events have priority 100 and are
  not overwritten by source data.
- **Last-good data survives a broken source.** If an adapter throws, times out,
  or returns zero events when it previously had upcoming events, keep its
  existing active events, mark the source unhealthy, and surface the banner.
  A failure with no active events stays in Source health but does not render the
  top banner; there is no last-good data to protect.
- **Review is not archive.** A link failure moves the event out of the active
  list into `data/review.json`; it must not be silently archived as delisted.
- **Missing deadline means “not listed”.** Never invent or infer a deadline.
- **Closed events are hidden.** A parsed deadline in the past removes the event
  unless it is a manual entry.
- **90-day window**, grouped by month. Do not widen it casually.
- **Lanes:** Nashik district + ~45 minutes; rest-of-Maharashtra hackathons and
  ideathons only (with a round-1 format note); online hackathons anywhere plus
  meetups/workshops starting 07:00–23:00 IST.
- **Dedupe by canonical URL and by normalised name + date + city.** Preserve the
  first-seen date and merge missing fields from lower-priority duplicates.
- **Archive past, closed, and delisted events for up to one year.** They live
  in `data/events.json` with `status: "archived"`, `"closed"`, or `"delisted"`
  and are shown only in the footer status dialog. A future event whose
  registration deadline passed is `closed`, not delisted; an event that vanished
  from a healthy source is `delisted`.

## Adding or fixing a source

1. Create `scripts/sources/<id>.mjs` exporting `source` metadata and a `fetch*`
   function that returns `{ events, health, review }`.
2. Emit raw events with: `sourceId`, `sourceEventId`, `name`, `type`, `mode`,
   `start`, and location fields (`city`, `state`, `country`) when known. Include
   `url`, optional `end`, `deadline`, `cost`, `prize`, `host`, `description`.
3. Register the adapter in `scripts/refresh.mjs`; add a priority in
   `scripts/lib/normalize.mjs` if the source needs one.
4. Prefer stable public endpoints. If a page is HTML, fail loudly when the
   expected shape disappears; do not return a partial silent success.
5. Run `pnpm refresh -- --source=<id>` and inspect `data/events.json`,
   `data/sources.json`, and `data/review.json`.
6. Run a full `pnpm refresh` before committing.

## Frontend

- Vite + React 19 + TypeScript + Tailwind v4 + shadcn (radix-nova).
- `src/App.tsx` owns filters, lane composition, and dialogs.
- `src/components/event-detail-sheet.tsx` is the single event detail surface.
  It must remain full-width on mobile (`data-[side=right]:w-full`) and keep the
  sticky action footer.
- Keep the visual language: warm paper background, ink text, orange accent,
  Geist, compact type, editorial lane headers. Avoid a generic SaaS dashboard.
- Theme behavior: system preference by default; header sun/moon toggle sets an
  explicit mode and persists it in `localStorage` (`nearby-tech:theme`). Do not
  regress the system-follow behavior before the first toggle.
- Preserve keyboard access, visible focus, semantic headings, and the mobile
  filter scroller with its edge fade.
- Reuse shadcn primitives in `src/components/ui/` rather than adding a new
  component library.

## UI checks before shipping

- `pnpm build` passes.
- Mobile (~390×844) and desktop layouts both work.
- Light and dark themes both work; the toggle persists and the first visit
  follows the OS.
- Search, type filters, free-only, lane filters, “show all online”, and the
  detail sheet work with a keyboard and a touch viewport.
- Footer status dialog: Sources, Review, and Archive tabs.
- DevFest Nashik is visible when it is within the window, with a resolving
  event link.
- Force one source to fail (or run offline) and confirm the page still renders
  the last-good data and the health banner. Revert and run a full refresh.

## Deployment

- `.github/workflows/refresh.yml` runs at **07:00 IST** (`30 1 * * *`) and on
  manual dispatch. It commits `data/` only if something changed.
- `.github/workflows/deploy.yml` runs on pushes to `main`, on successful
  completion of the refresh workflow, and manually. Pages source must be
  **GitHub Actions**.
- The `workflow_run` trigger exists because a `GITHUB_TOKEN` push does not
  trigger normal `push` workflows.
- The repository must be **public** on the free GitHub plan.
- `vite.config.ts` uses `/nearby-tech/` when `GITHUB_ACTIONS` is set. Update the
  base path if the repo is renamed.

## Style

Match the existing code: small focused modules, `mjs` for scripts, strict
TypeScript for the app, no unnecessary dependencies, no comments that restate
the code. Prefer a surgical fix over a refactor. Do not delete unfamiliar files
without checking whether they are part of the data or deployment path.
