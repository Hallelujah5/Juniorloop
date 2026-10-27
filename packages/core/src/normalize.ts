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

// Vietnamese tokens ("truong phong" = head of department, "quan ly" = manager)
// are kept on purpose: titles in the postings mix Vietnamese and English.
const SENIOR_TOKENS = [
  'senior', 'sr.', 'sr ', 'lead', 'leader', 'principal', 'architect', 'head of',
  'director', 'manager', 'cto', 'truong phong', 'truong nhom', 'quan ly',
]

/**
 * Is this posting aimed at experienced engineers? Flag it (NEVER delete) — hidden by
 * default in queries. Deliberately does NOT use normalizeTitle: that strips bracketed
 * text, and "(Senior)" in brackets must still count.
 */
export function isSenior(title: string): boolean {
  const t = ' ' + removeDiacritics(title).replace(/[^a-z0-9+#. ]/g, ' ').replace(/\s+/g, ' ').trim() + ' '
  return SENIOR_TOKENS.some((tok) => t.includes(tok.endsWith(' ') || tok.endsWith('.') ? ' ' + tok : ' ' + tok + ' '))
}
