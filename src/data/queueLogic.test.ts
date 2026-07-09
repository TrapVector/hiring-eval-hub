import { describe, expect, it } from 'vitest'
import { applyQueuePrecedence, coalesceQueue } from './queueLogic'
import type { ApplicantRecord, QueuedEdit } from './types'

function edit(overrides: Partial<QueuedEdit>): QueuedEdit {
  return { email: 'a@example.com', changes: {}, ts: 0, ...overrides }
}

function applicant(overrides: Partial<ApplicantRecord>): ApplicantRecord {
  return {
    email: 'a@example.com',
    applicationValues: {},
    stage: 'To review',
    offeredPosition: '',
    note: '',
    updatedAt: '',
    hasReviewRow: false,
    ...overrides,
  }
}

describe('coalesceQueue', () => {
  it('merges multiple edits for the same email into one', () => {
    const result = coalesceQueue([
      edit({ changes: { note: 'first look' }, ts: 1 }),
      edit({ changes: { stage: 'Shortlisted' }, ts: 2 }),
    ])
    expect(result).toEqual([{ email: 'a@example.com', changes: { note: 'first look', stage: 'Shortlisted' }, ts: 2 }])
  })

  it('lets a later edit overwrite the same field', () => {
    const result = coalesceQueue([
      edit({ changes: { note: 'draft' }, ts: 1 }),
      edit({ changes: { note: 'final' }, ts: 2 }),
    ])
    expect(result[0]?.changes.note).toBe('final')
  })

  it('keeps distinct emails as separate entries', () => {
    const result = coalesceQueue([edit({ email: 'a@example.com' }), edit({ email: 'b@example.com' })])
    expect(result).toHaveLength(2)
  })

  it('is idempotent on an already-coalesced queue', () => {
    const once = coalesceQueue([edit({ changes: { stage: 'Offer' }, ts: 5 })])
    expect(coalesceQueue(once)).toEqual(once)
  })
})

describe('applyQueuePrecedence', () => {
  it('overlays a pending edit onto the polled record', () => {
    const result = applyQueuePrecedence(
      [applicant({ stage: 'To review' })],
      [edit({ changes: { stage: 'Shortlisted' } })],
    )
    expect(result[0]?.stage).toBe('Shortlisted')
  })

  it('leaves records with no pending edit untouched', () => {
    const record = applicant({ stage: 'To review' })
    expect(applyQueuePrecedence([record], [])).toEqual([record])
  })

  it('only overrides the fields present in the pending edit', () => {
    const result = applyQueuePrecedence(
      [applicant({ stage: 'To review', note: 'polled note' })],
      [edit({ changes: { stage: 'Shortlisted' } })],
    )
    expect(result[0]?.note).toBe('polled note')
  })
})
