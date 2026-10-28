import type { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

// Vietnamese-first typeface (full diacritic coverage, tabular figures); next/font
// self-hosts it at build time — zero runtime requests to Google, consistent with
// the privacy posture.
const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: { default: 'JuniorLoop — IT jobs for juniors, in one place', template: '%s · JuniorLoop' },
  description:
    'Aggregates IT job postings from TopDev, ITviec and TopCV every 6 hours, filters for genuinely junior roles, and scores each posting against your profile. Free, no ads.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={beVietnam.variable}>
      <body>
        <header className="border-b border-stone-200 bg-white">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Junior<span className="text-emerald-600">Loop</span>
            </Link>
            <div className="flex gap-4 text-sm text-stone-600">
              <Link href="/" className="hover:text-stone-900">Jobs</Link>
              <Link href="/jobs" className="hover:text-stone-900">Browse</Link>
              <Link href="/profile" className="hover:text-stone-900">Scoring profile</Link>
              <Link href="/status" className="hover:text-stone-900">Pipeline status</Link>
              <Link href="/principles" className="hover:text-stone-900">Data principles</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-stone-500">
          <p>
            Data is aggregated from the public search pages of TopDev, ITviec and TopCV — every
            posting links back to the original site to apply. Non-commercial, no ads.
          </p>
          <p className="mt-1">
            Represent a source site and want your data removed? See our{' '}
            <Link href="/principles" className="underline">data principles</Link> — we disable
            sources as soon as we are asked.
          </p>
        </footer>
      </body>
    </html>
  )
}
