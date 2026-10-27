import type { JobInput, Profile } from './types'
import { removeDiacritics } from './normalize'

/** Synonym clusters: declare one skill in the profile, match every spelling in postings. */
const SYNONYMS: Record<string, string[]> = {
  typescript: ['typescript', ' ts '],
  react: ['react', 'reactjs', 'react.js'],
  nodejs: ['nodejs', 'node.js', ' node '],
  nestjs: ['nestjs', 'nest.js'],
  postgresql: ['postgresql', 'postgres'],
  nextjs: ['nextjs', 'next.js'],
  vuejs: ['vuejs', 'vue.js', ' vue '],
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
const ENGLISH_SIGNALS = ['english', 'tieng anh', 'global', 'remote', 'australia', 'singapore', 'europe', 'chau au', ' uk ', ' us ']
const EXPERIENCE_PENALTIES = ['5+ years', '4+ years', '3+ years', '5 nam kinh nghiem', '4 nam kinh nghiem', '3 nam kinh nghiem']

function matches(text: string, skill: string): boolean {
  const variants = SYNONYMS[skill] ?? [skill]
  return variants.some((v) => text.includes(v.trim().length < v.length ? v : v.trim()))
}

/**
 * Score how well a posting fits a profile. Pure; runs on server and client.
 * +3 per primary skill, +1 per secondary skill, +2 for junior signals, +2 for
 * English/global signals (when the profile opts in), −3 for 3+ years-of-experience
 * demands.
 */
export function scoreJob(job: JobInput, profile: Profile): number {
  const text = ' ' + removeDiacritics([job.title, job.company, job.salary ?? '', job.location ?? '', (job.skills ?? []).join(' ')].join(' ')) + ' '
  let score = 0
  for (const skill of profile.primaryStack) if (matches(text, removeDiacritics(skill))) score += 3
  for (const skill of profile.secondaryStack) if (matches(text, removeDiacritics(skill))) score += 1
  if (JUNIOR_SIGNALS.some((t) => text.includes(t))) score += 2
  if (profile.prefersEnglish && ENGLISH_SIGNALS.some((t) => text.includes(t))) score += 2
  if (EXPERIENCE_PENALTIES.some((t) => text.includes(t))) score -= 3
  return score
}
