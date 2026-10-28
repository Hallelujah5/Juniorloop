import { removeDiacritics } from './normalize'

/**
 * CV → draft profile, entirely offline. Dictionary + occurrence counting:
 * explainable like the scorer, order-independent (pdf.js scrambles two-column
 * layouts; counting does not care). The result is a DRAFT the user edits —
 * precision failures cost one chip-delete, so the design optimizes recall
 * (lexicon breadth) and canonical-name alignment with score.ts SYNONYMS.
 */

/**
 * Canonical skill → variant spellings. Rules (from design review):
 * - Canonical names MUST equal score.ts SYNONYMS keys where both exist
 *   (enforced by a unit test) so prefilled profiles score at full strength.
 * - No bare tokens under 3 chars unless unambiguous ('c#', 'c++'); English
 *   words that double as skills only via safe variants (golang, not 'go').
 * - All variants lowercase; matching happens on removeDiacritics output.
 */
export const SKILL_LEXICON: Record<string, string[]> = {
  // languages
  javascript: ['javascript', 'js'],
  typescript: ['typescript', 'ts'],
  python: ['python'],
  java: ['java'],
  'c#': ['c#', 'csharp', 'c sharp'],
  'c++': ['c++', 'cpp'],
  golang: ['golang', 'go lang'],
  ruby: ['ruby'],
  php: ['php', 'laravel'],
  swift: ['swift'],
  kotlin: ['kotlin'],
  dart: ['dart'],
  rust: ['rust'],
  scala: ['scala'],
  // frontend
  react: ['react', 'reactjs', 'react.js'],
  vuejs: ['vuejs', 'vue.js', 'vue'],
  angular: ['angular', 'angularjs'],
  svelte: ['svelte'],
  nextjs: ['nextjs', 'next.js'],
  nuxt: ['nuxt', 'nuxtjs', 'nuxt.js'],
  jquery: ['jquery'],
  tailwind: ['tailwind', 'tailwindcss'],
  bootstrap: ['bootstrap'],
  sass: ['sass', 'scss'],
  redux: ['redux'],
  webpack: ['webpack'],
  vite: ['vite'],
  html: ['html', 'html5'],
  css: ['css', 'css3'],
  // backend
  nodejs: ['nodejs', 'node.js', 'node'],
  nestjs: ['nestjs', 'nest.js'],
  express: ['express', 'expressjs', 'express.js'],
  django: ['django'],
  flask: ['flask'],
  fastapi: ['fastapi'],
  spring: ['spring', 'spring boot', 'springboot'],
  dotnet: ['.net', 'dotnet', 'asp.net', '.net core'],
  rails: ['rails', 'ruby on rails'],
  graphql: ['graphql'],
  grpc: ['grpc'],
  'rest api': ['rest api', 'rest apis', 'restful'],
  // mobile
  'react-native': ['react native', 'react-native'],
  flutter: ['flutter'],
  android: ['android'],
  ios: ['ios'],
  ionic: ['ionic'],
  // game
  unity: ['unity', 'unity3d'],
  unreal: ['unreal', 'unreal engine'],
  godot: ['godot'],
  cocos: ['cocos', 'cocos2d', 'cocos creator'],
  // data
  sql: ['sql'],
  mysql: ['mysql'],
  postgresql: ['postgresql', 'postgres'],
  'sql server': ['sql server', 'mssql'],
  oracle: ['oracle'],
  mongodb: ['mongodb', 'mongo'],
  redis: ['redis'],
  elasticsearch: ['elasticsearch', 'elastic search'],
  kafka: ['kafka'],
  spark: ['spark', 'pyspark'],
  airflow: ['airflow'],
  pandas: ['pandas'],
  numpy: ['numpy'],
  tensorflow: ['tensorflow'],
  pytorch: ['pytorch'],
  'machine learning': ['machine learning', 'deep learning'],
  'power bi': ['power bi', 'powerbi'],
  tableau: ['tableau'],
  // devops / cloud
  docker: ['docker'],
  kubernetes: ['kubernetes', 'k8s'],
  aws: ['aws', 'amazon web services', 'lambda', 'dynamodb'],
  azure: ['azure'],
  gcp: ['gcp', 'google cloud'],
  terraform: ['terraform'],
  ansible: ['ansible'],
  jenkins: ['jenkins'],
  'github actions': ['github actions'],
  nginx: ['nginx'],
  linux: ['linux'],
  bash: ['bash', 'shell script', 'shell scripting'],
  git: ['git'],
  'ci/cd': ['ci/cd', 'cicd'],
  // testing
  selenium: ['selenium'],
  playwright: ['playwright'],
  cypress: ['cypress'],
  jest: ['jest'],
  vitest: ['vitest'],
  junit: ['junit'],
  appium: ['appium'],
  postman: ['postman'],
  'automation test': ['automation test', 'automation testing', 'test automation'],
  // misc
  firebase: ['firebase'],
  supabase: ['supabase'],
  prisma: ['prisma'],
  kysely: ['kysely'],
  sequelize: ['sequelize'],
  typeorm: ['typeorm'],
  figma: ['figma'],
}

export type ExtractedProfile = {
  primaryStack: string[]
  secondaryStack: string[]
  /** null = no confident inference (short text, Latin-minority CV) — keep the current value. */
  prefersEnglish: boolean | null
  matchCounts: Record<string, number>
}

const MAX_INPUT = 200_000 // real CVs are < 50 KB of text; cap hostile pastes
const LONG_TEXT = 1500
const PRIMARY_MAX = 6
const SECONDARY_MAX = 10

const ESCAPE = /[.*+?^${}()|[\]\\]/g

/**
 * Occurrence counting with the same alphanumeric boundaries as score.ts's
 * hasToken — but deliberately NOT sharing its cache: that cache holds
 * non-global regexes, and reusing them with /g would be a stateful
 * lastIndex bug. Fresh global regex per call; also reports first position
 * for tie-breaking.
 */
function countToken(text: string, phrase: string): { count: number; first: number } {
  const re = new RegExp(`(?<![a-z0-9])${phrase.replace(ESCAPE, '\\$&')}(?![a-z0-9])`, 'g')
  let count = 0
  let first = Infinity
  for (const m of text.matchAll(re)) {
    count += 1
    if (m.index !== undefined && m.index < first) first = m.index
  }
  return { count, first }
}

/**
 * CV language detection via combining-mark density. NFD-normalizing makes the
 * counter agnostic to how the PDF extractor composed its Vietnamese; đ/Đ has
 * no decomposition so it is counted alongside the marks. Returns null (no
 * inference) under 200 Latin letters or when Latin is a minority (CJK CVs).
 */
export function detectEnglishCv(text: string): boolean | null {
  const nfd = text.normalize('NFD')
  const marks = (nfd.match(/[̀-ͯ]/g)?.length ?? 0) + (nfd.match(/[đĐ]/g)?.length ?? 0)
  const latin = nfd.match(/[a-zA-Z]/g)?.length ?? 0
  const allLetters = nfd.match(/\p{L}/gu)?.length ?? 0
  if (latin < 200) return null
  if (latin < allLetters * 0.5) return null
  return marks / latin < 0.02
}

/** Turn raw CV text into a draft Profile. Pure, isomorphic, order-independent. */
export function extractProfile(rawText: string): ExtractedProfile {
  const sliced = rawText.slice(0, MAX_INPUT)
  const text = ' ' + removeDiacritics(sliced) + ' '

  const counts: Record<string, number> = {}
  const firstAt: Record<string, number> = {}
  for (const [canonical, variants] of Object.entries(SKILL_LEXICON)) {
    let total = 0
    let first = Infinity
    for (const v of variants) {
      const r = countToken(text, v)
      total += r.count
      if (r.first < first) first = r.first
    }
    if (total > 0) {
      counts[canonical] = total
      firstAt[canonical] = first
    }
  }

  const matched = Object.keys(counts).sort(
    (a, b) => counts[b]! - counts[a]! || firstAt[a]! - firstAt[b]!,
  )

  // Long texts need count ≥2 for primary: a one-line "Skills: a, b, c, …"
  // inside a long CV must not promote six coin-flips to +3 primaries.
  const longText = text.length > LONG_TEXT
  let primary = (longText ? matched.filter((s) => counts[s]! >= 2) : matched).slice(0, PRIMARY_MAX)
  if (longText && primary.length < 2) primary = matched.slice(0, PRIMARY_MAX)

  const inPrimary = new Set(primary)
  const secondary = matched.filter((s) => !inPrimary.has(s)).slice(0, SECONDARY_MAX)

  return {
    primaryStack: primary,
    secondaryStack: secondary,
    prefersEnglish: detectEnglishCv(sliced),
    matchCounts: counts,
  }
}
