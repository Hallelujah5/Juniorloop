import { taoDb } from '@juniorloop/db'

// Singleton qua globalThis để dev hot-reload không mở thêm pool.
const g = globalThis as unknown as { __jlDb?: ReturnType<typeof taoDb> }
export const db = (g.__jlDb ??= taoDb())
