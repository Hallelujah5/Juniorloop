import type { JobInput } from './types'
import { removeDiacritics } from './normalize'
import { SYNONYMS } from './score'

/** All spellings a search term stands for: "react.js" → react, reactjs, react.js. */
function variantsOf(term: string): string[] {
  if (SYNONYMS[term]) return SYNONYMS[term]
  for (const cluster of Object.values(SYNONYMS)) if (cluster.includes(term)) return cluster
  return [term]
}

/**
 * Free-text search over title, company and skill tags. Every term must match, as
 * a substring (so "comp" still finds "Company X"), after stripping diacritics on
 * both sides — "lap trinh" and "lập trình" are the same query — and expanding
 * the scorer's synonym clusters, so "React.js" finds "ReactJS".
 */
export function jobMatchesQuery(job: JobInput, query: string): boolean {
  const terms = removeDiacritics(query).trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const text = removeDiacritics(
    [job.title, job.company, ...(job.skills ?? [])].join(' '),
  )
  return terms.every((term) => variantsOf(term).some((v) => text.includes(v)))
}
