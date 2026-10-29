'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_PROFILE, scoreJob, translateMaskedSalary, type Profile } from '@juniorloop/core'
import type { JobRow } from '@/lib/data'

const SOURCE_NAMES: Record<string, string> = { topdev: 'TopDev', itviec: 'ITviec', topcv: 'TopCV' }

/**
 * Visual anchor without logos: we store metadata only (no logo URLs, no image
 * hotlinking), so each company gets a deterministic initials mark — stable
 * color from a name hash, initials from the first meaningful words.
 */
const MARK_COLORS = [
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
]
const LEGAL_WORDS = /^(cong|ty|công|cổ|co|phan|phần|tnhh|jsc|ltd|inc|corp|company|the|việt|viet|nam)$/i

function companyMark(company: string): { initials: string; color: string } {
  const words = company.split(/\s+/).filter((w) => w.length > 0 && !LEGAL_WORDS.test(w))
  const initials = (words.length >= 2
    ? words[0]![0]! + words[1]![0]!
    : (words[0] ?? company).slice(0, 2)
  ).toUpperCase()
  let hash = 0
  for (const ch of company) hash = (hash + ch.charCodeAt(0)) % 9973
  return { initials, color: MARK_COLORS[hash % MARK_COLORS.length]! }
}

/**
 * Only a profile the visitor saved themselves counts. Scoring strangers against
 * DEFAULT_PROFILE (the owner's stack) showed "0 pts" on nearly every card and
 * let "Best fit" rank by someone else's preferences — worse than no score.
 */
function readProfile(): Profile | null {
  try {
    const raw = localStorage.getItem('profile')
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch { /* private mode / storage blocked — behaves like no profile */ }
  return null
}

function timeAgo(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600_000)
  if (hours < 1) return 'just updated'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/**
 * A "visit" ends after 60 quiet minutes — so refreshing or hopping between
 * pages never clears the badges mid-session, but tomorrow's coffee check
 * highlights everything that appeared since today's. localStorage only;
 * first-time visitors get no badges (everything "new" means nothing is).
 */
const VISIT_GAP_MS = 60 * 60_000

function trackVisit(): number | null {
  try {
    const now = Date.now()
    const raw = localStorage.getItem('visits')
    const v = raw ? (JSON.parse(raw) as { current: number; previous: number | null }) : null
    if (!v || typeof v.current !== 'number') {
      localStorage.setItem('visits', JSON.stringify({ current: now, previous: null }))
      return null
    }
    if (now - v.current > VISIT_GAP_MS) {
      localStorage.setItem('visits', JSON.stringify({ current: now, previous: v.current }))
      return v.current
    }
    return v.previous
  } catch {
    return null // storage blocked — feature degrades to nothing, page works
  }
}

/** Scores render after mount (the profile lives in localStorage) — the server renders newest-first. */
export function JobList({ jobs, noMatchNote }: { jobs: JobRow[]; noMatchNote?: string }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mounted, setMounted] = useState(false)
  const [newCutoff, setNewCutoff] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'score'>('newest')
  useEffect(() => {
    setProfile(readProfile())
    setNewCutoff(trackVisit())
    setMounted(true)
  }, [])

  // A CARD is new when any posting in its dedupe group is — and the counter
  // counts cards, not raw rows, so the number always matches visible badges.
  const isNew = (j: JobRow) => newCutoff !== null && new Date(j.firstSeen).getTime() > newCutoff
  const cardIsNew = (e: { primary: JobRow; others: JobRow[] }) =>
    isNew(e.primary) || e.others.some(isNew)

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
          title={profile ? undefined : 'Save a scoring profile first'}
          className={`rounded-full px-3 py-1 ${sortBy === 'score' ? 'bg-emerald-600 text-white' : 'bg-white border border-stone-300 disabled:opacity-50'}`}
        >
          Best fit
        </button>
        {mounted && !profile && (
          <a href="/profile" className="ml-1 text-xs text-stone-500 underline decoration-stone-300 hover:text-stone-800">
            Set up a profile to see fit scores
          </a>
        )}
        {newCutoff !== null && entries.filter(cardIsNew).length > 0 && (
          <span className="ml-1 text-xs font-medium text-emerald-700">
            {entries.filter(cardIsNew).length} new since your last visit
          </span>
        )}
      </div>

      {profile && entries.length > 0 && scored.every((j) => (j.score ?? 0) < 3) && (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {noMatchNote ??
            `None of the ${entries.length} open postings match your primary skills — that is likely a coverage gap on our side, not a bad market.`}{' '}
          <a href="/profile" className="underline">Check your scoring profile</a>.
        </p>
      )}

      {visible.length === 0 && (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
          No jobs match these filters. Try fewer keywords, or wait for the next scan.
        </p>
      )}

      <ul className="space-y-3">
        {visible.map(({ primary: j, others }) => {
          const mark = companyMark(j.company)
          // TopDev stars out salary digits for anonymous viewers; the mask still
          // reveals magnitude, so show an honest range instead of "2*******".
          const approxSalary = j.salary ? translateMaskedSalary(j.salary) : null
          return (
            <li
              key={`${j.source}-${j.id}`}
              className="group rounded-2xl border border-stone-200 bg-white p-5 transition-all duration-150 hover:border-emerald-300 hover:shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
            >
              <div className="flex gap-4">
                <div
                  aria-hidden
                  className={`flex h-12 w-12 shrink-0 select-none items-center justify-center rounded-xl text-sm font-bold tracking-wide ${mark.color}`}
                >
                  {mark.initials}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <a
                        href={j.url}
                        target="_blank"
                        rel="nofollow noopener"
                        className="text-[15px] font-semibold leading-snug text-stone-900 group-hover:text-emerald-700"
                      >
                        {j.title} <span aria-hidden className="text-stone-300 group-hover:text-emerald-400">↗</span>
                      </a>
                      {cardIsNew({ primary: j, others }) && (
                        <span className="ml-1.5 inline-block rounded bg-emerald-600 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-white">
                          new
                        </span>
                      )}
                      <p className="mt-1 truncate text-[13px] text-stone-500">{j.company}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {j.salary ? (
                        <p
                          className="text-sm font-semibold text-emerald-600"
                          title={
                            approxSalary
                              ? `The source site shows the exact salary only after login — this range is read from the masked figure it publishes (“${j.salary}”).`
                              : undefined
                          }
                        >
                          {approxSalary ?? j.salary}
                        </p>
                      ) : (
                        <p className="text-xs text-stone-400">salary not listed</p>
                      )}
                      {j.score !== null && (
                        <span
                          title="Fit score for your profile — computed on your device, never sent anywhere"
                          className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                            j.score >= 8 ? 'bg-emerald-100 text-emerald-800'
                            : j.score >= 4 ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {j.score} pts
                        </span>
                      )}
                    </div>
                  </div>

                  {(j.location || j.isSenior || j.skills.length > 0) && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {j.location && (
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                          {j.location}
                        </span>
                      )}
                      {j.isSenior && (
                        <span
                          title="Hidden from the default view — aimed at experienced candidates"
                          className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700"
                        >
                          {(j.minYears ?? 0) >= 2 ? `${j.minYears}y+ exp` : 'senior'}
                        </span>
                      )}
                      {j.skills.slice(0, 5).map((s) => (
                        <span key={s} className="rounded-md border border-stone-200 px-2 py-0.5 text-xs text-stone-500">
                          {s}
                        </span>
                      ))}
                      {j.skills.length > 5 && (
                        <span className="text-xs text-stone-400">+{j.skills.length - 5}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2.5 text-xs text-stone-500">
                    <span className="flex flex-wrap items-center gap-1.5">
                      via {SOURCE_NAMES[j.source] ?? j.source}
                      {others.length > 0 && (
                        <>
                          <span className="text-stone-300">·</span>
                          <span>also on</span>
                          {others.map((o) => (
                            <a
                              key={`${o.source}-${o.id}`}
                              href={o.url}
                              target="_blank"
                              rel="nofollow noopener"
                              title={o.title}
                              className="rounded-full border border-stone-300 bg-stone-50 px-2 py-0.5 font-medium text-stone-700 hover:border-emerald-400"
                            >
                              {SOURCE_NAMES[o.source] ?? o.source} ↗
                            </a>
                          ))}
                        </>
                      )}
                    </span>
                    <span className="tabular-nums">{timeAgo(j.lastSeen)}</span>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
