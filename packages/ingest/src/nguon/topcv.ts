import * as cheerio from 'cheerio'
import { cho, taoFetcher } from '../http'
import type { HamNguon, TinThu } from './types'

/** TopCV: trang tìm kiếm công khai, hậu tố -kl1 = Hà Nội. Chạy từ máy cá nhân. */
export const quetTopcv: HamNguon = async (tuKhoa, choGiay) => {
  const tai = taoFetcher('topcv')
  const gom = new Map<string, TinThu>()
  for (const kw of tuKhoa) {
    const html = await tai(
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
      gom.set(id, {
        nguonId: id,
        url: href,
        tieuDe: (img.attr('title') ?? a.attr('aria-label') ?? '').trim(),
        congTy: (img.attr('alt') ?? '').trim(),
        luong: card.find('.title-salary').first().text().trim() || null,
        diaDiem: 'Hà Nội',
        skills: [],
      })
    })
    await cho(choGiay)
  }
  return [...gom.values()]
}
