# ROADMAP — JuniorLoop

## Product vision

JuniorLoop lets anyone do what the owner built it for himself: **describe (or
eventually upload) who you are, and see the jobs that actually suit you** — instead
of F5-ing four job boards and reading senior postings dressed up as junior ones.
The scoring profile is the seed of that; the flagship post-MVP feature is **CV
upload → client-side parsing → auto-filled profile**, under the same privacy rule
as everything else: the CV and the profile never leave the visitor's browser,
nothing is stored server-side.

**Priority (set 2026-10-27):** building JuniorLoop is goal #1; the owner's own job
hunt is goal #2, served meanwhile by the tracker artifact and weekly `pnpm scan`.

**Known architectural gap (the "Unity problem", found 2026-10-27):** the profile
only *ranks* what the crawler already fetched — it never drives *retrieval*. The
crawl keywords are a hardcoded web-dev list, so a Unity/game profile scores a
corpus that contains no Unity jobs and silently gets noise. Fixing coverage is the
top of week 2, and the fix is broader scheduled crawling (keyword config per track),
NOT per-visitor live scraping — politeness rules forbid letting visitors trigger
fetches against the source sites.

## Done (week-1 MVP — 2026-10-27)

- pnpm monorepo: `core` (normalization + scoring, Vitest), `db` (Kysely + migrations,
  per-source kill switch, local reset script), `ingest` (TopDev API + ITviec/TopCV
  HTML, circuit breaker, CLI), `web` (list + filters + fit-score sorting, localStorage
  profile, pipeline status page, data principles, tag-based revalidation).
- Workflows: `probe-sources` (datacenter-IP experiment), `scan-topdev` (6h cron), `ci`.
- Full English pass: identifiers, schema, routes, UI copy, docs, commits
  (Vietnamese string literals in `core` kept deliberately as domain data).
- Scoring: word-boundary token matching (unity≠opportunity, java≠javascript,
  intern≠International) with regex cache; 14 unit tests.

## Week 2 — retrieval coverage, lifecycle & category pages

- [x] **Retrieval coverage (the Unity problem)** — done 2026-10-27: `scan_keywords`
      table seeded per track (web, mobile, game, data, qa, devops), one track per
      run in least-recently-scanned rotation (politeness budget stays constant),
      per-keyword failure skipping (a 404 keyword no longer kills a source),
      per-track freshness on /status, and honest no-coverage notices on /profile
      and the job list. Verified live: Unity profile → Unity jobs ranked on top.
- [x] Expiry — done 2026-10-27: a job expires only after ≥2 successful scans of its
      OWN (source, track) since it was last seen, with 48h/72h time guards against
      rapid re-runs and page-one displacement; legacy NULL-track jobs count any
      scans of their source. Runs at the end of every scan; re-sighting reopens.
      Verified: backdated legacy job expired, backdated game-track job survived
      (its track had only 1 run). /status shows open vs no-longer-seen counts.
- [ ] Category pages `/jobs/{skill}` and `/jobs/{skill}/{city}` — where the SEO value
      lives (posting counts, salary stats, ItemList).
- [ ] ITviec: extract the company name from the slug (currently "(see posting)").
- [ ] Run `probe-sources` on Actions → record the CI vs home-machine split in README.

## Week 3 — dedupe & polish

- [ ] Cross-source dedupe: block on `company_norm` equality + same city bucket, then
      token-set Jaccard ≥ 0.6 over synonym-mapped titles (~15 pairs) → assign
      `dup_group`, render one card with multiple source buttons. Never a destructive
      merge; prefer missing a duplicate over a false merge.
- [ ] City as a real filter (ITviec/TopCV currently lock Hanoi in the scan URL).
- [ ] README: screenshots + architecture diagram.

## Before using as a portfolio piece

- [ ] Make the repo public (private for now — the owner is still employed).
- [ ] Deploy Vercel (Hobby, non-commercial) + Neon; fill the GitHub secrets
      `DATABASE_URL`, `REVALIDATE_URL`, `REVALIDATE_SECRET`.
- [ ] Weekly backup: a `pg_dump` workflow uploading an artifact.

## Post-MVP (no order promised)

- [ ] **CV upload → auto-filled scoring profile** (parse client-side — pdf.js or
      similar; extract skills/level; never upload the file to a server). This is
      the flagship feature of the product vision above.
- [ ] Accounts + saved searches + email digest (auth becomes worth it here).
- [ ] VietnamWorks: only re-added if a legitimate link-out path exists (feed/partnership).
- [ ] LLM job-description analysis (real requirements summary, red flags) — rides the
      junior-AI-skills hiring trend; on-demand to stay free.
- [ ] Salary stats per skill/city from `salary_raw` (needs a proper salary parser).

## Operational reminders

- Actions schedules auto-disable after 60 days of repo inactivity (GitHub emails
  first) — land at least one commit a month.
- Vercel Hobby forbids commercial use: no ads. To monetize → Pro or different hosting.
