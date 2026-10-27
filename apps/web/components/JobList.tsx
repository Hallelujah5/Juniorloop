'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_PROFILE, scoreJob, type Profile } from '@juniorloop/core'
import type { JobRow } from '@/lib/data'

const SOURCE_NAMES: Record<string, string> = { topdev: 'TopDev', itviec: 'ITviec', topcv: 'TopCV' }

function readProfile(): Profile {
  try {
    const raw = localStorage.getItem('profile')
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch { /* private mode / storage blocked — fall back to defaults */ }
  return DEFAULT_PROFILE
}

function timeAgo(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600_000)
  if (hours < 1) return 'just updated'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/** Scores render after mount (the profile lives in localStorage) — the server renders newest-first. */
export function JobList({ jobs }: { jobs: JobRow[] }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'score'>('newest')
  useEffect(() => setProfile(readProfile()), [])

  const scored = profile
    ? jobs.map((j) => ({
        ...j,
        score: scoreJob(
          { title: j.title, company: j.company, salary: j.salary, location: j.location, skills: j.skills },
          profile,
        ),
      }))
    : jobs.map((j) => ({ ...j, score: null as number | null }))

  // Non-destructive dedupe: rows sharing a dup_group render as ONE card — the most
  // recently seen row leads, the rest become "Also on …" buttons.
  type Scored = (typeof scored)[number]
  const byGroup = new Map<number, Scored[]>()
  const entries: { primary: Scored; others: Scored[] }[] = []
  for (const j of scored) {
    if (j.dupGroup === null) { entries.push({ primary: j, others: [] }); continue }
    const arr = byGroup.get(j.dupGroup) ?? []
    arr.push(j)
    byGroup.set(j.dupGroup, arr)
  }
  for (const [, members] of byGroup) {
    const sorted = [...members].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
    entries.push({ primary: sorted[0]!, others: sorted.slice(1) })
  }

  const visible = sortBy === 'score' && profile
    ? [...entries].sort((a, b) => (b.primary.score ?? 0) - (a.primary.score ?? 0))
    : [...entries].sort((a, b) => b.primary.lastSeen.localeCompare(a.primary.lastSeen))

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="text-stone-500">Sort:</span>
        <button
          onClick={() => setSortBy('newest')}
          className={`rounded-full px-3 py-1 ${sortBy === 'newest' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-300'}`}
        >
          Newest
        </button>
        <button
          onClick={() => setSortBy('score')}
          disabled={!profile}
          className={`rounded-full px-3 py-1 ${sortBy === 'score' ? 'bg-emerald-600 text-white' : 'bg-white border border-stone-300'}`}
        >
          Best fit
        </button>
      </div>

      {profile && entries.length > 0 && scored.every((j) => (j.score ?? 0) < 3) && (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          None of the {entries.length} open postings match your primary skills — that is
          likely a coverage gap on our side, not a bad market. Check{' '}
          <a href="/profile" className="underline">your profile page</a> to see which
          stacks we crawl today.
        </p>
      )}

      {visible.length === 0 && (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
          No jobs match these filters. Try fewer keywords, or wait for the next scan.
        </p>
      )}

      <ul className="space-y-2.5">
        {visible.map(({ primary: j, others }) => (
          <li key={`${j.source}-${j.id}`} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <a href={j.url} target="_blank" rel="nofollow noopener" className="font-semibold hover:underline">
                  {j.title} <span aria-hidden>↗</span>
                </a>
                <p className="mt-0.5 text-sm text-stone-600">{j.company}</p>
              </div>
              {j.score !== null && (
                <span
                  title="Fit score for your profile — computed on your device, never sent anywhere"
                  className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${
                    j.score >= 8 ? 'bg-emerald-100 text-emerald-800'
                    : j.score >= 4 ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {j.score} pts
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
              <span className="rounded bg-stone-100 px-1.5 py-0.5 font-medium">{SOURCE_NAMES[j.source] ?? j.source}</span>
              {j.salary && <span className="text-emerald-700 font-medium">{j.salary}</span>}
              {j.location && <span>{j.location}</span>}
              <span>{timeAgo(j.lastSeen)}</span>
              {j.isSenior && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">senior</span>}
            </div>
            {j.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {j.skills.slice(0, 8).map((s) => (
                  <span key={s} className="rounded-full border border-stone-200 px-2 py-0.5 text-xs text-stone-600">{s}</span>
                ))}
              </div>
            )}
            {others.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-stone-500">Also posted on:</span>
                {others.map((o) => (
                  <a
                    key={`${o.source}-${o.id}`}
                    href={o.url}
                    target="_blank"
                    rel="nofollow noopener"
                    title={o.title}
                    className="rounded-full border border-stone-300 bg-stone-50 px-2 py-0.5 font-medium text-stone-700 hover:border-stone-500"
                  >
                    {SOURCE_NAMES[o.source] ?? o.source} ↗
                  </a>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
