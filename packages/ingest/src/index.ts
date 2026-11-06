/**
 * Scan CLI — runs on GitHub Actions (API sources) and on a personal machine (HTML sources).
 *   pnpm scan                           # rotation: scans the least-recently-scanned track
 *   pnpm scan --track game              # force one track
 *   pnpm scan --keywords unity,unreal   # explicit keywords (no rotation bookkeeping)
 *   pnpm scan --sources topdev          # limit sources (CI runs this)
 *   pnpm scan --sources topcv --dry-run # print the track rotation would pick, then stop
 * Respects the kill switch (sources.ingest_enabled) and the politeness budget:
 * scanning ONE track per run keeps request volume constant as coverage grows.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

// --prod targets the production database/site: loads .env.production (gitignored)
// instead of .env. Checked before parseArgs because dotenv must run first.
const PROD = process.argv.includes('--prod')
const ENV_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', PROD ? '.env.production' : '.env')
config({ path: ENV_FILE })
if (PROD && !process.env.DATABASE_URL) {
  console.error('--prod requires .env.production at the repo root (see README)')
  process.exit(1)
}
if (PROD) console.log('[env] PRODUCTION — using .env.production')

import { parseArgs } from 'node:util'
import { pickLeastRecentTrack } from '@juniorloop/core'
import { createDb, expireStaleJobs, type Db } from '@juniorloop/db'
import { SourceBlocked } from './http'
import { fetchItviec } from './sources/itviec'
import { fetchTopcv } from './sources/topcv'
import { fetchTopdev } from './sources/topdev'
import { groupDuplicates } from './dedupe'
import { reclassifyOpenJobs } from './reclassify'
import type { SourceFn } from './sources/types'
import { upsertJobs } from './upsert'

const SOURCES: Record<string, SourceFn> = {
  topdev: fetchTopdev,
  itviec: fetchItviec,
  topcv: fetchTopcv,
}

const { values: arg } = parseArgs({
  options: {
    sources: { type: 'string', default: Object.keys(SOURCES).join(',') },
    keywords: { type: 'string' },
    track: { type: 'string' },
    delay: { type: 'string', default: '1.5' },
    prod: { type: 'boolean', default: false }, // consumed above, pre-dotenv
    // Maintenance-only run: re-derive classifier flags + regroup duplicates and
    // refresh the site, with ZERO requests to the source sites. Used to roll a
    // classifier change (e.g. a new experience threshold) over existing rows.
    maintain: { type: 'boolean', default: false },
    // Print which track rotation would pick and stop: zero requests to source sites.
    'dry-run': { type: 'boolean', default: false },
  },
})

/** Rotation: the enabled track these sources have gone longest without scanning (see core/rotation.ts). */
async function pickTrack(db: Db, sources: string[], forced?: string): Promise<{ track: string; keywords: string[] }> {
  let q = db.selectFrom('scan_keywords').selectAll().where('enabled', '=', true)
  if (forced) q = q.where('track', '=', forced)
  const rows = await q.execute()
  if (rows.length === 0) {
    throw new Error(forced
      ? `track "${forced}" has no enabled keywords`
      : 'scan_keywords is empty — apply migrations first')
  }
  const byTrack = new Map<string, { keywords: string[]; hasNewKeyword: boolean }>()
  for (const r of rows) {
    const t = byTrack.get(r.track) ?? { keywords: [], hasNewKeyword: false }
    t.keywords.push(r.keyword)
    if (!r.last_scanned_at) t.hasNewKeyword = true
    byTrack.set(r.track, t)
  }
  const runs = sources.length === 0 ? [] : await db
    .selectFrom('scan_runs')
    .select((eb) => ['source', 'track', eb.fn.max('started_at').as('at')])
    .where('status', '=', 'ok')
    .where('track', 'is not', null)
    .where('source', 'in', sources)
    .groupBy(['source', 'track'])
    .execute()
  const track = pickLeastRecentTrack(
    [...byTrack.entries()].map(([track, d]) => ({ track, hasNewKeyword: d.hasNewKeyword })),
    sources,
    runs.map((r) => ({ source: r.source, track: r.track!, at: new Date(r.at).getTime() })),
  )!
  return { track, keywords: byTrack.get(track)!.keywords }
}

async function callRevalidate() {
  const url = process.env.REVALIDATE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!url || !secret) return
  try {
    await fetch(`${url}/api/revalidate?secret=${encodeURIComponent(secret)}`, { method: 'POST' })
    console.log('[revalidate] asked the web app to refresh its cache')
  } catch (e) {
    console.log('[revalidate] failed (does not block the scan):', (e as Error).message)
  }
}

async function main() {
  const db = createDb()
  const delaySeconds = Number(arg.delay) || 1.5

  if (arg.maintain) {
    console.log('[maintain] no scanning — reclassify + dedupe + revalidate only')
    const re = await reclassifyOpenJobs(db)
    console.log(`[reclassify] updated ${re.changed} of ${re.checked} open job(s)`)
    const dup = await groupDuplicates(db)
    console.log(`[dedupe] ${dup.groups} group(s) covering ${dup.grouped} job(s)`)
    await callRevalidate()
    await db.destroy()
    return
  }

  const requested = arg.sources!.split(',').map((s) => s.trim()).filter(Boolean)
  const enabled = await db
    .selectFrom('sources')
    .select(['code'])
    .where('ingest_enabled', '=', true)
    .where('code', 'in', requested)
    .execute()
  const toRun = enabled.map((r) => r.code).filter((c) => c in SOURCES)
  const skipped = requested.filter((c) => !toRun.includes(c))
  if (skipped.length) console.log(`[kill-switch] skipping disabled/unknown sources: ${skipped.join(', ')}`)

  let keywords: string[]
  let track: string | null = null
  if (arg.keywords) {
    keywords = arg.keywords.split(',').map((s) => s.trim()).filter(Boolean)
    console.log(`[keywords] explicit: ${keywords.join(', ')} (no rotation bookkeeping)`)
  } else {
    const picked = await pickTrack(db, toRun, arg.track)
    track = picked.track
    keywords = picked.keywords
    console.log(`[rotation] track "${track}" — keywords: ${keywords.join(', ')}`)
  }

  if (arg['dry-run']) {
    console.log(`[dry-run] would scan ${toRun.join(', ') || '(no enabled sources)'} — no requests sent`)
    await db.destroy()
    return
  }

  let okCount = 0
  for (const code of toRun) {
    const startedAt = new Date()
    try {
      const jobs = await SOURCES[code]!(keywords, delaySeconds)
      const { seen, inserted } = await upsertJobs(db, code, jobs, track)
      await db.insertInto('scan_runs').values({
        source: code, started_at: startedAt, finished_at: new Date(),
        status: 'ok', jobs_seen: seen, jobs_new: inserted, error_text: null, track,
      }).execute()
      okCount += 1
      console.log(`[${code}] ok — ${seen} jobs, ${inserted} new`)
    } catch (e) {
      const msg = e instanceof SourceBlocked ? e.message : String((e as Error).message)
      await db.insertInto('scan_runs').values({
        source: code, started_at: startedAt, finished_at: new Date(),
        status: 'error', jobs_seen: 0, jobs_new: 0, error_text: msg.slice(0, 500), track,
      }).execute()
      console.error(`[${code}] ERROR — ${msg}`)
    }
  }

  // Stamp the track only when at least one source succeeded, so a fully failed
  // run does not push the track to the back of the rotation queue.
  if (track && okCount > 0) {
    await db.updateTable('scan_keywords')
      .set({ last_scanned_at: new Date() })
      .where('track', '=', track)
      .execute()
  }

  // Lifecycle: keep stored classifier flags in step with the code (details in reclassify.ts).
  // Runs before dedupe, which blocks on company_norm + is_senior.
  const re = await reclassifyOpenJobs(db)
  if (re.changed > 0) console.log(`[reclassify] updated ${re.changed} of ${re.checked} open job(s)`)

  // Lifecycle: expire jobs their own track has missed twice (details in db/expire.ts).
  const expired = await expireStaleJobs(db)
  if (expired.tracked + expired.legacy > 0) {
    console.log(`[expiry] marked ${expired.tracked + expired.legacy} job(s) as no longer seen`)
  }

  // Lifecycle: regroup cross-source duplicates (details in dedupe.ts).
  const dup = await groupDuplicates(db)
  console.log(`[dedupe] ${dup.groups} group(s) covering ${dup.grouped} job(s)`)

  await callRevalidate()
  await db.destroy()
  process.exit(okCount === 0 && toRun.length > 0 ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
