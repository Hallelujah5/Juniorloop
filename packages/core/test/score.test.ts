import { describe, expect, it } from 'vitest'

import { jobMatchesSkill, scoreJob } from '../src/score'
import { DEFAULT_PROFILE } from '../src/types'

describe('junior signals', () => {
  const profile = { primaryStack: [], secondaryStack: [], prefersEnglish: false }
  it('reads Vietnamese intern / fresh-graduate wording', () => {
    expect(scoreJob({ title: 'Thực Tập Sinh Unity', company: 'x' }, profile)).toBe(2)
    expect(scoreJob({ title: 'Unity Developer (Mới tốt nghiệp)', company: 'x' }, profile)).toBe(2)
    expect(scoreJob({ title: 'Unity Developer', company: 'x' }, profile)).toBe(0)
  })
})

const matchingJob = {
  title: 'Junior Fullstack Developer (ReactJS, NestJS, PostgreSQL)',
  company: 'SETA International',
  salary: '15-20 triệu',
  location: 'Hà Nội',
  skills: ['ReactJS', 'NestJS', 'PostgreSQL', 'English'],
}

const mismatchedJob = {
  title: 'Embedded Engineer (C/C++) 5+ years',
  company: 'ABC Corp',
  salary: null,
  location: 'Hà Nội',
  skills: ['C++', 'RTOS'],
}

describe('scoreJob', () => {
  it('scores stack + junior + English matches high', () => {
    expect(scoreJob(matchingJob, DEFAULT_PROFILE)).toBeGreaterThanOrEqual(10)
  })
  it('scores off-stack 5+-years postings low', () => {
    expect(scoreJob(mismatchedJob, DEFAULT_PROFILE)).toBeLessThan(3)
  })
  it('turning off the English preference drops the score by exactly 2', () => {
    const withPref = scoreJob(matchingJob, DEFAULT_PROFILE)
    const withoutPref = scoreJob(matchingJob, { ...DEFAULT_PROFILE, prefersEnglish: false })
    expect(withPref - withoutPref).toBe(2)
  })
  it('synonyms: a profile saying "react" still matches a posting saying "ReactJS"', () => {
    const profile = { primaryStack: ['react'], secondaryStack: [], prefersEnglish: false }
    expect(scoreJob({ title: 'ReactJS Developer', company: 'X' }, profile)).toBeGreaterThanOrEqual(3)
  })
  it('word boundaries: "unity" never matches "opportunity"/"community"', () => {
    const profile = { primaryStack: ['unity'], secondaryStack: [], prefersEnglish: false }
    expect(scoreJob({ title: 'Community Manager — great opportunity', company: 'X' }, profile)).toBe(0)
    expect(scoreJob({ title: 'Unity Game Developer', company: 'X' }, profile)).toBeGreaterThanOrEqual(3)
  })
  it('word boundaries: "java" never matches "javascript"', () => {
    const profile = { primaryStack: ['java'], secondaryStack: [], prefersEnglish: false }
    expect(scoreJob({ title: 'Javascript Developer', company: 'X' }, profile)).toBe(0)
  })
  it('word boundaries: "intern" never matches "International"', () => {
    const profile = { primaryStack: [], secondaryStack: [], prefersEnglish: false }
    expect(scoreJob({ title: 'Backend Developer', company: 'SETA International' }, profile)).toBe(0)
  })
})

describe('jobMatchesSkill', () => {
  it('matches synonyms and dashed slugs', () => {
    expect(jobMatchesSkill({ title: 'Node.js Developer', company: 'X' }, 'nodejs')).toBe(true)
    expect(jobMatchesSkill({ title: 'React Native Developer', company: 'X' }, 'react-native')).toBe(true)
    expect(jobMatchesSkill({ title: 'ReactJS Developer', company: 'X' }, 'react-native')).toBe(false)
  })
  it('keeps word boundaries', () => {
    expect(jobMatchesSkill({ title: 'Community Manager', company: 'X' }, 'unity')).toBe(false)
  })
})
