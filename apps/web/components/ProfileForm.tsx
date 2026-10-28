'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_PROFILE, type ExtractedProfile, type Profile } from '@juniorloop/core'
import type { TrackCoverage } from '@/lib/data'
import { CvUpload } from './CvUpload'

function parseSkills(csv: string): string[] {
  return csv.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
}

/** Loose two-way containment against crawled keywords — a notice, not a gate. */
function hasCoverage(skills: string[], crawled: string[]): boolean {
  if (skills.length === 0) return true
  return skills.some((skill) => {
    const k = skill.replace(/\s+/g, '-')
    return crawled.some((c) => c.includes(k) || k.includes(c))
  })
}

export function ProfileForm({ tracks }: { tracks: TrackCoverage[] }) {
  const [primary, setPrimary] = useState('')
  const [secondary, setSecondary] = useState('')
  const [prefersEnglish, setPrefersEnglish] = useState(true)
  const [saved, setSaved] = useState(false)
  const [draftSummary, setDraftSummary] = useState<{ skills: number; english: boolean | null } | null>(null)

  /** A CV draft prefills the form — nothing is saved until the user clicks Save. */
  function applyDraft(p: ExtractedProfile) {
    setPrimary(p.primaryStack.join(', '))
    setSecondary(p.secondaryStack.join(', '))
    if (p.prefersEnglish !== null) setPrefersEnglish(p.prefersEnglish)
    setDraftSummary({ skills: Object.keys(p.matchCounts).length, english: p.prefersEnglish })
    setSaved(false)
  }

  useEffect(() => {
    let p: Profile = DEFAULT_PROFILE
    try {
      const raw = localStorage.getItem('profile')
      if (raw) p = { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
    } catch { /* fall back to defaults */ }
    setPrimary(p.primaryStack.join(', '))
    setSecondary(p.secondaryStack.join(', '))
    setPrefersEnglish(p.prefersEnglish)
  }, [])

  const crawled = tracks.flatMap((t) => t.keywords)
  const coverageGap = !hasCoverage(parseSkills(primary), crawled)

  function save(e: React.FormEvent) {
    e.preventDefault()
    const p: Profile = {
      primaryStack: parseSkills(primary),
      secondaryStack: parseSkills(secondary),
      prefersEnglish,
    }
    try {
      localStorage.setItem('profile', JSON.stringify(p))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      // storage blocked (private mode) — the profile lives for this session only
      setSaved(true)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Scoring profile</h1>
      <p className="mt-2 text-sm text-stone-600">
        This profile <strong>stays in your browser</strong> (localStorage) — no account,
        nothing sent to a server. Each posting is scored on your device: +3 per primary
        skill, +1 per secondary skill, +2 when the posting mentions junior/fresher, +2
        when it signals an English/global/remote environment (if you opt in), −3 when it
        demands 3+ years of experience.
      </p>

      <div className="mt-5">
        <CvUpload onDraft={applyDraft} />
        {draftSummary && (
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Found {draftSummary.skills} skill{draftSummary.skills === 1 ? '' : 's'}
            {draftSummary.english === true && ' · English CV detected'}
            {draftSummary.english === false && ' · Vietnamese CV detected'}
            {' '}— review the draft below, then Save.
          </p>
        )}
      </div>

      <form onSubmit={save} className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium">Primary skills (comma-separated) — +3 pts each</span>
          <input
            value={primary} onChange={(e) => setPrimary(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            placeholder="typescript, react, nodejs"
          />
        </label>

        {coverageGap && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <p className="font-medium">Honest heads-up: we don't crawl your stack yet.</p>
            <p className="mt-1">
              None of your primary skills match the keywords we currently scan, so the
              jobs page will mostly show noise for you. Tracks crawled today:{' '}
              {tracks.map((t) => `${t.track} (${t.keywords.join(', ')})`).join(' — ')}
            </p>
          </div>
        )}

        <label className="block">
          <span className="text-sm font-medium">Secondary technologies — +1 pt each</span>
          <input
            value={secondary} onChange={(e) => setSecondary(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            placeholder="vuejs, django, aws"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={prefersEnglish} onChange={(e) => setPrefersEnglish(e.target.checked)} />
          Prefer English / global / remote environments (+2 pts)
        </label>
        <div className="flex items-center gap-3">
          <button className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white">Save profile</button>
          {saved && <span className="text-sm text-emerald-700">Saved — head back to Jobs to see your scores.</span>}
        </div>
      </form>
    </div>
  )
}
