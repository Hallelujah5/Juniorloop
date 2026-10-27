import { jobMatchesSkill, removeDiacritics, type JobInput } from '@juniorloop/core'
import type { JobRow } from './data'

export const CITIES = [
  { slug: 'ha-noi', name: 'Hanoi', tokens: ['ha noi', 'hanoi'] },
  { slug: 'ho-chi-minh', name: 'Ho Chi Minh City', tokens: ['ho chi minh', 'hcm', 'sai gon'] },
  { slug: 'da-nang', name: 'Da Nang', tokens: ['da nang', 'danang'] },
  { slug: 'remote', name: 'Remote', tokens: ['remote'] },
] as const

export type CitySlug = (typeof CITIES)[number]['slug']

const PRETTY: Record<string, string> = {
  nodejs: 'Node.js', reactjs: 'ReactJS', typescript: 'TypeScript', fullstack: 'Fullstack',
  'react-native': 'React Native', ios: 'iOS', android: 'Android', flutter: 'Flutter',
  unity: 'Unity', unreal: 'Unreal', game: 'Game', python: 'Python', sql: 'SQL',
  'data-engineer': 'Data Engineer', qa: 'QA', tester: 'Tester',
  'automation-test': 'Automation Test', devops: 'DevOps', kubernetes: 'Kubernetes', cloud: 'Cloud',
}

export function prettySkill(slug: string): string {
  return PRETTY[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1)
}

export function toJobInput(j: JobRow): JobInput {
  return { title: j.title, company: j.company, salary: j.salary, location: j.location, skills: j.skills }
}

export function jobsForSkill(jobs: JobRow[], skill: string): JobRow[] {
  return jobs.filter((j) => jobMatchesSkill(toJobInput(j), skill))
}

/** Remote counts as a "city": matched from the title as well as the location. */
export function jobInCity(j: JobRow, slug: CitySlug): boolean {
  const city = CITIES.find((c) => c.slug === slug)
  if (!city) return false
  const text = removeDiacritics(`${j.location ?? ''} ${slug === 'remote' ? j.title : ''}`)
  return city.tokens.some((t) => text.includes(t))
}

export type SkillStats = {
  total: number
  seniorHidden: number
  newThisWeek: number
  salaryPct: number
  bySource: Record<string, number>
}

export function skillStats(juniors: JobRow[], seniorHidden: number): SkillStats {
  const now = Date.now()
  const newThisWeek = juniors.filter((j) => now - new Date(j.firstSeen).getTime() < 7 * 864e5).length
  const withSalary = juniors.filter((j) => j.salary).length
  const bySource: Record<string, number> = {}
  for (const j of juniors) bySource[j.source] = (bySource[j.source] ?? 0) + 1
  return {
    total: juniors.length,
    seniorHidden,
    newThisWeek,
    salaryPct: juniors.length ? Math.round((100 * withSalary) / juniors.length) : 0,
    bySource,
  }
}
