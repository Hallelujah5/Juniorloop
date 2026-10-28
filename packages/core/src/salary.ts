import { removeDiacritics } from './normalize'

/**
 * TopDev login-gates exact salaries: anonymous viewers (and crawlers) get the
 * digits starred out, e.g. "1******* - 2******* VND" or "Lên tới 2******* VND".
 * The mask deliberately leaks magnitude — the leading digit(s) and the digit
 * count survive — so "2*******" can only be a number in [20,000,000, 30,000,000).
 *
 * This translates a masked string into an honest approximate range, using ONLY
 * what the mask reveals. It is a DISPLAY-layer transform: salary_raw in the DB
 * stays verbatim (rewriting source data at ingest is how aggregators drift into
 * lying — a format change there would mint confident wrong numbers forever).
 * Anything unrecognized returns null and the caller renders the raw string.
 */
export function translateMaskedSalary(raw: string): string | null {
  if (!raw.includes('*')) return null

  const masked = [...raw.matchAll(/(\d+)(\*+)/g)].map((m) => {
    const lead = Number(m[1])
    const k = m[2]!.length
    return { lo: lead * 10 ** k, hi: (lead + 1) * 10 ** k }
  })
  // One masked number ("up to X") or a masked range ("A - B") — anything else
  // (bare "***", three numbers, a mask we can't bound) falls back to verbatim.
  if (masked.length === 0 || masked.length > 2) return null

  const lo = masked[0]!.lo
  const hi = masked[masked.length - 1]!.hi

  const usd = /usd|\$/i.test(raw)
  let range: string
  if (usd) {
    range = `$${lo.toLocaleString('en-US')}–${hi.toLocaleString('en-US')}`
  } else {
    // VND below 1M/month is not a salary we can present confidently — bail out.
    if (lo < 1_000_000) return null
    const m = (n: number) => (n % 1_000_000 === 0 ? String(n / 1_000_000) : (n / 1_000_000).toFixed(1))
    range = `${m(lo)}–${m(hi)}M VND`
  }

  // "Lên tới"/"tới"/"up to" and "từ"/"from" qualifiers only make sense with a
  // single masked figure; a two-sided range already carries both bounds.
  const plain = removeDiacritics(raw.toLowerCase())
  if (masked.length === 1) {
    if (/\btoi\b|up to/.test(plain)) return `up to ~${range}`
    if (/\btu\b|from/.test(plain)) return `from ~${range}`
  }
  return `~${range}`
}
