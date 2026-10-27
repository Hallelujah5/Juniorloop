import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: 'hourly', priority: 1 },
    { url: `${BASE}/profile`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/principles`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/status`, changeFrequency: 'daily', priority: 0.3 },
  ]
}
