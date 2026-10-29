import { isSenior, normalizeCompany, normalizeTitle } from '@juniorloop/core'
import type { Db } from '@juniorloop/db'

/**
 * Re-derive the classifier columns (is_senior, title_norm, company_norm) for every
 * OPEN job after each scan. They are computed at upsert time, so without this a
 * better isSenior only reaches rows the source happens to re-list — "Data Engineer
 * (Lead)" stayed visible for a day after the bracket fix shipped. Hundreds of rows,
 * diff-only writes: cheap, and the stored flags always match the deployed code.
 */
export async function reclassifyOpenJobs(db: Db): Promise<{ checked: number; changed: number }> {
  const jobs = await db
    .selectFrom('jobs')
    .select(['id', 'title_raw', 'company_raw', 'is_senior', 'title_norm', 'company_norm', 'min_years'])
    .where('status', '=', 'open')
    .execute()

  let changed = 0
  for (const j of jobs) {
    const next = {
      is_senior: isSenior(j.title_raw, j.min_years),
      title_norm: normalizeTitle(j.title_raw),
      company_norm: normalizeCompany(j.company_raw),
    }
    if (
      next.is_senior === j.is_senior &&
      next.title_norm === j.title_norm &&
      next.company_norm === j.company_norm
    ) continue
    await db.updateTable('jobs').set(next).where('id', '=', j.id).execute()
    changed += 1
  }
  return { checked: jobs.length, changed }
}
