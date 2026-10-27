import * as cheerio from 'cheerio'
import { createFetcher, sleep } from '../http'
import type { RawJob, SourceFn } from './types'

/**
 * ITviec: public search page /it-jobs/{kw}/ha-noi (behind Cloudflare — run from a
 * residential machine, not CI). Each card carries a data-...-job-slug-value attr;
 * the slug looks like "job-title-company-name-12345" (id at the end). Title and
 * company come from the DOM when present, falling back to a humanized slug.
 */
export const fetchItviec: SourceFn = async (keywords, delaySeconds) => {
  const fetchText = createFetcher('itviec')
  const found = new Map<string, RawJob>()
  for (const kw of keywords) {
    const html = await fetchText(`https://itviec.com/it-jobs/${encodeURIComponent(kw)}/ha-noi`)
    const $ = cheerio.load(html)
    $('[data-search--job-selection-job-slug-value]').each((_, el) => {
      const slug = $(el).attr('data-search--job-selection-job-slug-value') ?? ''
      const id = /-(\d+)$/.exec(slug)?.[1]
      if (!id) return
      const card = $(el)
      // DOM selectors may change — the slug fallback keeps the source alive.
      const domTitle = card.find('h3').first().text().trim()
      const domCompany = card.find('a[href^="/companies/"]').first().text().trim()
      const fromSlug = slug.replace(/-\d+$/, '').replace(/-/g, ' ')
      found.set(id, {
        sourceId: id,
        url: `https://itviec.com/it-jobs/${slug}`,
        title: domTitle || fromSlug,
        company: domCompany || '(see posting)',
        salary: null, // ITviec hides salaries behind login — we do not work around that
        location: 'Hà Nội',
        skills: [],
      })
    })
    await sleep(delaySeconds)
  }
  return [...found.values()]
}
