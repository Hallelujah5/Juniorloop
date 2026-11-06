export type TrackRun = { source: string; track: string; at: number }

/**
 * Which track should the next scan cover? The one the given sources have gone
 * longest without a successful scan of.
 *
 * Rotation must be per source: API and HTML sources run on different schedules,
 * and a stamp shared between them makes each schedule step over the other's
 * tracks. With 2 TopDev runs + 1 HTML run a day, a shared stamp advances 3 tracks
 * a day through 6, so the HTML run would only ever land on 2 of them.
 *
 * Only successful runs count: a failed scan proved nothing, so its track stays
 * first in line. A track with a never-scanned keyword goes first as well.
 * Ties break alphabetically so the choice is deterministic.
 */
export function pickLeastRecentTrack(
  tracks: { track: string; hasNewKeyword: boolean }[],
  sources: string[],
  runs: TrackRun[],
): string | null {
  const lastOk = new Map<string, number>()
  for (const r of runs) {
    const key = `${r.source}|${r.track}`
    lastOk.set(key, Math.max(lastOk.get(key) ?? -1, r.at))
  }
  const age = (t: { track: string; hasNewKeyword: boolean }) =>
    t.hasNewKeyword ? -1 : Math.min(...sources.map((s) => lastOk.get(`${s}|${t.track}`) ?? -1))
  const [first] = [...tracks].sort((a, b) => age(a) - age(b) || a.track.localeCompare(b.track))
  return first?.track ?? null
}
