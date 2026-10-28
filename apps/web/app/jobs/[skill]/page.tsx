import type { Metadata } from 'next'
import Link from 'next/link'
import { getCrawledTracks, getJobs } from '@/lib/data'
import { CITIES, jobInCity, jobsForSkill, prettySkill, skillStats } from '@/lib/categories'
import { JobList } from '@/components/JobList'

export const dynamicParams = false

type Params = Promise<{ skill: string }>

export async function generateStaticParams() {
  const tracks = await getCrawledTracks()
  return tracks.flatMap((t) => t.keywords).map((skill) => ({ skill }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { skill } = await params
  const juniors = jobsForSkill((await getJobs()).filter((j) => !j.isSenior), skill)
  const name = prettySkill(skill)
  return {
    title: `Junior ${name} jobs in Vietnam (${juniors.length} open)`,
    description: `${juniors.length} open junior ${name} positions aggregated from TopDev, ITviec and TopCV, refreshed every 6 hours. No account needed — scored against your own profile, on your device.`,
    // An empty category is honest but thin — keep it out of the index until it fills.
    robots: juniors.length === 0 ? { index: false, follow: true } : undefined,
  }
}

export default async function SkillPage({ params }: { params: Params }) {
  const { skill } = await params
  const matching = jobsForSkill(await getJobs(), skill)
  const juniors = matching.filter((j) => !j.isSenior)
  const stats = skillStats(juniors, matching.length - juniors.length)
  const name = prettySkill(skill)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Browse', item: '/jobs' },
        { '@type': 'ListItem', position: 2, name },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: juniors.slice(0, 20).map((j, i) => ({
        '@type': 'ListItem', position: i + 1, name: `${j.title} — ${j.company}`, url: j.url,
      })),
    },
  ]

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-stone-500">
        <Link href="/jobs" className="hover:underline">Browse</Link> / {name}
      </nav>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">Junior {name} jobs in Vietnam</h1>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <dt className="text-xs text-stone-500">Open junior postings</dt>
          <dd className="text-xl font-semibold tabular-nums">{stats.total}</dd>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <dt className="text-xs text-stone-500">New this week</dt>
          <dd className="text-xl font-semibold tabular-nums">{stats.newThisWeek}</dd>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <dt className="text-xs text-stone-500">Salary disclosed</dt>
          <dd className="text-xl font-semibold tabular-nums">{stats.salaryPct}%</dd>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <dt className="text-xs text-stone-500">Senior roles hidden</dt>
          <dd className="text-xl font-semibold tabular-nums">{stats.seniorHidden}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-stone-500">By city:</span>
        {CITIES.map((c) => {
          const n = juniors.filter((j) => jobInCity(j, c.slug)).length
          return (
            <Link key={c.slug} href={`/jobs/${skill}/${c.slug}`}
              className="rounded-full border border-stone-200 bg-white px-3 py-1 hover:border-stone-400">
              {c.name} <span className="tabular-nums text-stone-500">({n})</span>
            </Link>
          )
        })}
      </div>

      {juniors.length === 0 && (
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          Nothing matched {name} in the current corpus. The crawler covers this keyword, so
          either the market is quiet or the track was scanned a while ago — check{' '}
          <Link href="/status" className="underline">pipeline status</Link>.
        </p>
      )}

      <JobList
        jobs={juniors}
        noMatchNote={`None of these ${name} postings match your scoring profile — they are real jobs, just outside the skills you listed.`}
      />
    </div>
  )
}
