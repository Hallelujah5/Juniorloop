/** A job posting in the minimal shape that both ingest and web understand. */
export type JobInput = {
  title: string
  company: string
  salary?: string | null
  location?: string | null
  skills?: string[] | null
}

/** The user's scoring profile — stored in localStorage client-side, no PII. */
export type Profile = {
  /** Primary stack: +3 points per matching skill. */
  primaryStack: string[]
  /** Secondary technologies: +1 point per matching skill. */
  secondaryStack: string[]
  /** Boost postings that signal English / global / remote environments. */
  prefersEnglish: boolean
}

export const DEFAULT_PROFILE: Profile = {
  primaryStack: ['typescript', 'react', 'nodejs', 'nestjs', 'postgresql'],
  secondaryStack: ['nextjs', 'vuejs', 'django', 'php', 'mongodb', 'redis', 'aws', 'docker'],
  prefersEnglish: true,
}
