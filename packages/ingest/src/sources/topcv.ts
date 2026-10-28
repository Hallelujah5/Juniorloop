import * as cheerio from 'cheerio'
import { createFetcher, sleep, SourceBlocked } from '../http'
import { mergeCity, SCAN_CITIES } from './cities'
import type { RawJob, SourceFn } from './types'

/** TopCV: public search pages; city comes from the kl{N} code (see cities.ts).
 *  Run from a residential machine. Multi-city jobs keep one row, locations merged. */
export const fetchTopcv: SourceFn = async (keywords, delaySeconds) => {
  const fetchText = createFetcher('topcv')
  const found = new Map<string, RawJob>()
  for (const kw of keywords) {
    for (const city of SCAN_CITIES) {
      try {
        const html = await fetchText(
          `https://www.topcv.vn/tim-viec-lam-${encodeURIComponent(kw)}-${city.topcv}`,
        )
        const $ = cheerio.load(html)
        $('.job-item-search-result').each((_, el) => {
          const card = $(el)
          const a = card.find('a[href*="/viec-lam/"]').first()
          const href = (a.attr('href') ?? '').split('?')[0] ?? ''
          const id = /\/(\d+)\.html$/.exec(href)?.[1]
          if (!id || !href) return
          const existing = found.get(id)
          if (existing) {
            existing.location = mergeCity(existing.location, city.label)
            return
          }
          const img = card.find('img').first()
          found.set(id, {
            sourceId: id,
            url: href,
            title: (img.attr('title') ?? a.attr('aria-label') ?? '').trim(),
            company: (img.attr('alt') ?? '').trim(),
            salary: card.find('.title-salary').first().text().trim() || null,
            location: city.label,
            skills: [],
          })
        })
      } catch (e) {
        if (e instanceof SourceBlocked) throw e
        console.log(`[topcv] "${kw}" in ${city.label} failed (${(e as Error).message}) — skipping`)
      }
      await sleep(delaySeconds)
    }
  }
  return [...found.values()]
}
