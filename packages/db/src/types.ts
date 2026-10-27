import type { Generated } from 'kysely'

/** Source catalogue + kill switch: one UPDATE removes a source, no deploy needed. */
export interface SourcesTable {
  code: string
  name: string
  ingest_enabled: boolean
  display_enabled: boolean
  notes: string | null
}

export interface JobsTable {
  id: Generated<number>
  source: string
  /** Id on the source site — the in-source dedupe key is UNIQUE(source, source_id). */
  source_id: string
  url: string
  title_raw: string
  title_norm: string
  company_raw: string
  company_norm: string
  salary_raw: string | null
  location: string | null
  skills: string[]
  /** Flagged instead of deleted — "juniors only" is a display filter, not data loss. */
  is_senior: boolean
  status: 'open' | 'expired' | 'hidden'
  first_seen_at: Generated<Date>
  last_seen_at: Date
  /** Cross-source duplicate group (week 3) — never a destructive merge. */
  dup_group: number | null
}

export interface ScanRunsTable {
  id: Generated<number>
  source: string
  started_at: Date
  finished_at: Date | null
  status: 'ok' | 'error'
  jobs_seen: number
  jobs_new: number
  error_text: string | null
  /** Which keyword track this run scanned; null for explicit --keywords runs. */
  track: string | null
}

/** Crawl coverage as data: one track is scanned per run, least-recently first. */
export interface ScanKeywordsTable {
  id: Generated<number>
  track: string
  keyword: string
  enabled: boolean
  last_scanned_at: Date | null
}

export interface DB {
  sources: SourcesTable
  jobs: JobsTable
  scan_runs: ScanRunsTable
  scan_keywords: ScanKeywordsTable
}
