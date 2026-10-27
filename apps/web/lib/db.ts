import { createDb } from '@juniorloop/db'

// Singleton via globalThis so dev hot-reload does not open extra pools.
const g = globalThis as unknown as { __jlDb?: ReturnType<typeof createDb> }
export const db = (g.__jlDb ??= createDb())
