'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Top navigation. Three deliberate hierarchy levels: the wordmark, quiet pill
 * links with an active state, and the profile link as a right-aligned CTA.
 * The CTA is solid emerald while no scoring profile is saved (setting one up
 * is the one action the product depends on) and goes quiet once that job is
 * done — the saved/not state lives in localStorage, like everything else.
 */
const LINKS = [
  { href: '/', label: 'Jobs', isActive: (p: string) => p === '/' },
  { href: '/jobs', label: 'Browse', isActive: (p: string) => p === '/jobs' || p.startsWith('/jobs/') },
  { href: '/status', label: 'Status', isActive: (p: string) => p === '/status' },
  { href: '/principles', label: 'Principles', isActive: (p: string) => p === '/principles' },
]

/** The loop: a scan that comes back around — the 6-hour radar in one glyph. */
function LoopMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-[18px] w-[18px] text-emerald-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}

export function SiteNav() {
  const pathname = usePathname()
  // null until mounted — whether a profile is saved only the browser knows.
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  useEffect(() => {
    try {
      setHasProfile(localStorage.getItem('profile') !== null)
    } catch {
      setHasProfile(true) // storage blocked — keep the quiet variant, no nagging
    }
  }, [])

  const needsSetup = hasProfile === false
  const onProfile = pathname === '/profile'

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
        <Link href="/" className="mr-1 flex items-center gap-2 text-lg font-bold tracking-tight">
          <LoopMark />
          <span>
            Junior<span className="text-emerald-600">Loop</span>
          </span>
        </Link>

        <div className="order-3 flex w-full flex-wrap items-center gap-1 text-sm sm:order-none sm:w-auto">
          {LINKS.map((l) => {
            const active = l.isActive(pathname)
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  active
                    ? 'bg-emerald-50 font-semibold text-emerald-800'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {l.label}
              </Link>
            )
          })}
        </div>

        <div className="order-2 ml-auto sm:order-none">
          <Link
            href="/profile"
            aria-current={onProfile ? 'page' : undefined}
            className={
              needsSetup
                ? `rounded-full bg-emerald-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 ${onProfile ? 'ring-2 ring-emerald-200' : ''}`
                : `flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-emerald-400 hover:text-stone-900 ${onProfile ? 'border-emerald-400 text-emerald-800' : ''}`
            }
          >
            {needsSetup ? (
              'Set up profile'
            ) : (
              <>
                {hasProfile && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                Profile
              </>
            )}
          </Link>
        </div>
      </nav>
    </header>
  )
}
