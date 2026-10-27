import type { MetadataRoute } from 'next'
import { getCrawledTracks, getJobs } from '@/lib/data'
import { CITIES, jobInCity, jobsForSkill } from '@/lib/categories'
import { BASE_URL as BASE } from '@/lib/base-url'

/** Category pages enter the sitemap only while they have content (empty ones are noindex). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tracks, all] = await Promise.all([getCrawledTracks(), getJobs()])
  const juniors = all.filter((j) => !j.isSenior)

  const categories: MetadataRoute.Sitemap = []
  for (const skill of tracks.flatMap((t) => t.keywords)) {
    const matching = jobsForSkill(juniors, skill)
    if (matching.length === 0) continue
    categories.push({ url: `${BASE}/jobs/${skill}`, changeFrequency: 'hourly', priority: 0.8 })
    for (const c of CITIES) {
      if (matching.some((j) => jobInCity(j, c.slug))) {
        categories.push({ url: `${BASE}/jobs/${skill}/${c.slug}`, changeFrequency: 'hourly', priority: 0.6 })
      }
    }
  }

  return [
    { url: `${BASE}/`, changeFrequency: 'hourly', priority: 1 },
    { url: `${BASE}/jobs`, changeFrequency: 'daily', priority: 0.9 },
    ...categories,
    { url: `${BASE}/profile`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/principles`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/status`, changeFrequency: 'daily', priority: 0.3 },
  ]
}
