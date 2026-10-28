import type { JobInput, Profile } from './types'
import { removeDiacritics } from './normalize'

/** Synonym clusters: declare one skill in the profile, match every spelling in postings.
 *  Exported so extract.ts tests can assert SKILL_LEXICON stays aligned with these keys —
 *  a prefilled profile must score exactly as well as a hand-typed one. */
export const SYNONYMS: Record<string, string[]> = {
  typescript: ['typescript', 'ts'],
  react: ['react', 'reactjs', 'react.js'],
  nodejs: ['nodejs', 'node.js', 'node'],
  nestjs: ['nestjs', 'nest.js'],
  postgresql: ['postgresql', 'postgres'],
  nextjs: ['nextjs', 'next.js'],
  vuejs: ['vuejs', 'vue.js', 'vue'],
  django: ['django'],
  php: ['php', 'laravel'],
  mongodb: ['mongodb', 'mongo'],
  redis: ['redis'],
  aws: ['aws', 'amazon web services', 'lambda', 'dynamodb'],
  docker: ['docker'],
}

// Vietnamese tokens kept deliberately — they match the postings' language:
// "tieng anh" = English, "chau au" = Europe, "nam kinh nghiem" = years of experience.
const JUNIOR_SIGNALS = ['junior', 'fresher', 'graduate', 'intern', '0-1', '0 - 1']
const ENGLISH_SIGNALS = ['english', 'tieng anh', 'global', 'remote', 'australia', 'singapore', 'europe', 'chau au', 'uk', 'usa', 'united states']
const EXPERIENCE_PENALTIES = ['5+ years', '4+ years', '3+ years', '5 nam kinh nghiem', '4 nam kinh nghiem', '3 nam kinh nghiem']

// Word-boundary matching: a profile skill must match a whole token, never a
// substring — otherwise "unity" matches "opportunity" and "java" matches
// "javascript". Alphanumeric look-arounds keep ".js", "c++", "c#" working.
const REGEX_CACHE = new Map<string, RegExp>()
function hasToken(text: string, phrase: string): boolean {
  let re = REGEX_CACHE.get(phrase)
  if (!re) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`)
    REGEX_CACHE.set(phrase, re)
  }
  return re.test(text)
}

function matches(text: string, skill: string): boolean {
  const variants = SYNONYMS[skill] ?? [skill]
  return variants.some((v) => hasToken(text, v))
}

function jobText(job: JobInput): string {
  return ' ' + removeDiacritics(
    [job.title, job.company, job.salary ?? '', job.location ?? '', (job.skills ?? []).join(' ')].join(' '),
  ) + ' '
}

/**
 * Does one posting mention one skill? Powers the /jobs/{skill} category pages.
 * Accepts slug form ("react-native", "data-engineer") by also trying the
 * dashes-to-spaces variant.
 */
export function jobMatchesSkill(job: JobInput, skill: string): boolean {
  const s = removeDiacritics(skill)
  const variants = new Set(SYNONYMS[s] ?? [s])
  if (s.includes('-')) variants.add(s.replace(/-/g, ' '))
  const text = jobText(job)
  return [...variants].some((v) => hasToken(text, v))
}

/**
 * Score how well a posting fits a profile. Pure; runs on server and client.
 * +3 per primary skill, +1 per secondary skill, +2 for junior signals, +2 for
 * English/global signals (when the profile opts in), −3 for 3+ years-of-experience
 * demands.
 */
export function scoreJob(job: JobInput, profile: Profile): number {
  const text = jobText(job)
  let score = 0
  for (const skill of profile.primaryStack) if (matches(text, removeDiacritics(skill))) score += 3
  for (const skill of profile.secondaryStack) if (matches(text, removeDiacritics(skill))) score += 1
  if (JUNIOR_SIGNALS.some((t) => hasToken(text, t))) score += 2
  if (profile.prefersEnglish && ENGLISH_SIGNALS.some((t) => hasToken(text, t))) score += 2
  if (EXPERIENCE_PENALTIES.some((t) => hasToken(text, t))) score -= 3
  return score
}
