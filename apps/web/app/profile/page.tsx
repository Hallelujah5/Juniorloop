'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_PROFILE, type Profile } from '@juniorloop/core'

export default function ProfilePage() {
  const [primary, setPrimary] = useState('')
  const [secondary, setSecondary] = useState('')
  const [prefersEnglish, setPrefersEnglish] = useState(true)
  const [saved, setSaved] = useState(false)

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

  function save(e: React.FormEvent) {
    e.preventDefault()
    const p: Profile = {
      primaryStack: primary.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      secondaryStack: secondary.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
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

      <form onSubmit={save} className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium">Primary skills (comma-separated) — +3 pts each</span>
          <input
            value={primary} onChange={(e) => setPrimary(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            placeholder="typescript, react, nodejs"
          />
        </label>
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
