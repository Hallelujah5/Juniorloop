import type { Metadata } from 'next'
import Link from 'next/link'
import { getCrawledTracks, getJobs } from '@/lib/data'
import { CITIES, jobInCity, jobsForSkill, prettySkill, skillStats, type CitySlug } from '@/lib/categories'
import { JobList } from '@/components/JobList'

export const dynamicParams = false

type Params = Promise<{ skill: string; city: CitySlug }>

export async function generateStaticParams() {
  const tracks = await getCrawledTracks()
  return tracks
    .flatMap((t) => t.keywords)
    .flatMap((skill) => CITIES.map((c) => ({ skill, city: c.slug })))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { skill, city } = await params
  const cityName = CITIES.find((c) => c.slug === city)?.name ?? city
  const juniors = jobsForSkill((await getJobs()).filter((j) => !j.isSenior), skill)
    .filter((j) => jobInCity(j, city))
  const name = prettySkill(skill)
  return {
    title: `Junior ${name} jobs — ${cityName} (${juniors.length} open)`,
    description: `${juniors.length} open junior ${name} positions in ${cityName}, aggregated from TopDev, ITviec and TopCV every 6 hours.`,
    robots: juniors.length === 0 ? { index: false, follow: true } : undefined,
  }
}

export default async function SkillCityPage({ params }: { params: Params }) {
  const { skill, city } = await params
  const cityName = CITIES.find((c) => c.slug === city)?.name ?? city
  const name = prettySkill(skill)
  const matching = jobsForSkill(await getJobs(), skill).filter((j) => jobInCity(j, city))
  const juniors = matching.filter((j) => !j.isSenior)
  const stats = skillStats(juniors, matching.length - juniors.length)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Browse', item: '/jobs' },
      { '@type': 'ListItem', position: 2, name, item: `/jobs/${skill}` },
      { '@type': 'ListItem', position: 3, name: cityName },
    ],
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-stone-500">
        <Link href="/jobs" className="hover:underline">Browse</Link> /{' '}
        <Link href={`/jobs/${skill}`} className="hover:underline">{name}</Link> / {cityName}
      </nav>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">
        Junior {name} jobs — {cityName}
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        {stats.total} open · {stats.newThisWeek} new this week · {stats.salaryPct}% disclose salary
        {stats.seniorHidden > 0 && ` · ${stats.seniorHidden} senior roles hidden`}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-stone-500">Other cities:</span>
        {CITIES.filter((c) => c.slug !== city).map((c) => (
          <Link key={c.slug} href={`/jobs/${skill}/${c.slug}`}
            className="rounded-full border border-stone-200 bg-white px-3 py-1 hover:border-stone-400">
            {c.name}
          </Link>
        ))}
      </div>

      {juniors.length === 0 && (
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          No {name} postings in {cityName} right now. The{' '}
          <Link href={`/jobs/${skill}`} className="underline">all-Vietnam {name} page</Link>{' '}
          has {`more coverage`}.
        </p>
      )}

      <JobList jobs={juniors} />
    </div>
  )
}
