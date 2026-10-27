/**
 * Dev-only reset: drops the public schema and re-creates it, so the next
 * `pnpm db:migrate` starts from zero. REFUSES to run against anything that is
 * not localhost — this must never touch a hosted database.
 * Run: pnpm --filter @juniorloop/db reset && pnpm db:migrate
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import pg from 'pg'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '.env') })

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Missing DATABASE_URL')
  const host = new URL(url).hostname
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error(`Refusing to reset non-local database (host: ${host})`)
  }
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
  console.log('[db] local schema dropped — run pnpm db:migrate to rebuild.')
  await client.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
