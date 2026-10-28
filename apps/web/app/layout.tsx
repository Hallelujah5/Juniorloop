import type { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
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
        <SiteNav />
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
