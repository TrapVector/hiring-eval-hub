import { describe, expect, it } from 'vitest'
import { mergeApplicants } from './mergeApplicants'
import type { ReviewsRecord } from '../sheets/reviewsSheet'
import type { ApplicationRow } from '../sheets/types'

function app(email: string, extra: Record<string, string> = {}): ApplicationRow {
  return { rowIndex: 0, values: { Email: email, ...extra } }
}

function review(overrides: Partial<ReviewsRecord>): ReviewsRecord {
  return {
    email: 'a@example.com',
    stage: 'Reviewing',
    offeredPosition: '',
    note: '',
    updatedAt: '2026-01-01T00:00:00Z',
    sheetRow: 2,
    ...overrides,
  }
}

describe('mergeApplicants', () => {
  it('uses the matching Reviews row when one exists', () => {
    const result = mergeApplicants(
      [app('a@example.com')],
      'Email',
      [review({ email: 'a@example.com', stage: 'Shortlisted' })],
      'To review',
    )
    expect(result).toEqual([
      {
        email: 'a@example.com',
        applicationValues: { Email: 'a@example.com' },
        stage: 'Shortlisted',
        offeredPosition: '',
        note: '',
        updatedAt: '2026-01-01T00:00:00Z',
        hasReviewRow: true,
      },
    ])
  })

  it('synthesizes a default-stage record when there is no Reviews row', () => {
    const result = mergeApplicants([app('new@example.com')], 'Email', [], 'To review')
    expect(result).toEqual([
      {
        email: 'new@example.com',
        applicationValues: { Email: 'new@example.com' },
        stage: 'To review',
        offeredPosition: '',
        note: '',
        updatedAt: '',
        hasReviewRow: false,
      },
    ])
  })

  it('joins on lowercased/trimmed email', () => {
    const result = mergeApplicants(
      [app('  A@Example.com ')],
      'Email',
      [review({ email: 'a@example.com', stage: 'Offer' })],
      'To review',
    )
    expect(result[0]?.stage).toBe('Offer')
  })

  it('skips application rows with no email', () => {
    const result = mergeApplicants([app('')], 'Email', [], 'To review')
    expect(result).toEqual([])
  })
})
