import { unstable_cache } from 'next/cache'
import { db } from './db'

export type JobRow = {
  id: number
  source: string
  sourceName: string
  url: string
  title: string
  company: string
  salary: string | null
  location: string | null
  skills: string[]
  isSenior: boolean
  lastSeen: string
}

/**
 * One cache entry for every open job (≤1000 rows) — filters run in-memory in the
 * server component. The DB only wakes when ingest calls revalidate or the 30-minute
 * TTL expires, keeping us far below Neon free's compute ceiling.
 */
export const getJobs = unstable_cache(
  async (): Promise<JobRow[]> => {
    const rows = await db
      .selectFrom('jobs')
      .innerJoin('sources', 'sources.code', 'jobs.source')
      .select([
        'jobs.id', 'jobs.source', 'sources.name as source_name', 'jobs.url',
        'jobs.title_raw', 'jobs.company_raw', 'jobs.salary_raw',
        'jobs.location', 'jobs.skills', 'jobs.is_senior', 'jobs.last_seen_at',
      ])
      .where('jobs.status', '=', 'open')
      .where('sources.display_enabled', '=', true)
      .orderBy('jobs.last_seen_at', 'desc')
      .limit(1000)
      .execute()
    return rows.map((r) => ({
      id: r.id,
      source: r.source,
      sourceName: r.source_name,
      url: r.url,
      title: r.title_raw,
      company: r.company_raw,
      salary: r.salary_raw,
      location: r.location,
      skills: r.skills,
      isSenior: r.is_senior,
      lastSeen: r.last_seen_at.toISOString(),
    }))
  },
  ['open-jobs'],
  { tags: ['jobs'], revalidate: 1800 },
)

export type ScanRunRow = {
  id: number
  source: string
  startedAt: string
  status: string
  jobsSeen: number
  jobsNew: number
  error: string | null
}

export const getScanRuns = unstable_cache(
  async (): Promise<ScanRunRow[]> => {
    const rows = await db
      .selectFrom('scan_runs')
      .selectAll()
      .orderBy('started_at', 'desc')
      .limit(30)
      .execute()
    return rows.map((r) => ({
      id: r.id,
      source: r.source,
      startedAt: r.started_at.toISOString(),
      status: r.status,
      jobsSeen: r.jobs_seen,
      jobsNew: r.jobs_new,
      error: r.error_text,
    }))
  },
  ['scan-runs'],
  { tags: ['jobs'], revalidate: 1800 },
)
