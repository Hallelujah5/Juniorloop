/**
 * Scan CLI — runs on GitHub Actions (API sources) and on a personal machine (HTML sources):
 *   pnpm scan --sources topdev            # on CI
 *   pnpm scan --sources itviec,topcv      # on the personal machine (Task Scheduler)
 *   pnpm scan --keywords nodejs,reactjs --delay 2
 * Respects the kill switch: sources with ingest_enabled=false in the DB are skipped.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '.env') })

import { parseArgs } from 'node:util'
import { createDb } from '@juniorloop/db'
import { SourceBlocked } from './http'
import { fetchItviec } from './sources/itviec'
import { fetchTopcv } from './sources/topcv'
import { fetchTopdev } from './sources/topdev'
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
    keywords: { type: 'string', default: 'nodejs,reactjs,typescript,fullstack' },
    delay: { type: 'string', default: '1.5' },
  },
})

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
  const keywords = arg.keywords!.split(',').map((s) => s.trim()).filter(Boolean)
  const delaySeconds = Number(arg.delay) || 1.5
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

  let failures = 0
  for (const code of toRun) {
    const startedAt = new Date()
    try {
      const jobs = await SOURCES[code]!(keywords, delaySeconds)
      const { seen, inserted } = await upsertJobs(db, code, jobs)
      await db.insertInto('scan_runs').values({
        source: code, started_at: startedAt, finished_at: new Date(),
        status: 'ok', jobs_seen: seen, jobs_new: inserted, error_text: null,
      }).execute()
      console.log(`[${code}] ok — ${seen} jobs, ${inserted} new`)
    } catch (e) {
      failures += 1
      const msg = e instanceof SourceBlocked ? e.message : String((e as Error).message)
      await db.insertInto('scan_runs').values({
        source: code, started_at: startedAt, finished_at: new Date(),
        status: 'error', jobs_seen: 0, jobs_new: 0, error_text: msg.slice(0, 500),
      }).execute()
      console.error(`[${code}] ERROR — ${msg}`)
    }
  }

  await callRevalidate()
  await db.destroy()
  process.exit(failures === toRun.length && toRun.length > 0 ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
