'use client'

import { useEffect, useState } from 'react'

/**
 * First-visit onboarding. The site's model (a radar that re-scans every 6 hours,
 * not a live search box) is not guessable from the UI alone, so new visitors get
 * the explanation up front. Dismissal is remembered in localStorage — consistent
 * with the rest of the site, nothing leaves the browser — and the collapsed state
 * keeps a one-line toggle so the explanation stays one click away.
 */
const STORAGE_KEY = 'howItWorksDismissed'

const STEPS: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Set up your profile once',
    body: (
      <>
        On the <a href="/profile" className="font-medium underline">Scoring profile</a> page,
        drop in your CV PDF or paste its text. It is parsed by code running in this tab —
        the file never uploads (check DevTools → Network while it parses). Review the
        detected skills, fix anything wrong, save.
      </>
    ),
  },
  {
    title: 'It’s a radar, not a search box',
    body: (
      <>
        A crawler re-scans TopDev, ITviec and TopCV every 6 hours across Hà Nội,
        Hồ Chí Minh and Đà Nẵng, rotating six tracks: web, mobile, game, data, QA,
        devops. Check in once a day — the “new since your last visit” counter shows
        what appeared while you were away.
      </>
    ),
  },
  {
    title: '“Best fit” ranks everything for you',
    body: (
      <>
        Scores are computed on your own device against your saved profile. Every card
        links back to the original site to apply — we never sit between you and the
        employer.
      </>
    ),
  },
  {
    title: 'Low scores on everything?',
    body: (
      <>
        The amber banner means we likely don’t crawl your area yet — a coverage gap on
        our side, not a bad market. You can still type your skills by hand on the
        profile page, and tell us which area to add.
      </>
    ),
  },
]

export function HowItWorks() {
  // null = not mounted yet (localStorage unknown) — render nothing until we know,
  // so the server HTML and the first client render never disagree.
  const [open, setOpen] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(STORAGE_KEY) !== '1')
    } catch {
      setOpen(true) // storage blocked — show it every visit; still fully usable
    }
  }, [])

  const dismiss = () => {
    setOpen(false)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* nothing to remember into */ }
  }
  const reopen = () => {
    setOpen(true)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* same */ }
  }

  if (open === null) return null

  if (!open) {
    return (
      <p className="mt-3">
        <button
          onClick={reopen}
          className="text-xs text-stone-500 underline decoration-stone-300 underline-offset-2 hover:text-stone-700"
        >
          How JuniorLoop works
        </button>
      </p>
    )
  }

  return (
    <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-800">
          New here? How JuniorLoop works
        </h2>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
        >
          Got it
        </button>
      </div>

      <ol className="mt-3 grid gap-3 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span
              aria-hidden
              className="flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white"
            >
              {i + 1}
            </span>
            <div className="text-sm leading-relaxed text-stone-700">
              <p className="font-semibold text-stone-900">{s.title}</p>
              <p className="mt-0.5">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-3 border-t border-emerald-200/70 pt-2.5 text-xs text-stone-500">
        Your profile lives in this browser only (localStorage) — nothing is stored on our
        servers, there are no accounts. Details in{' '}
        <a href="/principles" className="underline">data principles</a>.
      </p>
    </section>
  )
}
