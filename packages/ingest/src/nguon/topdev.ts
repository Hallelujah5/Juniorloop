import { cho, taoFetcher } from '../http'
import type { HamNguon, TinThu } from './types'

const FIELDS = 'id,title,salary,company,detail_url,addresses,skills_str,job_levels_str'

/** TopDev: API JSON công khai (param đúng là `keyword`). Nguồn chạy được trên CI. */
export const quetTopdev: HamNguon = async (tuKhoa, choGiay) => {
  const tai = taoFetcher('topdev')
  const gom = new Map<string, TinThu>()
  for (const kw of tuKhoa) {
    const url =
      'https://api.topdev.vn/td/v2/jobs?fields%5Bjob%5D=' + FIELDS +
      `&locale=vi_VN&page_size=30&keyword=${encodeURIComponent(kw)}`
    const d = JSON.parse(await tai(url)) as { data?: Record<string, unknown>[] }
    for (const j of d.data ?? []) {
      const id = String(j.id ?? '')
      const urlTin = String(j.detail_url ?? '')
      if (!id || !urlTin) continue
      const salary = j.salary as { value?: string } | string | null | undefined
      const sa = (j.addresses as { sort_addresses?: unknown } | undefined)?.sort_addresses
      const diaDiem = Array.isArray(sa) ? sa.join('; ') : typeof sa === 'string' ? sa : null
      gom.set(id, {
        nguonId: id,
        url: urlTin,
        tieuDe: String(j.title ?? ''),
        congTy: String((j.company as { display_name?: string } | undefined)?.display_name ?? ''),
        luong: typeof salary === 'object' ? salary?.value ?? null : salary ?? null,
        diaDiem,
        skills: String(j.skills_str ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      })
    }
    await cho(choGiay)
  }
  return [...gom.values()]
}
