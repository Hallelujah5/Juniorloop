import { sql } from 'kysely'
import type { Db } from './index'

/**
 * Mark open jobs 'expired' when their source has had ≥2 SUCCESSFUL scans of the
 * job's own track since the job was last seen — a failed scan proves nothing, and
 * a scan of a different track proves nothing either. Time guards keep rapid manual
 * re-runs from expiring jobs that merely slipped off page one of the results.
 * Re-sighting reopens a job (the upsert sets status back to 'open').
 *
 * Jobs with last_track IS NULL predate tracking (or came from explicit --keywords
 * runs): for those, any ≥2 successful scans of the source count, with a longer
 * 72-hour guard.
 */
export async function expireStaleJobs(db: Db): Promise<{ tracked: number; legacy: number }> {
  const tracked = await sql`
    UPDATE jobs SET status = 'expired'
    WHERE status = 'open' AND last_track IS NOT NULL
      AND last_seen_at < now() - interval '48 hours'
      AND (SELECT count(*) FROM scan_runs r
           WHERE r.source = jobs.source AND r.track = jobs.last_track
             AND r.status = 'ok' AND r.started_at > jobs.last_seen_at) >= 2
  `.execute(db)

  const legacy = await sql`
    UPDATE jobs SET status = 'expired'
    WHERE status = 'open' AND last_track IS NULL
      AND last_seen_at < now() - interval '72 hours'
      AND (SELECT count(*) FROM scan_runs r
           WHERE r.source = jobs.source
             AND r.status = 'ok' AND r.started_at > jobs.last_seen_at) >= 2
  `.execute(db)

  return {
    tracked: Number(tracked.numAffectedRows ?? 0),
    legacy: Number(legacy.numAffectedRows ?? 0),
  }
}
