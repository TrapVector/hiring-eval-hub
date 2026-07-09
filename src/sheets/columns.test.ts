import { describe, expect, it } from 'vitest'
import { buildRow, columnLetter, findColumnIndex, parseSheetRows } from './columns'

describe('parseSheetRows', () => {
  it('keys rows by header text', () => {
    const { header, rows } = parseSheetRows([
      ['email', 'stage'],
      ['a@example.com', 'To review'],
    ])
    expect(header).toEqual(['email', 'stage'])
    expect(rows).toEqual([{ email: 'a@example.com', stage: 'To review' }])
  })

  it('tolerates short rows (missing trailing cells)', () => {
    const { rows } = parseSheetRows([
      ['email', 'stage', 'note'],
      ['a@example.com'],
    ])
    expect(rows).toEqual([{ email: 'a@example.com', stage: '', note: '' }])
  })

  it('returns nothing for an empty sheet', () => {
    expect(parseSheetRows([])).toEqual({ header: [], rows: [] })
  })
})

describe('buildRow', () => {
  it('orders values by header position', () => {
    expect(buildRow(['stage', 'email'], { email: 'a@example.com', stage: 'Offer' })).toEqual([
      'Offer',
      'a@example.com',
    ])
  })

  it('fills missing values with empty string', () => {
    expect(buildRow(['email', 'note'], { email: 'a@example.com' })).toEqual(['a@example.com', ''])
  })
})

describe('findColumnIndex', () => {
  it('finds an existing column', () => {
    expect(findColumnIndex(['email', 'stage'], 'stage')).toBe(1)
  })

  it('returns -1 for a missing column', () => {
    expect(findColumnIndex(['email', 'stage'], 'note')).toBe(-1)
  })
})

describe('columnLetter', () => {
  it('handles single letters', () => {
    expect(columnLetter(0)).toBe('A')
    expect(columnLetter(25)).toBe('Z')
  })

  it('handles double letters', () => {
    expect(columnLetter(26)).toBe('AA')
    expect(columnLetter(27)).toBe('AB')
    expect(columnLetter(51)).toBe('AZ')
  })
})
