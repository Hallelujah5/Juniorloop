import Link from 'next/link'
import { getCrawledTracks, getJobs } from '@/lib/data'
import { jsonLd } from '@/lib/json-ld'
import { jobMatchesQuery } from '@juniorloop/core'
import { CITIES, jobInCity, prettySkill, toJobInput, type CitySlug } from '@/lib/categories'
import { HowItWorks } from '@/components/HowItWorks'
import { JobList } from '@/components/JobList'

type SP = Promise<Record<string, string | undefined>>

export default async function HomePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const source = sp.source ?? ''
  const city = CITIES.some((c) => c.slug === sp.city) ? (sp.city as CitySlug) : ''
  const showSenior = sp.senior === '1'

  const [all, tracks] = await Promise.all([getJobs(), getCrawledTracks()])
  const jobs = all.filter((j) => {
    if (!showSenior && j.isSenior) return false
    if (source && j.source !== source) return false
    if (city && !jobInCity(j, city)) return false
    if (q && !jobMatchesQuery(toJobInput(j), q)) return false
    return true
  })

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: jobs.slice(0, 20).map((j, i) => ({
      '@type': 'ListItem', position: i + 1, name: `${j.title} — ${j.company}`, url: j.url,
    })),
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <h1 className="text-2xl font-bold tracking-tight">
        IT jobs for juniors — 3 boards in one place, refreshed every 6 hours
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        {jobs.length} open postings{!showSenior && ' (senior/lead roles hidden)'}. Set up your{' '}
        <a href="/profile" className="underline">profile</a> to score every posting on your own device.
      </p>

      <HowItWorks />

      <form method="GET" className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <input
          type="search" name="q" defaultValue={sp.q ?? ''} placeholder="keywords: react, nestjs, company name…"
          className="w-64 rounded-lg border border-stone-300 bg-white px-3 py-2"
        />
        <select name="source" defaultValue={source} className="rounded-lg border border-stone-300 bg-white px-2 py-2">
          <option value="">All sources</option>
          <option value="topdev">TopDev</option>
          <option value="itviec">ITviec</option>
          <option value="topcv">TopCV</option>
        </select>
        <select name="city" defaultValue={city} className="rounded-lg border border-stone-300 bg-white px-2 py-2">
          <option value="">All cities</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-stone-600">
          <input type="checkbox" name="senior" value="1" defaultChecked={showSenior} />
          include senior roles
        </label>
        <button className="rounded-lg bg-stone-900 px-4 py-2 font-medium text-white">Filter</button>
      </form>

      <JobList jobs={jobs} />

      <section className="mt-8 border-t border-stone-200 pt-5">
        <h2 className="text-sm font-semibold text-stone-700">Browse by skill</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tracks.flatMap((t) => t.keywords).map((skill) => (
            <Link key={skill} href={`/jobs/${skill}`}
              className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-600 hover:border-stone-400">
              {prettySkill(skill)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
