import { describe, expect, it } from 'vitest'
import { defaultStages, guessFields } from './seedDefaults'

describe('defaultStages', () => {
  it('marks only the first stage as the default action queue', () => {
    const stages = defaultStages()
    expect(stages[0]).toEqual({ stage: 'To review', isActionQueue: true })
    expect(stages.slice(1).every((s) => !s.isActionQueue)).toBe(true)
  })
})

describe('guessFields', () => {
  it('assigns the key role to the first email-looking column', () => {
    const fields = guessFields(['Timestamp', 'Email Address', 'Full Name'])
    expect(fields.find((f) => f.role === 'key')?.column).toBe('Email Address')
  })

  it('assigns the name role to the first name-looking column', () => {
    const fields = guessFields(['Timestamp', 'Email Address', 'Full Name'])
    expect(fields.find((f) => f.role === 'name')?.column).toBe('Full Name')
  })

  it('only assigns key and name roles once each', () => {
    const fields = guessFields(['Email Address', 'Backup Email', 'Full Name', 'Preferred Name'])
    expect(fields.filter((f) => f.role === 'key')).toHaveLength(1)
    expect(fields.filter((f) => f.role === 'name')).toHaveLength(1)
  })

  it('leaves unmatched columns with no role, visible, in header order', () => {
    const fields = guessFields(['Timestamp', 'Why do you want this job?'])
    expect(fields).toEqual([
      { column: 'Timestamp', role: '', show: true, order: 0 },
      { column: 'Why do you want this job?', role: '', show: true, order: 1 },
    ])
  })
})
