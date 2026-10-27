import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import type { DB } from './types'

export type { DB, NguonTable, ViecTable, LanQuetTable } from './types'

/** Type kết nối cho các package khác — để họ khỏi phải phụ thuộc kysely trực tiếp. */
export type Db = Kysely<DB>

/** Mỗi process một pool nhỏ — Neon free ưa ít kết nối, web ISR càng không cần nhiều. */
export function taoDb(connectionString = process.env.DATABASE_URL): Kysely<DB> {
  if (!connectionString) throw new Error('Thiếu DATABASE_URL (xem .env.example)')
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString, max: 3 }),
    }),
  })
}
