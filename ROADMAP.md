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

## Post-launch polish (2026-10-28)

- [x] Job card redesign (initials marks, salary top-right, honest "salary not
      listed", chips, dated footer) + Be Vietnam Pro via next/font (self-hosted,
      zero runtime font requests).
- [x] "New since your last visit" badge + counter — localStorage-only visit
      tracking (a visit ends after 60 quiet minutes, so refreshes never clear
      badges mid-session); first visit shows nothing; counter counts deduped
      CARDS so it always equals visible badges.
- [x] "How it works" onboarding card on the home page — the radar-not-search
      model is not guessable from the UI, so new visitors get 4 steps up front
      (profile once, radar cadence, on-device ranking, what the amber banner
      means). Dismissal is remembered in localStorage and collapses to a
      one-line toggle, so the explanation stays one click away.

## Next session queue (owner's list, 2026-10-29)

- [ ] **Experience-range restraint (0–1 year)** — scored jobs can link to postings
      demanding "3+ years": the fit score ranks stack match only, and JD bodies are
      never fetched/stored (metadata-only principle), so in-body experience lines
      are invisible today. Design order: (1) check whether TopDev's search API
      already returns a structured experience field (zero extra requests); (2)
      extend the isSenior machinery with year-count patterns in titles/metadata
      ("3+ years", "3 năm kinh nghiệm", "ít nhất 2 năm") and hide ≥2y the same way
      senior roles are hidden; (3) full JD fetching stays off the table — it
      multiplies request volume against the politeness budget. Be honest in the
      UI: without reading JDs this is best-effort filtering, not a guarantee.
- [ ] **More sources** (owner's research list). Hard constraints first: LinkedIn
      is NEVER a source (their UA forbids it — CLAUDE.md); VietnamWorks only via
      a legitimate feed/partnership (existing line below); Indeed's ToS forbids
      scraping — skip unless a publisher API path exists; verify JobStreet still
      operates a Vietnam board at all before investing. Priority candidates for
      the junior audience, each needing the standard probe (robots.txt, ToS,
      listing structure, ≥1s politeness): CareerViet, Vieclam24h, JobsGO,
      Glints VN, Ybox (fresher/intern focus). One `SourceFn` file + migration
      INSERT per source, fail-soft, per the architecture notes.
- [x] Expired jobs leave the listing — already true: `getJobs` filters
      `status='open'`, expired rows survive only in the DB and the /status
      counts, and a re-sighting reopens them.
- [x] Home h1 changed to the owner's copy: "Scan websites, fetch jobs info,
      4 times per day" (2026-10-29). SEO note: the browser-tab/metadata title
      still carries "IT jobs for juniors" so the ranking keyword survives.

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
- [x] Category pages — done 2026-10-27: `/jobs` (browse by track), `/jobs/{skill}`
      and `/jobs/{skill}/{city}` (ha-noi, ho-chi-minh, da-nang, remote). Slugs come
      from `scan_keywords` with `dynamicParams=false` (no doorway URLs); matching
      reuses core's synonym/boundary machinery (`jobMatchesSkill`); stats: open,
      new-this-week, %-salary-disclosed, senior-hidden; BreadcrumbList + ItemList
      JSON-LD; empty pages go `noindex` and drop out of the sitemap.
- [x] ITviec company names — done 2026-10-28: the card has two /companies/ links
      (logo without text, then a text link); take the first WITH text, fall back
      to the logo's alt. Rows self-heal via upsert as rotation revisits tracks.
- [ ] Run `probe-sources` on Actions → record the CI vs home-machine split in README.

## Week 3 — dedupe & polish

- [x] Cross-source dedupe — done 2026-10-27: blocks on (company_norm, is_senior) +
      compatible city buckets, token-set Jaccard ≥ 0.6 over synonym-mapped,
      stopword-free titles, PLUS a short-title guard (union < 4 tokens requires an
      exact set match — stops "Fullstack Developer Leader" vs "Fullstack AI Leader").
      Union-find assigns dup_group = min job id, recomputed after every scan,
      diff-only writes, never destructive. UI renders one card with "Also posted
      on" buttons. Live result: 9 groups / 21 jobs, all true duplicates. Side
      catch: isSenior was blind to bracketed "(Senior)" markers — fixed.
- [x] Multi-city scanning + home city filter — done 2026-10-28: ITviec/TopCV scan
      Hà Nội, Hồ Chí Minh and Đà Nẵng per run (slugs PROBED, not guessed — TopCV
      keys on non-alphabetical kl{N} codes, Đà Nẵng is kl8; ITviec soft-404s bad
      slugs with HTTP 200). Multi-city jobs keep one row with merged locations.
      Home page gained a city select. Pages per HTML scan ×3; delays unchanged.
- [ ] README: screenshots + architecture diagram.

## Before using as a portfolio piece

- [ ] Make the repo public (private for now — the owner is still employed).
- [ ] Deploy Vercel (Hobby, non-commercial) + Neon; fill the GitHub secrets
      `DATABASE_URL`, `REVALIDATE_URL`, `REVALIDATE_SECRET`.
- [ ] Weekly backup: a `pg_dump` workflow uploading an artifact.

## Post-MVP (no order promised)

- [x] **CV upload → auto-filled scoring profile** — done 2026-10-28, fully
      client-side: pdfjs-dist 6.4.299 (legacy build) lazy-loaded on interaction,
      worker emitted as a hashed webpack asset, paste box as the universal
      fallback (DOCX, scanned PDFs, old browsers — every error funnels there).
      Extraction in core: SKILL_LEXICON (~95 canonicals, alignment with
      SYNONYMS enforced by test), count≥2 primary guard on long texts,
      diacritic-ratio CV-language detection. Verified with a real CV in the
      browser; the network log during parsing shows localhost-only traffic —
      the privacy claim is demonstrated, not asserted. DOCX later = one lazy
      mammoth branch in the dispatcher.
- [ ] Accounts + saved searches + email digest (auth becomes worth it here).
- [ ] VietnamWorks: only re-added if a legitimate link-out path exists (feed/partnership).
- [ ] LLM job-description analysis (real requirements summary, red flags) — rides the
      junior-AI-skills hiring trend; on-demand to stay free.
- [ ] Salary stats per skill/city from `salary_raw` (needs a proper salary parser).

## Operational reminders

- Actions schedules auto-disable after 60 days of repo inactivity (GitHub emails
  first) — land at least one commit a month.
- Vercel Hobby forbids commercial use: no ads. To monetize → Pro or different hosting.
