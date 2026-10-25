# Nearby Tech

A personal radar for hackathons, ideathons, meetups, and workshops around
Nashik, across Maharashtra, and online.

**Live:** https://kihoro-code.github.io/nearby-tech/

The site is static. A scheduled refresh reads seven event sources, normalises
and de-duplicates the results, verifies the links, and commits the JSON data.
GitHub Pages then rebuilds the site from that data.

There are no accounts, no database, no runtime AI, and no notifications. It is
one page for one person.

## What is on the radar

Events are grouped into three lanes:

1. **Nashik** — Nashik district and roughly 45 minutes of travel.
2. **Maharashtra** — hackathons and ideathons elsewhere in the state. These are
   worth the trip when round 1 is online; the card says what the source says.
3. **Online** — hackathons from anywhere, plus meetups and workshops that start
   at an IST-friendly hour (07:00–23:00 IST).

Only four event types are included: hackathons, ideathons, meetups, and
workshops. Conferences, webinars, paid courses, recruitment drives, and
unrelated college notices are filtered out.

Events must fall inside the next 90 days. Explicitly closed events are hidden.
When a deadline is not published, the card says **not listed** rather than
guessing. Paid events are included and labelled; the **Free only** filter hides
them. Events are sorted hackathons → ideathons → meetups → workshops, then by
date, and grouped by month.

## Sources

| Source | What is read |
| --- | --- |
| [Devfolio](https://devfolio.co) | Public hackathon API, application-open and full listings |
| [Unstop](https://unstop.com) | Public hackathon search API; CTF/quiz/competitive-programming listings filtered out |
| [GDG Nashik](https://gdg.community.dev/gdg-nashik/) | Chapter page data |
| [WordPress Nashik](https://www.meetup.com/wordpress-meetup-nashik/) | Meetup iCalendar feed |
| [CNCF Nashik](https://nashik.cncg.in/) | JSON-LD events |
| [K. K. Wagh (KKWIEER)](https://www.kkwagh.edu.in/life-at-k-k-wagh/happening/events) | Events page cards |
| [SIEM / Sandip Foundation](https://siem.sandipfoundation.org/computer-engineering/events) | Events table via the site's WordPress REST API |

Parsers are deterministic. There is no LLM in the data path. If a page changes
shape, the parser reports a review item or a source error instead of inventing
data.

## How the data behaves

- **Last-good data is kept.** If a source fails, or unexpectedly returns zero
  events when it used to have some, its previous events stay on the page and the
  source health banner shows the failure. A failed source with no active events
  stays visible in Source health but does not put a banner above the radar;
  there is no data to protect.
- **Broken links go to review.** An event link is checked on every full refresh
  (with a 24-hour cache). If both the event page and its source page fail, the
  event is removed from the active list and put in the review queue instead of
  being silently shown or archived.
- **Duplicates are merged.** The same event from multiple sources becomes one
  card. Manual entries have the highest priority and are never overwritten by a
  source.
- **Past and delisted events are archived** for up to one year. They are
  available from the footer's **Source health** → **Past** tab.
- **Manual events are validated** through the same normaliser. An invalid entry
  appears in **Review**, not on the radar.

## Local development

Requirements: Node 22+, pnpm 10+.

```bash
pnpm install
pnpm dev      # http://127.0.0.1:5173
pnpm build    # type-check and build dist/
pnpm preview  # serve the production build
pnpm lint
```

The theme starts from the operating system preference. The sun/moon button in
the header switches to an explicit light or dark theme and stores that choice in
`localStorage` under `nearby-tech:theme`. Until the first toggle, the page keeps
following system changes.

## Refreshing data

```bash
pnpm refresh       # fetch all sources, verify links, rewrite data/
pnpm refresh:fast  # fetch sources but keep the last link-check result
```

Useful variations:

```bash
pnpm refresh -- --dry-run
pnpm refresh -- --source=devfolio,unstop
pnpm refresh -- --source=gdg-nashik --skip-verify
```

- A full refresh can take a minute or two; link checks are cached for 24 hours
  in `data/cache/links.json`.
- A partial refresh (`--source=…`) carries events from sources that were not
  selected, marked as stale. It is meant for local debugging, not for the daily
  automation.
- `--skip-verify` is useful after editing a manual event. It does not reset
  existing links to “unchecked”; it preserves their previous verification state.
- `--dry-run` prints the result but does not write files.

## Adding an event by hand

Edit `data/manual.json`, then run `pnpm refresh:fast`. Do not edit
`data/events.json`; it is generated.

```json
{
  "events": [
    {
      "id": "manual-example",
      "name": "Example Build Weekend",
      "type": "hackathon",
      "mode": "in-person",
      "start": "2026-11-14T09:00:00+05:30",
      "end": "2026-11-15T18:00:00+05:30",
      "deadline": "2026-11-10T23:59:00+05:30",
      "city": "Nashik",
      "state": "Maharashtra",
      "venue": "Example College",
      "cost": "free",
      "host": "Example Community",
      "prize": "₹25,000",
      "url": "https://example.com/build-weekend",
      "description": "A two-day build weekend. Bring a laptop.",
      "themes": ["web", "ai"],
      "travelNote": "Round 1 online"
    }
  ]
}
```

Field notes:

- `type`: `hackathon`, `ideathon`, `meetup`, or `workshop`.
- `mode`: `in-person`, `online`, or `hybrid`.
- A Nashik event needs `city: "Nashik"` (or another recognised Nashik place).
- A non-Nashik Maharashtra hackathon needs `city` + `state: "Maharashtra"` to
  land in the Maharashtra lane.
- An online meetup/workshop must start between 07:00 and 23:00 IST.
- `cost`: `free`, `paid`, or `unknown`; use `costLabel` for the amount.
- `url` is required. `id` is optional but makes the entry stable.
- Dates should include a timezone offset. IST is `+05:30`.
- Manual events are exempt from the “explicitly closed” deadline filter, so you
  can add something you know about even if its registration page is stale.

## Data files

| File | Ownership | Purpose |
| --- | --- | --- |
| `data/events.json` | generated | Active events plus up to a year of archive |
| `data/sources.json` | generated | Per-source health, counts, timestamps |
| `data/review.json` | generated | Parser and link failures that need a human |
| `data/manual.json` | **yours** | Hand-added events; highest priority |
| `data/cache/links.json` | generated | 24-hour link-check cache |

## Deployment

The site deploys to GitHub Pages from `main` through
`.github/workflows/deploy.yml`.

The refresh workflow runs daily at **07:00 IST** (`30 1 * * *` UTC) and can be
started manually from **Actions → Refresh radar data → Run workflow**. It
commits only when `data/` changed. Because a push made with `GITHUB_TOKEN` does
not trigger a normal `push` workflow, the deploy workflow also listens for the
refresh workflow completing successfully.

For a fork or a new checkout:

1. Create a **public** GitHub repository (Pages on the free plan requires it).
2. Push the project to `main`.
3. In **Settings → Pages**, set the source to **GitHub Actions**.
4. Run the refresh workflow once, or wait for the schedule.
5. The site is served at `https://<owner>.github.io/<repo>/`.

`vite.config.ts` sets the production base path to `/nearby-tech/` when
`GITHUB_ACTIONS` is set; local development uses `/`. If the repository is
renamed, update that base path.

## Project shape

```text
scripts/
  refresh.mjs            orchestration: fetch → normalise → merge → verify → write
  sources/*.mjs          one deterministic adapter per source
  lib/date.mjs           IST-aware date parsing and formatting
  lib/http.mjs           fetch helpers, HTML text extraction
  lib/normalize.mjs      schema, lanes, dedupe, merging
  lib/verify.mjs         link checks and review queue
data/                    generated JSON plus manual events
src/
  App.tsx                filters, lanes, dialogs
  components/            header, cards, detail sheet, health banner, status dialog
  components/ui/         shadcn primitives
  lib/                   types, data access, formatting, theme, filters
.github/workflows/       daily refresh and Pages deployment
```

## Scope and limits

- This is a personal tool, not a directory. It intentionally reads only the
  seven sources above.
- Parsers are polite, unauthenticated HTML/JSON readers. A source redesign can
  break one; the health banner and review queue exist for that reason.
- “Nearby” is defined by the lane rules, not by live travel time.
- No accounts, saved events, alerts, chat, calendar sync, or runtime AI.
