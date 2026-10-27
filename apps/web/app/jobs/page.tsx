import Link from 'next/link'
import { getCrawledTracks, getJobs } from '@/lib/data'
import { jobsForSkill, prettySkill } from '@/lib/categories'

export const metadata = {
  title: 'Browse junior jobs by skill',
  description:
    'Junior developer jobs in Vietnam grouped by skill — Node.js, React, Unity, Python, QA and more. Aggregated from TopDev, ITviec and TopCV every 6 hours.',
}

export default async function BrowsePage() {
  const [tracks, all] = await Promise.all([getCrawledTracks(), getJobs()])
  const juniors = all.filter((j) => !j.isSenior)

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Browse junior jobs by skill</h1>
      <p className="mt-1 text-sm text-stone-600">
        {juniors.length} open junior postings across {tracks.length} skill tracks,
        refreshed every 6 hours. Every count links to a dedicated page.
      </p>
      <div className="mt-6 space-y-6">
        {tracks.map((t) => (
          <section key={t.track}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{t.track}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {t.keywords.map((skill) => {
                const n = jobsForSkill(juniors, skill).length
                return (
                  <Link
                    key={skill}
                    href={`/jobs/${skill}`}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm hover:border-stone-400"
                  >
                    {prettySkill(skill)} <span className="tabular-nums text-stone-500">({n})</span>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
