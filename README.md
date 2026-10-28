# JuniorLoop

A job board for junior developers in Vietnam: aggregates postings from **TopDev, ITviec
and TopCV** every 6 hours, filters for **genuinely junior roles** (senior postings are
flagged and hidden, never deleted), and **scores every posting** against a profile you
define — computed in your own browser, with no account and no data sent anywhere.

## Run it locally

Requires Node ≥ 22, pnpm ≥ 9, PostgreSQL (local, or [Neon](https://neon.tech) free tier).

```bash
cp .env.example .env        # adjust DATABASE_URL if needed
pnpm install
pnpm db:migrate             # creates the database if missing + applies schema
pnpm scan                   # first scan of all 3 sources (takes minutes — polite delays)
pnpm dev                    # http://localhost:3000
```

## Architecture

```
GitHub Actions (6h cron) ──scan topdev──┐
                                        ├─→ PostgreSQL (Neon) ─→ Next.js ISR (Vercel)
Personal machine (Task  ──scan itviec/topcv─┘        ↑                │
Scheduler)                              └── POST /api/revalidate ←────┘ (tag 'jobs')
```

| Package | Role |
|---|---|
| `packages/core` | Normalization (diacritics, company names), senior detection, **fit scoring** — pure, isomorphic, unit-tested |
| `packages/db` | Kysely types + migrations; the `sources` table is a per-source **kill switch** |
| `packages/ingest` | Scan CLI: `pnpm scan --sources topdev --keywords nodejs,reactjs`; circuit breaker trips at 403×3 |
| `apps/web` | Job list with filters + fit-score sorting; `/profile` (localStorage); `/status` (pipeline); `/principles` |

**Why hybrid ingestion?** GitHub Actions runners use Azure datacenter IPs — the
HTML sources sit behind Cloudflare and are likely to challenge them. API sources run
on CI; HTML sources run from a residential machine using the exact same CLI. The
`probe-sources` workflow curls all four sources from a runner so the split is
measured, not guessed.

Home-machine scans target production with `--prod`, which reads `.env.production`
(gitignored; holds the production `DATABASE_URL`, `REVALIDATE_URL`,
`REVALIDATE_SECRET`). Without the flag, scans hit your local dev database.

Scheduling the HTML sources on Windows:

```powershell
schtasks /Create /TN "JuniorLoopScan" /SC DAILY /ST 08:30 /TR "cmd /c cd /d D:\TranBaoPhuc\juniorloop && pnpm scan --prod --sources itviec,topcv" /F
```

A note on the codebase: identifiers and docs are English; the Vietnamese string
literals inside `core` (company suffixes, senior tokens, scoring signals like
`"tieng anh"`) are **domain data, kept on purpose** — they match the language the
job postings are written in.

## Your CV never leaves your browser

The profile can be built from your CV: drop a PDF (parsed by a lazy-loaded
pdf.js running **in your tab**) or paste the text. Skill extraction is the same
transparent dictionary the scorer uses — no AI black box, no server. Don't take
our word for it: open DevTools → Network while it parses, or go offline first;
parsing still works. The file and its text live in component memory only; the
app stores nothing but the three-field profile **you** click Save on, in your
own browser's localStorage. Scanned PDFs, password-protected files, DOCX and
old browsers all fall back to the paste box.

## Scraping ethics — read this before forking

This is the most important part of the repo, not the technical part:

- **Metadata only, always link out.** No copying job descriptions (copyrighted works);
  no storing personal contact details found in postings (Vietnam's PDPD, Decree
  13/2023). JuniorLoop sends readers *to* the source sites, it does not replace them.
- **Politeness is the condition of existence**: 4 scans/day, ≥1s delay between
  requests, a self-identifying User-Agent, no scanning behind logins, no CAPTCHA
  workarounds, and a circuit breaker that stops — without retrying — the moment a
  source blocks us.
- **Kill switch**: a source asks us to stop → `UPDATE sources SET ingest_enabled=false,
  display_enabled=false WHERE code='...'` — effective immediately, no deploy.
- **VietnamWorks is deliberately disabled** even though its API responds: that public
  API hides job URLs — we respect the signal instead of reconstructing links.
- **This is not, and will never be, an auto-apply bot**: automation stops at
  *finding* jobs; *applying* belongs to humans. There is no LinkedIn source (their
  ToS forbids it).

## Deploy ($0/month)

1. [Neon](https://neon.tech) free → create a project, grab `DATABASE_URL`, run
   `pnpm db:migrate` against it.
2. [Vercel](https://vercel.com) Hobby → import the repo, root `apps/web`, add env vars
   `DATABASE_URL`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_BASE_URL`.
   **Hobby is non-commercial — no ads, ever, on this plan.**
3. GitHub repo → Settings → Secrets: `DATABASE_URL`, `REVALIDATE_URL`
   (https://&lt;app&gt;.vercel.app), `REVALIDATE_SECRET` → enable the `scan-topdev` workflow.
4. Heads-up: Actions schedules auto-disable after 60 days of repo inactivity — GitHub
   emails you first.

## License

MIT — © 2026 Tran Bao Phuc. See also [ROADMAP.md](ROADMAP.md) and [CLAUDE.md](CLAUDE.md).
