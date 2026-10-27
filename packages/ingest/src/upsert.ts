import { isSenior, normalizeCompany, normalizeTitle } from '@juniorloop/core'
import type { Db } from '@juniorloop/db'
import type { RawJob } from './sources/types'

/** Upsert on (source, source_id); a job seen again gets last_seen updated and is REOPENED. */
export async function upsertJobs(
  db: Db,
  source: string,
  jobs: RawJob[],
): Promise<{ seen: number; inserted: number }> {
  if (jobs.length === 0) return { seen: 0, inserted: 0 }

  const existing = new Set(
    (
      await db
        .selectFrom('jobs')
        .select('source_id')
        .where('source', '=', source)
        .where('source_id', 'in', jobs.map((j) => j.sourceId))
        .execute()
    ).map((r) => r.source_id),
  )

  const now = new Date()
  for (const j of jobs) {
    if (!j.title) continue
    const row = {
      source,
      source_id: j.sourceId,
      url: j.url,
      title_raw: j.title,
      title_norm: normalizeTitle(j.title),
      company_raw: j.company,
      company_norm: normalizeCompany(j.company),
      salary_raw: j.salary,
      location: j.location,
      skills: j.skills,
      is_senior: isSenior(j.title),
      status: 'open' as const,
      last_seen_at: now,
    }
    await db
      .insertInto('jobs')
      .values(row)
      .onConflict((oc) =>
        oc.columns(['source', 'source_id']).doUpdateSet({
          url: row.url,
          title_raw: row.title_raw,
          title_norm: row.title_norm,
          company_raw: row.company_raw,
          company_norm: row.company_norm,
          salary_raw: row.salary_raw,
          location: row.location,
          skills: row.skills,
          is_senior: row.is_senior,
          status: 'open', // seen again → reopen, keep first_seen_at
          last_seen_at: now,
        }),
      )
      .execute()
  }
  return { seen: jobs.length, inserted: jobs.filter((j) => !existing.has(j.sourceId)).length }
}
