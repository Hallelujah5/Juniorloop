/** Strip Vietnamese diacritics + lowercase: "Lập Trình Viên" -> "lap trinh vien". */
export function removeDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
}

/** Normalize a title for comparison: strip diacritics, bracketed text, odd chars. */
export function normalizeTitle(s: string): string {
  return removeDiacritics(s)
    .replace(/[([{].*?[)\]}]/g, ' ')
    .replace(/[^a-z0-9+#. ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Legal-entity suffixes to strip. The Vietnamese tokens are deliberate: company
// names in the postings are written in Vietnamese ("Công ty TNHH …").
const COMPANY_SUFFIXES = [
  'cong ty co phan', 'cong ty tnhh', 'cong ty', 'cty',
  'joint stock company', 'jsc', 'co., ltd', 'co.,ltd', 'co ltd', 'ltd',
  'company limited', 'company', 'corporation', 'corp', 'inc',
  'viet nam', 'vietnam', 'vn', 'global', 'international', 'software', 'technology', 'tech',
]

/** Normalize a company name for dedupe blocking: strip diacritics + legal suffixes. */
export function normalizeCompany(s: string): string {
  let t = ' ' + removeDiacritics(s).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() + ' '
  let changed = true
  while (changed) {
    changed = false
    for (const suffix of COMPANY_SUFFIXES) {
      if (t.startsWith(' ' + suffix + ' ')) { t = ' ' + t.slice(suffix.length + 2); changed = true }
      if (t.endsWith(' ' + suffix + ' ')) { t = t.slice(0, -(suffix.length + 1)); changed = true }
    }
  }
  return t.trim()
}

/** FNV-1a 32-bit — no cryptography needed, just stable and isomorphic. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** Rough duplicate-detection hash (same source under a new id, cross-source prep). */
export function dedupeHash(title: string, company: string): string {
  const key = normalizeTitle(title) + '|' + normalizeCompany(company)
  const reversed = [...key].reverse().join('')
  return fnv1a(key).toString(16).padStart(8, '0') + fnv1a(reversed).toString(16).padStart(8, '0')
}

// Vietnamese tokens are kept on purpose: titles in the postings mix Vietnamese and
// English. "truong phong" = head of department, "quan ly" = manager, "cao cap" =
// senior-level ("chuyên viên cao cấp"), "chuyen gia" = expert, "kien truc su" =
// architect. "sen" covers the "Mid/Sen", "Sen/Lead" shorthand.
const SENIOR_TOKENS = [
  'senior', 'sen', 'sr.', 'sr ', 'lead', 'leader', 'teamlead', 'techlead', 'principal', 'architect', 'head of',
  'director', 'manager', 'cto', 'expert', 'truong phong', 'truong nhom', 'quan ly',
  'cao cap', 'chuyen gia', 'kien truc su',
]

// "Từ 2 năm KN", "2+ years", "5EXP": a demanded minimum of 2+ years is beyond the
// 0–1y audience whatever the title says. Ranges ("1 - 3 năm") count their lower
// bound — a 0–1y candidate can realistically reach a posting that starts at 1.
const YEARS_DEMANDED = /(\d+)(?:\s*[-–]\s*\d+)?\s*\+?\s*(?:nam|years?|yrs?|exp)(?![a-z])/
const EXPERIENCED_YEARS = 2

/**
 * Parse a source's structured experience field into minimum years. TopDev's
 * experiences_str is "min năm, max năm" ("2 năm, 5 năm" → 2); the first number
 * is the demanded minimum. "Chưa có/không yêu cầu kinh nghiệm" → 0; an empty or
 * numberless string → null (the source did not say — never treat that as 0).
 */
export function minYearsFromExperiences(s: string | null | undefined): number | null {
  if (!s) return null
  const plain = removeDiacritics(s)
  const m = /(\d+)/.exec(plain)
  if (m) return Number(m[1])
  if (/chua co kinh nghiem|khong yeu cau/.test(plain)) return 0
  return null
}

/**
 * Is this posting beyond the junior audience? Flag it (NEVER delete) — hidden by
 * default in queries. Three signals, any one fires: a seniority token in the
 * title, a year demand in the title, or the source's structured minimum years
 * (minYears, when the source provides one). Deliberately does NOT use
 * normalizeTitle: that strips bracketed text, and "(Senior)" must still count.
 */
export function isSenior(title: string, minYears?: number | null): boolean {
  if ((minYears ?? 0) >= EXPERIENCED_YEARS) return true
  const t = ' ' + removeDiacritics(title).replace(/[^a-z0-9+#. ]/g, ' ').replace(/\s+/g, ' ').trim() + ' '
  if (SENIOR_TOKENS.some((tok) => t.includes(tok.endsWith(' ') || tok.endsWith('.') ? ' ' + tok : ' ' + tok + ' '))) {
    return true
  }
  // Match on the un-stripped text: the range dash in "1-3 năm" is what makes 1 the bound.
  const years = YEARS_DEMANDED.exec(removeDiacritics(title))
  return years !== null && Number(years[1]) >= EXPERIENCED_YEARS
}
