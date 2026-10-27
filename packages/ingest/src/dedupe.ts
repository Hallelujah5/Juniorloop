import { citiesCompatible, cityBuckets, titlesLookSame } from '@juniorloop/core'
import type { Db } from '@juniorloop/db'

/**
 * Cross-source duplicate grouping, recomputed from scratch over all OPEN jobs after
 * every scan (hundreds of rows — trivial, and recomputing avoids incremental drift).
 *
 * Blocking: identical company_norm AND same seniority flag AND compatible city
 * buckets — only then are titles compared (titlesLookSame, core). Matches land in
 * a shared dup_group = the smallest job id of the group. Never a destructive merge:
 * every row keeps its own data; the UI just renders grouped rows as one card.
 */
export async function groupDuplicates(db: Db): Promise<{ groups: number; grouped: number }> {
  const jobs = await db
    .selectFrom('jobs')
    .select(['id', 'source', 'title_raw', 'company_norm', 'location', 'is_senior', 'dup_group'])
    .where('status', '=', 'open')
    .execute()

  // Union-find over job ids.
  const parent = new Map<number, number>()
  const find = (x: number): number => {
    let r = x
    while (parent.get(r) !== undefined && parent.get(r) !== r) r = parent.get(r)!
    parent.set(x, r)
    return r
  }
  const union = (a: number, b: number) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(Math.max(ra, rb), Math.min(ra, rb))
  }

  // Blocks: company_norm + seniority. Placeholder companies never block together.
  const blocks = new Map<string, typeof jobs>()
  for (const j of jobs) {
    if (!j.company_norm || j.company_norm === 'see posting') continue
    const key = `${j.company_norm}|${j.is_senior ? 's' : 'j'}`
    const arr = blocks.get(key) ?? []
    arr.push(j)
    blocks.set(key, arr)
  }

  const cities = new Map<number, string[]>()
  for (const [, members] of blocks) {
    if (members.length < 2) continue
    for (const m of members) cities.set(m.id, cityBuckets(m.location))
    for (let i = 0; i < members.length; i++) {
      for (let k = i + 1; k < members.length; k++) {
        const a = members[i]!
        const b = members[k]!
        if (!citiesCompatible(cities.get(a.id)!, cities.get(b.id)!)) continue
        if (titlesLookSame(a.title_raw, b.title_raw)) union(a.id, b.id)
      }
    }
  }

  // Components of size ≥2 get dup_group = min id; everything else gets null.
  const components = new Map<number, number[]>()
  for (const j of jobs) {
    if (!parent.has(j.id)) continue
    const root = find(j.id)
    const arr = components.get(root) ?? []
    arr.push(j.id)
    components.set(root, arr)
  }
  const desired = new Map<number, number>()
  let groups = 0
  for (const [, ids] of components) {
    if (ids.length < 2) continue
    groups += 1
    const gid = Math.min(...ids)
    for (const id of ids) desired.set(id, gid)
  }

  // Write only the diffs.
  let grouped = 0
  for (const j of jobs) {
    const want = desired.get(j.id) ?? null
    if (want !== null) grouped += 1
    if (want !== j.dup_group) {
      await db.updateTable('jobs').set({ dup_group: want }).where('id', '=', j.id).execute()
    }
  }
  return { groups, grouped }
}
