import * as cheerio from 'cheerio'
import { createFetcher, sleep } from '../http'
import type { RawJob, SourceFn } from './types'

/** TopCV: public search page; the -kl1 suffix means Hanoi. Run from a residential machine. */
export const fetchTopcv: SourceFn = async (keywords, delaySeconds) => {
  const fetchText = createFetcher('topcv')
  const found = new Map<string, RawJob>()
  for (const kw of keywords) {
    const html = await fetchText(
      `https://www.topcv.vn/tim-viec-lam-${encodeURIComponent(kw)}-tai-ha-noi-kl1`,
    )
    const $ = cheerio.load(html)
    $('.job-item-search-result').each((_, el) => {
      const card = $(el)
      const a = card.find('a[href*="/viec-lam/"]').first()
      const href = (a.attr('href') ?? '').split('?')[0] ?? ''
      const id = /\/(\d+)\.html$/.exec(href)?.[1]
      if (!id || !href) return
      const img = card.find('img').first()
      found.set(id, {
        sourceId: id,
        url: href,
        title: (img.attr('title') ?? a.attr('aria-label') ?? '').trim(),
        company: (img.attr('alt') ?? '').trim(),
        salary: card.find('.title-salary').first().text().trim() || null,
        location: 'Hà Nội',
        skills: [],
      })
    })
    await sleep(delaySeconds)
  }
  return [...found.values()]
}
