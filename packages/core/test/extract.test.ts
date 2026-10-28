import { describe, expect, it } from 'vitest'
import { detectEnglishCv, extractProfile, SKILL_LEXICON } from '../src/extract'
import { SYNONYMS } from '../src/score'

// Synthetic fixtures only — never a real person's CV.
const EN_WEB_CV = `
John Doe — Fullstack Developer
Hanoi, Vietnam | john@example.com

EXPERIENCE
Acme Corp — built a college portal with React, TypeScript and NestJS on
PostgreSQL. Wrote React components daily; tuned PostgreSQL queries; deployed
with Docker to AWS. Migrated legacy PHP endpoints to NestJS and TypeScript.
Shipped a React admin panel. TypeScript everywhere, tested with Vitest and
Playwright. PostgreSQL migrations via Kysely. Docker Compose for local dev.

SKILLS
React, TypeScript, NestJS, PostgreSQL, Docker, AWS, MongoDB, Redis, Git
`.repeat(1)

const VN_GAME_CV = `
Nguyễn Văn An — Lập trình viên game
Hà Nội | an@example.com

KINH NGHIỆM
Công ty Game ABC — phát triển game mobile bằng Unity và C#. Tối ưu hiệu năng
Unity, viết gameplay C#, tích hợp Firebase analytics. Làm việc nhóm với Git.
Dự án cá nhân: game puzzle Unity, backend Firebase, một chút Flutter.
Trách nhiệm chính là xây dựng tính năng gameplay bằng Unity và C# hằng ngày,
phối hợp cùng đội ngũ thiết kế để hoàn thiện trải nghiệm người chơi, đồng thời
theo dõi số liệu người dùng và cải thiện độ ổn định của trò chơi trên di động.
`

describe('SKILL_LEXICON alignment with score.ts SYNONYMS', () => {
  it('every SYNONYMS key exists with at least the same variants', () => {
    for (const [key, variants] of Object.entries(SYNONYMS)) {
      expect(SKILL_LEXICON[key], `lexicon missing canonical "${key}"`).toBeDefined()
      for (const v of variants) {
        expect(SKILL_LEXICON[key], `lexicon["${key}"] missing variant "${v}"`).toContain(v)
      }
    }
  })
  it('has no bare tokens under 2 characters', () => {
    for (const variants of Object.values(SKILL_LEXICON)) {
      for (const v of variants) expect(v.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('extractProfile — ranking', () => {
  it('promotes repeated skills to primary on a long English CV', () => {
    const p = extractProfile(EN_WEB_CV)
    expect(p.primaryStack).toContain('react')
    expect(p.primaryStack).toContain('typescript')
    expect(p.primaryStack).toContain('postgresql')
    expect(p.primaryStack.length).toBeLessThanOrEqual(6)
    // once-mentioned list skills stay secondary
    expect(p.secondaryStack).toContain('mongodb')
    expect(p.prefersEnglish).toBe(true)
  })
  it('works on a Vietnamese game CV and detects Vietnamese', () => {
    const p = extractProfile(VN_GAME_CV)
    expect(p.primaryStack).toContain('unity')
    expect(p.primaryStack).toContain('c#')
    expect(p.prefersEnglish).toBe(false)
  })
  it('is order-independent (scrambled two-column simulation)', () => {
    const scrambled = EN_WEB_CV.split(/\s+/).reverse().join(' ')
    const a = extractProfile(EN_WEB_CV)
    const b = extractProfile(scrambled)
    expect(new Set(b.primaryStack)).toEqual(new Set(a.primaryStack))
  })
  it('short skills-list-only text falls back to top-by-count', () => {
    const p = extractProfile('Skills: unity, c#, blender, git')
    expect(p.primaryStack).toContain('unity')
    expect(p.primaryStack).toContain('c#')
    expect(p.prefersEnglish).toBe(null) // under 200 Latin letters: no inference
  })
  it('returns empty arrays on junk', () => {
    const p = extractProfile('lorem ipsum dolor sit amet consectetur adipiscing elit')
    expect(p.primaryStack).toEqual([])
    expect(p.secondaryStack).toEqual([])
  })
})

describe('extractProfile — boundary traps', () => {
  it('java does not count javascript; js maps to javascript', () => {
    const p = extractProfile('JavaScript developer. js everywhere. '.repeat(3))
    expect(p.matchCounts.javascript).toBeGreaterThanOrEqual(6)
    expect(p.matchCounts.java).toBeUndefined()
  })
  it('c# and c++ match; lone c never matches', () => {
    const p = extractProfile('C# backend and C++ tooling, grade C average, plain C notes')
    expect(p.matchCounts['c#']).toBe(1)
    expect(p.matchCounts['c++']).toBe(1)
  })
  it('.net family: asp.net and bare .net both count toward dotnet', () => {
    const p = extractProfile('ASP.NET services and .NET Core workers')
    expect(p.matchCounts.dotnet).toBeGreaterThanOrEqual(2)
  })
  it('golang matches, the verb go does not', () => {
    const p = extractProfile('We go fast. golang microservices. go to market.')
    expect(p.matchCounts.golang).toBe(1)
  })
  it('next.js and nextjs both count', () => {
    const p = extractProfile('Built with Next.js, deployed a nextjs app')
    expect(p.matchCounts.nextjs).toBe(2)
  })
  it('NFD-decomposed Vietnamese input still matches and detects language', () => {
    const nfd = VN_GAME_CV.normalize('NFD')
    const p = extractProfile(nfd)
    expect(p.primaryStack).toContain('unity')
    expect(p.prefersEnglish).toBe(false)
  })
})

describe('detectEnglishCv', () => {
  it('null under 200 Latin letters', () => {
    expect(detectEnglishCv('short text')).toBe(null)
  })
  it('English CV with a Vietnamese name/address still reads English', () => {
    const text = `${'Experienced software engineer building web platforms. '.repeat(8)}
      Nguyễn Văn Minh, Hà Nội`
    expect(detectEnglishCv(text)).toBe(true)
  })
  it('null when Latin is a minority (CJK CV)', () => {
    const cjk = '履歴書'.repeat(300) + ' python developer tokyo office '.repeat(10)
    expect(detectEnglishCv(cjk)).toBe(null)
  })
})

describe('performance smoke', () => {
  it('handles a 200 KB paste quickly', () => {
    const big = EN_WEB_CV.repeat(400) // ~250 KB, sliced to 200 KB internally
    const t0 = performance.now()
    const p = extractProfile(big)
    const ms = performance.now() - t0
    expect(p.primaryStack.length).toBeGreaterThan(0)
    expect(ms).toBeLessThan(2000)
  })
})
