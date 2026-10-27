import { createFetcher, sleep } from '../http'
import type { RawJob, SourceFn } from './types'

const FIELDS = 'id,title,salary,company,detail_url,addresses,skills_str,job_levels_str'

/** TopDev: public JSON API (the working param is `keyword`). Safe to run on CI. */
export const fetchTopdev: SourceFn = async (keywords, delaySeconds) => {
  const fetchText = createFetcher('topdev')
  const found = new Map<string, RawJob>()
  for (const kw of keywords) {
    const url =
      'https://api.topdev.vn/td/v2/jobs?fields%5Bjob%5D=' + FIELDS +
      `&locale=vi_VN&page_size=30&keyword=${encodeURIComponent(kw)}`
    const d = JSON.parse(await fetchText(url)) as { data?: Record<string, unknown>[] }
    for (const j of d.data ?? []) {
      const id = String(j.id ?? '')
      const jobUrl = String(j.detail_url ?? '')
      if (!id || !jobUrl) continue
      const salary = j.salary as { value?: string } | string | null | undefined
      const sa = (j.addresses as { sort_addresses?: unknown } | undefined)?.sort_addresses
      const location = Array.isArray(sa) ? sa.join('; ') : typeof sa === 'string' ? sa : null
      found.set(id, {
        sourceId: id,
        url: jobUrl,
        title: String(j.title ?? ''),
        company: String((j.company as { display_name?: string } | undefined)?.display_name ?? ''),
        salary: typeof salary === 'object' ? salary?.value ?? null : salary ?? null,
        location,
        skills: String(j.skills_str ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      })
    }
    await sleep(delaySeconds)
  }
  return [...found.values()]
}
