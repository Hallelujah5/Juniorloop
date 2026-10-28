/**
 * Cities the HTML sources scan. Slugs verified by probing on 2026-10-28 — do not
 * guess new ones, probe them (curl the URL, read the <title>):
 * - ITviec: plain 'ho-chi-minh' is a SOFT 404 (HTTP 200 + an error page), the real
 *   slug is 'ho-chi-minh-hcm'.
 * - TopCV ignores the slug text entirely and keys on the kl{N} code: kl3 is
 *   Bình Dương and kl4 is Bắc Ninh — NOT alphabetical. Đà Nẵng is kl8.
 * TopDev needs no city list: its API returns nationwide results with locations.
 */
export const SCAN_CITIES = [
  { label: 'Hà Nội', itviec: 'ha-noi', topcv: 'tai-ha-noi-kl1' },
  { label: 'Hồ Chí Minh', itviec: 'ho-chi-minh-hcm', topcv: 'tai-ho-chi-minh-kl2' },
  { label: 'Đà Nẵng', itviec: 'da-nang', topcv: 'tai-da-nang-kl8' },
] as const

/** Merge a newly seen city into a job's location string ("Hà Nội; Đà Nẵng"). */
export function mergeCity(location: string | null, label: string): string {
  if (!location) return label
  return location.includes(label) ? location : `${location}; ${label}`
}
