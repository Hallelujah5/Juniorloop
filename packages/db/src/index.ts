import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import type { DB } from './types'

export type { DB, SourcesTable, JobsTable, ScanRunsTable } from './types'
export { expireStaleJobs } from './expire'

/** Connection type for other packages — so they need no direct kysely dependency. */
export type Db = Kysely<DB>

/** One small pool per process — Neon free prefers few connections; ISR needs even fewer. */
export function createDb(connectionString = process.env.DATABASE_URL): Kysely<DB> {
  if (!connectionString) throw new Error('Missing DATABASE_URL (see .env.example)')
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString, max: 3 }),
    }),
  })
}
