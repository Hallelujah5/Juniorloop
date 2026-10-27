/**
 * Minimal migration runner: applies the .sql files in migrations/ in filename
 * order, recording them in the _migrations table. Creates the database itself
 * if it does not exist yet (handy for local dev). Run: pnpm db:migrate
 */
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import pg from 'pg'

const HERE = dirname(fileURLToPath(import.meta.url))
config({ path: join(HERE, '..', '..', '..', '.env') }) // .env lives at the monorepo root
const MIGRATIONS_DIR = join(HERE, '..', 'migrations')

async function createDatabaseIfMissing(url: string) {
  const u = new URL(url)
  const dbName = u.pathname.slice(1)
  u.pathname = '/postgres'
  const client = new pg.Client({ connectionString: u.toString() })
  try {
    await client.connect()
    const r = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
    if (r.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '')}"`)
      console.log(`[db] created database ${dbName}`)
    }
  } catch (e) {
    // Neon/managed PG usually refuses connections to 'postgres' — skip; the DB already exists.
    console.log('[db] skipping database creation:', (e as Error).message.split('\n')[0])
  } finally {
    await client.end().catch(() => {})
  }
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Missing DATABASE_URL')
  await createDatabaseIfMissing(url)

  const client = new pg.Client({ connectionString: url })
  await client.connect()
  // Explicit schemas everywhere: pooled endpoints drop search_path.
  await client.query(`CREATE TABLE IF NOT EXISTS public._migrations (
    name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`)

  const applied = new Set(
    (await client.query('SELECT name FROM public._migrations')).rows.map((r) => r.name as string),
  )
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort()

  for (const f of files) {
    if (applied.has(f)) continue
    const sql = await readFile(join(MIGRATIONS_DIR, f), 'utf-8')
    console.log(`[db] applying ${f}…`)
    await client.query('BEGIN')
    try {
      // SET LOCAL lives and dies with this transaction, so unqualified names in
      // migration files resolve to public even through a transaction pooler.
      await client.query('SET LOCAL search_path TO public')
      await client.query(sql)
      await client.query('INSERT INTO public._migrations (name) VALUES ($1)', [f])
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    }
  }
  console.log('[db] done — schema is up to date.')
  await client.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
