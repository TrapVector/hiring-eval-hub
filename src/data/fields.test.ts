import { describe, expect, it } from 'vitest'
import { resolveFields } from './fields'
import type { FieldRow } from '../sheets/types'

function field(overrides: Partial<FieldRow>): FieldRow {
  return { column: 'Column', role: '', show: true, order: null, keyInfo: false, ...overrides }
}

describe('resolveFields', () => {
  it('finds the key and name columns', () => {
    const fields = [field({ column: 'Email', role: 'key' }), field({ column: 'Full Name', role: 'name' })]
    const resolved = resolveFields(fields)
    expect(resolved.keyColumn).toBe('Email')
    expect(resolved.nameColumn).toBe('Full Name')
  })

  it('collects all long-form columns', () => {
    const fields = [
      field({ column: 'Why us?', role: 'long' }),
      field({ column: 'Experience', role: 'long' }),
      field({ column: 'Email', role: 'key' }),
    ]
    expect(resolveFields(fields).longColumns).toEqual(['Why us?', 'Experience'])
  })

  it('sorts visible fields by order, with unset order last', () => {
    const fields = [
      field({ column: 'C', show: true, order: null }),
      field({ column: 'A', show: true, order: 2 }),
      field({ column: 'B', show: true, order: 1 }),
    ]
    expect(resolveFields(fields).visible.map((f) => f.column)).toEqual(['B', 'A', 'C'])
  })

  it('excludes hidden fields from visible', () => {
    const fields = [field({ column: 'Shown', show: true }), field({ column: 'Hidden', show: false })]
    expect(resolveFields(fields).visible.map((f) => f.column)).toEqual(['Shown'])
  })

  it('returns null key/name when unset', () => {
    const resolved = resolveFields([field({ column: 'Other' })])
    expect(resolved.keyColumn).toBeNull()
    expect(resolved.nameColumn).toBeNull()
  })

  it('finds the preferred-name column', () => {
    const fields = [field({ column: 'Full Name', role: 'name' }), field({ column: 'Goes by', role: 'preferredName' })]
    expect(resolveFields(fields).preferredNameColumn).toBe('Goes by')
  })

  it('returns null preferred-name when unset', () => {
    expect(resolveFields([field({ column: 'Other' })]).preferredNameColumn).toBeNull()
  })

  it('collects key-info columns sorted by order, independent of show/role', () => {
    const fields = [
      field({ column: 'Phone', keyInfo: true, order: 2, show: false }),
      field({ column: 'Availability', keyInfo: true, order: 1 }),
      field({ column: 'Why us?', role: 'long', keyInfo: false }),
    ]
    expect(resolveFields(fields).keyInfoColumns.map((f) => f.column)).toEqual(['Availability', 'Phone'])
  })
})
