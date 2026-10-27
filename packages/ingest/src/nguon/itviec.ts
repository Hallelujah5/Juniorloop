import * as cheerio from 'cheerio'
import { cho, taoFetcher } from '../http'
import type { HamNguon, TinThu } from './types'

/**
 * ITviec: trang tìm kiếm công khai /it-jobs/{kw}/ha-noi (Cloudflare — chạy từ máy
 * cá nhân, không chạy CI). Mỗi card có attr data-...-job-slug-value; slug dạng
 * "tieu-de-cong-ty-12345" (id ở cuối). Title/company lấy từ DOM khi có,
 * fallback về slug đã nhân hoá.
 */
export const quetItviec: HamNguon = async (tuKhoa, choGiay) => {
  const tai = taoFetcher('itviec')
  const gom = new Map<string, TinThu>()
  for (const kw of tuKhoa) {
    const html = await tai(`https://itviec.com/it-jobs/${encodeURIComponent(kw)}/ha-noi`)
    const $ = cheerio.load(html)
    $('[data-search--job-selection-job-slug-value]').each((_, el) => {
      const slug = $(el).attr('data-search--job-selection-job-slug-value') ?? ''
      const id = /-(\d+)$/.exec(slug)?.[1]
      if (!id) return
      const card = $(el)
      // Selector DOM có thể đổi — fallback slug giữ cho nguồn không chết hẳn.
      const tieuDeDom = card.find('h3').first().text().trim()
      const congTyDom = card.find('a[href^="/companies/"]').first().text().trim()
      const tuSlug = slug.replace(/-\d+$/, '').replace(/-/g, ' ')
      gom.set(id, {
        nguonId: id,
        url: `https://itviec.com/it-jobs/${slug}`,
        tieuDe: tieuDeDom || tuSlug,
        congTy: congTyDom || '(xem trong tin)',
        luong: null, // ITviec giấu lương sau đăng nhập — không lách
        diaDiem: 'Hà Nội',
        skills: [],
      })
    })
    await cho(choGiay)
  }
  return [...gom.values()]
}
