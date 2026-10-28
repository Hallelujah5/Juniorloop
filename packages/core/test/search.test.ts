import { describe, expect, it } from 'vitest'
import { jobMatchesQuery } from '../src/search'

const job = {
  title: 'Lập Trình Viên Fullstack (ReactJS, NestJS)',
  company: 'Công ty TNHH SETA International',
  skills: ['ReactJS', 'PostgreSql'],
}

describe('jobMatchesQuery', () => {
  it('ignores diacritics on both sides', () => {
    expect(jobMatchesQuery(job, 'lập trình')).toBe(true)
    expect(jobMatchesQuery(job, 'lap trinh')).toBe(true)
    expect(jobMatchesQuery(job, 'LẬP TRÌNH VIÊN')).toBe(true)
  })
  it('expands the scorer synonym clusters', () => {
    expect(jobMatchesQuery(job, 'React.js')).toBe(true)
    expect(jobMatchesQuery(job, 'react')).toBe(true)
    expect(jobMatchesQuery(job, 'postgres')).toBe(true)
    expect(jobMatchesQuery(job, 'nest.js')).toBe(true)
  })
  it('requires every term, as substrings', () => {
    expect(jobMatchesQuery(job, 'seta fullstack')).toBe(true)
    expect(jobMatchesQuery(job, 'seta django')).toBe(false)
    expect(jobMatchesQuery(job, 'inter')).toBe(true)
  })
  it('matches everything on an empty query', () => {
    expect(jobMatchesQuery(job, '   ')).toBe(true)
  })
})
