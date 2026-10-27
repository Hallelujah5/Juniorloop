/**
 * Migration runner tối giản: áp các file .sql trong migrations/ theo thứ tự tên,
 * ghi sổ vào bảng _migrations. Tự tạo database nếu chưa có (tiện cho dev local).
 * Chạy: pnpm db:migrate
 */
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import pg from 'pg'

const GOC = dirname(fileURLToPath(import.meta.url))
config({ path: join(GOC, '..', '..', '..', '.env') }) // .env ở gốc monorepo
const THU_MUC = join(GOC, '..', 'migrations')

async function taoDatabaseNeuChua(url: string) {
  const u = new URL(url)
  const tenDb = u.pathname.slice(1)
  u.pathname = '/postgres'
  const client = new pg.Client({ connectionString: u.toString() })
  try {
    await client.connect()
    const r = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [tenDb])
    if (r.rowCount === 0) {
      await client.query(`CREATE DATABASE "${tenDb.replace(/"/g, '')}"`)
      console.log(`[db] đã tạo database ${tenDb}`)
    }
  } catch (e) {
    // Neon/managed PG thường không cho nối vào 'postgres' — bỏ qua, DB đã có sẵn.
    console.log('[db] bỏ qua bước tạo database:', (e as Error).message.split('\n')[0])
  } finally {
    await client.end().catch(() => {})
  }
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Thiếu DATABASE_URL')
  await taoDatabaseNeuChua(url)

  const client = new pg.Client({ connectionString: url })
  await client.connect()
  await client.query(`CREATE TABLE IF NOT EXISTS _migrations (
    ten text PRIMARY KEY, ap_luc timestamptz NOT NULL DEFAULT now())`)

  const daAp = new Set(
    (await client.query('SELECT ten FROM _migrations')).rows.map((r) => r.ten as string),
  )
  const files = (await readdir(THU_MUC)).filter((f) => f.endsWith('.sql')).sort()

  for (const f of files) {
    if (daAp.has(f)) continue
    const sql = await readFile(join(THU_MUC, f), 'utf-8')
    console.log(`[db] áp ${f}…`)
    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query('INSERT INTO _migrations (ten) VALUES ($1)', [f])
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    }
  }
  console.log('[db] xong — schema mới nhất.')
  await client.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
