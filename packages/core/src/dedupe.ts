import { removeDiacritics } from './normalize'

/**
 * Cross-source duplicate detection: two postings are "the same job" when the same
 * company, in a compatible city, posts titles whose TOKEN SETS overlap enough.
 * Tuned to prefer missing a duplicate over a false merge — a wrong merge destroys
 * trust faster than a visible duplicate.
 */

// Multi-word phrases collapse to one token BEFORE splitting.
const MULTIWORD: [RegExp, string][] = [
  [/full[ -]?stack/g, 'fullstack'],
  [/front[ -]?end/g, 'frontend'],
  [/back[ -]?end/g, 'backend'],
  [/react[ .-]?native/g, 'reactnative'],
  [/node[ .-]?js\b/g, 'node'],
  [/react[ .-]?js\b/g, 'react'],
  [/nest[ .-]?js\b/g, 'nest'],
  [/next[ .-]?js\b/g, 'next'],
  [/vue[ .-]?js\b/g, 'vue'],
  [/asp\.net\b|\.net\b/g, ' dotnet '],
]

const TOKEN_MAP: Record<string, string> = {
  js: 'javascript', ts: 'typescript', reactjs: 'react', nodejs: 'node',
  nestjs: 'nest', nextjs: 'next', vuejs: 'vue', golang: 'go', postgres: 'postgresql',
}

// Role fillers and the salary noise TopCV loves in titles ("Lương Từ 10 - 20 Triệu/Tháng").
// Vietnamese tokens are domain data — they match the postings' language.
const STOPWORDS = new Set([
  'developer', 'engineer', 'dev', 'programmer', 'staff', 'job', 'jobs', 'position',
  'junior', 'fresher', 'intern',
  'nhan', 'vien', 'lap', 'trinh', 'ky', 'su', 'tuyen', 'dung', 'viec', 'lam',
  'luong', 'tu', 'den', 'trieu', 'thang', 'vnd', 'usd', 'up', 'to', 'upto',
  'thu', 'nhap', 'hap', 'dan', 'va', 'and', 'cho', 'tai', 'vi', 'tri',
])

/** Normalized, synonym-mapped, stopword-free token set of a job title. */
export function titleTokens(title: string): Set<string> {
  let t = removeDiacritics(title)
  for (const [re, rep] of MULTIWORD) t = t.replace(re, rep)
  const tokens = t
    .replace(/[^a-z0-9+#]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => TOKEN_MAP[x] ?? x)
    .filter((x) => !STOPWORDS.has(x) && !/^\d+$/.test(x))
  return new Set(tokens)
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const x of a) if (b.has(x)) inter += 1
  return inter / (a.size + b.size - inter)
}

/**
 * Jaccard ≥ 0.6, PLUS a guard for short titles: with fewer than 4 distinct tokens
 * in the union, only an exact set match counts. Example that motivated the guard:
 * "Fullstack Developer Leader" vs "Fullstack AI Leader" — 2/3 overlap, different
 * jobs at the same company.
 */
export function titlesLookSame(a: string, b: string): boolean {
  const ta = titleTokens(a)
  const tb = titleTokens(b)
  const j = jaccard(ta, tb)
  if (j < 0.6) return false
  let inter = 0
  for (const x of ta) if (tb.has(x)) inter += 1
  const union = ta.size + tb.size - inter
  return j >= 0.999 || union >= 4
}

/** City buckets for dedupe blocking (coarse on purpose; empty = unknown = compatible). */
export function cityBuckets(location: string | null | undefined): string[] {
  if (!location) return []
  const t = removeDiacritics(location)
  const out: string[] = []
  if (t.includes('ha noi') || t.includes('hanoi')) out.push('hn')
  if (t.includes('ho chi minh') || t.includes('hcm') || t.includes('sai gon')) out.push('hcm')
  if (t.includes('da nang') || t.includes('danang')) out.push('dn')
  return out
}

export function citiesCompatible(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return true
  return a.some((x) => b.includes(x))
}
