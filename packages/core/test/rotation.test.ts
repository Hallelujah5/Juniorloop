import { describe, expect, it } from 'vitest'
import { pickLeastRecentTrack, type TrackRun } from '../src/rotation'

const T = (...names: string[]) => names.map((track) => ({ track, hasNewKeyword: false }))
const SIX = T('data', 'devops', 'game', 'mobile', 'qa', 'web')

describe('pickLeastRecentTrack', () => {
  it('picks the track this source scanned longest ago', () => {
    const runs: TrackRun[] = [
      { source: 'itviec', track: 'web', at: 300 },
      { source: 'itviec', track: 'qa', at: 100 },
      { source: 'itviec', track: 'game', at: 200 },
    ]
    expect(pickLeastRecentTrack(T('web', 'qa', 'game'), ['itviec'], runs)).toBe('qa')
  })

  it('ignores other sources, so schedules cannot step over each other', () => {
    const runs: TrackRun[] = [
      { source: 'topdev', track: 'qa', at: 999 },
      { source: 'itviec', track: 'qa', at: 100 },
      { source: 'itviec', track: 'web', at: 200 },
    ]
    expect(pickLeastRecentTrack(T('qa', 'web'), ['itviec'], runs)).toBe('qa')
  })

  it('goes to never-scanned tracks first, alphabetically', () => {
    const runs: TrackRun[] = [
      { source: 'topcv', track: 'web', at: 100 },
      { source: 'topcv', track: 'data', at: 200 },
      { source: 'topcv', track: 'mobile', at: 300 },
    ]
    expect(pickLeastRecentTrack(SIX, ['topcv'], runs)).toBe('devops')
  })

  it('uses the most lagging source when a run covers several', () => {
    const runs: TrackRun[] = [
      { source: 'itviec', track: 'qa', at: 500 },
      { source: 'topcv', track: 'qa', at: 100 },
      { source: 'itviec', track: 'web', at: 300 },
      { source: 'topcv', track: 'web', at: 300 },
    ]
    expect(pickLeastRecentTrack(T('qa', 'web'), ['itviec', 'topcv'], runs)).toBe('qa')
  })

  it('puts a track with a never-scanned keyword first', () => {
    const runs: TrackRun[] = [
      { source: 'topdev', track: 'qa', at: 100 },
      { source: 'topdev', track: 'web', at: 900 },
    ]
    const tracks = [{ track: 'qa', hasNewKeyword: false }, { track: 'web', hasNewKeyword: true }]
    expect(pickLeastRecentTrack(tracks, ['topdev'], runs)).toBe('web')
  })

  it('reaches all six tracks in six runs while another source keeps scanning', () => {
    const runs: TrackRun[] = []
    const visited = new Set<string>()
    for (let day = 0; day < 6; day++) {
      const track = pickLeastRecentTrack(SIX, ['itviec'], runs)!
      visited.add(track)
      runs.push({ source: 'itviec', track, at: day * 10 })
      runs.push({ source: 'topdev', track: 'web', at: day * 10 + 1 })
      runs.push({ source: 'topdev', track: 'qa', at: day * 10 + 2 })
    }
    expect(visited.size).toBe(6)
  })

  it('returns null when there is nothing to scan', () => {
    expect(pickLeastRecentTrack([], ['topdev'], [])).toBeNull()
  })
})
