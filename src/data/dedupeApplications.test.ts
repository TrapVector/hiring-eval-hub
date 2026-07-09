import { describe, expect, it } from 'vitest'
import { dedupeApplications, findTimestampColumn } from './dedupeApplications'
import type { ApplicationRow } from '../sheets/types'

function row(rowIndex: number, values: Record<string, string>): ApplicationRow {
  return { rowIndex, values }
}

describe('findTimestampColumn', () => {
  it('finds a Timestamp header case-insensitively', () => {
    expect(findTimestampColumn(['timestamp', 'Email'])).toBe('timestamp')
    expect(findTimestampColumn(['Timestamp', 'Email'])).toBe('Timestamp')
  })

  it('returns null when there is no Timestamp column', () => {
    expect(findTimestampColumn(['Email', 'Name'])).toBeNull()
  })
})

describe('dedupeApplications', () => {
  it('keeps the row with the latest timestamp per email', () => {
    const rows = [
      row(0, { Email: 'a@example.com', Timestamp: '2026-01-01T00:00:00Z' }),
      row(1, { Email: 'a@example.com', Timestamp: '2026-02-01T00:00:00Z' }),
    ]
    const result = dedupeApplications(rows, 'Email', 'Timestamp')
    expect(result).toHaveLength(1)
    expect(result[0]?.rowIndex).toBe(1)
  })

  it('falls back to row order when timestamps tie or are missing', () => {
    const rows = [row(0, { Email: 'a@example.com' }), row(3, { Email: 'a@example.com' })]
    const result = dedupeApplications(rows, 'Email', null)
    expect(result[0]?.rowIndex).toBe(3)
  })

  it('normalizes email case and whitespace for grouping', () => {
    const rows = [row(0, { Email: '  A@Example.com ' }), row(1, { Email: 'a@example.com' })]
    const result = dedupeApplications(rows, 'Email', null)
    expect(result).toHaveLength(1)
  })

  it('drops rows with no email', () => {
    const rows = [row(0, { Email: '' }), row(1, { Email: 'a@example.com' })]
    const result = dedupeApplications(rows, 'Email', null)
    expect(result).toHaveLength(1)
  })

  it('keeps distinct emails separate', () => {
    const rows = [row(0, { Email: 'a@example.com' }), row(1, { Email: 'b@example.com' })]
    expect(dedupeApplications(rows, 'Email', null)).toHaveLength(2)
  })
})
