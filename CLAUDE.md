# CLAUDE.md — JuniorLoop

## What this project is

A job board for junior developers in Vietnam: `packages/ingest` scans TopDev (API, on
GitHub Actions) + ITviec, TopCV (HTML, from a residential machine) → PostgreSQL
(Kysely) → `apps/web` (Next.js ISR) renders the list, filters juniors, and scores fit
client-side against a localStorage profile (no auth, no PII). pnpm monorepo; dual
goal: a real product + a portfolio piece (TS/React/Node/PG/Kysely stack).

## Hard conventions

- **Chat language**: **English** — the owner chose this on 2026-10-27 when asked
  (per the ask-once-keep-forever rule). Do not ask again; only the owner can change it.
- **Everything in the repo is English**: identifiers, comments, docs, commit
  messages. ONE exception: Vietnamese string literals in `core` (company suffixes,
  senior tokens, scoring signals like `"tieng anh"`, `"nam kinh nghiem"`) are domain
  data matching the postings' language — never translate them, and comment why.
- **Commits in English**, conventional (`feat:`, `fix:`, `chore:`), **NO
  Co-Authored-By line**. Commit email for this repo: **tdmhale5@gmail.com** (set
  locally; personal repo — never the company email; if a commit has the wrong
  author, guide the user to fix it, never amend/force-push yourself).
- The shared package (`core`) must stay **isomorphic** — no `node:*` imports (the
  client runs scoring too). `db`/`ingest` are server-only.
- Schema changes are new SQL files in `packages/db/migrations/` (ascending numbers);
  never edit an applied migration. `pnpm --filter @juniorloop/db reset` wipes the
  LOCAL schema only (it refuses non-localhost hosts).
- Tests: Vitest in `packages/core` for all pure logic (scoring, normalization);
  source parsers are verified with real runs, not HTML mocks (mocks rot).

## Never do

- **Never turn this into an auto-apply bot**; **never add LinkedIn as a source**
  (their UA 8.2 forbids it); **never copy job-description bodies** into the DB
  (metadata only); **never store/display personal contact details** from postings
  (Decree 13/2023).
- Never lower the delay under 1s, scan in parallel, or retry through a 403 — the
  circuit breaker tripping after 3 is deliberate. If a source asks us to stop,
  flip its kill switch in the `sources` table; do not argue.
- Never store raw HTML/payloads in the DB (Neon free is 1 GB).
- **Never move CV parsing or profile synthesis server-side** — "your CV never
  leaves your browser" is the product's core promise. Never add cMapUrl/
  standardFontDataUrl/iccUrl/wasmUrl (CDN) config to the PDF pipeline: one
  mid-parse fetch torches the verifiable-privacy claim. The pdf.js worker is a
  hashed webpack asset via new URL(..., import.meta.url) — never copy it to
  /public (version drift causes API/Worker mismatch errors on upgrade).
- Never add ads/monetization while deployed on Vercel Hobby (non-commercial terms).
- Never use `next/image` for company logos (5K transformations/month quota).

## Architecture & well-trodden paths

- A new source = one file in `packages/ingest/src/sources/` exporting a `SourceFn`,
  registered in `SOURCES` in `src/index.ts`, plus an INSERT in a new migration.
  Sources fail soft — one dead source must not kill the scan.
- City slugs live in `sources/cities.ts` and are VERIFIED DATA — probe a URL and
  read its <title> before adding one, never guess: TopCV ignores the slug text and
  keys on non-alphabetical kl{N} codes (Đà Nẵng is kl8, kl3 is Bình Dương), and
  ITviec soft-404s wrong slugs with HTTP 200.
- In-source dedupe key: `UNIQUE(source, source_id)`. A job seen again → upsert
  reopens it + bumps `last_seen_at`, keeping `first_seen_at`.
- Senior postings get the `is_senior` flag, NEVER deleted. Expiry (db/src/expire.ts,
  runs after every scan): `expired` only after ≥2 successful scans of the job's own
  (source, last_track) since last_seen_at, 48h guard (NULL-track legacy jobs: any
  scans of the source, 72h guard). Re-sighting reopens. Never expire on "this scan
  didn't see it" alone — scans are keyword-scoped and can fail.
- Dedupe (ingest/src/dedupe.ts + core/src/dedupe.ts, runs after every scan): block
  on (company_norm, is_senior) + compatible cities, then titlesLookSame (Jaccard
  ≥0.6; unions under 4 tokens need an exact set match). dup_group = min job id,
  recomputed from scratch each run, never a destructive merge. Placeholder
  companies ('see posting') never block together. Raise thresholds before ever
  lowering them: a false merge costs more than a visible duplicate.
- The web app reads the DB only through `apps/web/lib/data.ts` (unstable_cache,
  tag `jobs`); ingest calls `POST /api/revalidate?secret=…` when done. Never query
  the DB directly from a page/component.
- Env: `.env` at the monorepo ROOT (next.config.ts loads it); see `.env.example`.

## Common commands

```bash
pnpm db:migrate                       # create DB if missing + apply migrations
pnpm scan                             # rotation: least-recently-scanned track
pnpm scan --track game                # force one track
pnpm scan --keywords unity,unreal     # explicit keywords (no rotation bookkeeping)
pnpm scan --sources topdev            # limit sources (CI runs this; no "--" before flags)
pnpm scan --prod --sources itviec,topcv  # HTML sources into PRODUCTION (.env.production)
pnpm test && pnpm typecheck           # before every commit
pnpm dev                              # web at localhost:3000
```

Crawl coverage lives in the `scan_keywords` table (tracks: web, mobile, game, data,
qa, devops). Add coverage with an INSERT in a new migration, never by widening the
per-run request volume: one track per run is the politeness budget.
