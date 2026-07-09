import { describe, expect, it } from 'vitest'
import { isConfigComplete } from './isConfigComplete'
import type { AppConfig } from '../store/db'

function config(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    applicationsSheetId: 'apps-id',
    applicationsTabName: null,
    reviewsSheetId: 'reviews-id',
    oauthClientId: 'client-id',
    pollIntervalMinutes: 3,
    ...overrides,
  }
}

describe('isConfigComplete', () => {
  it('is false for null config', () => {
    expect(isConfigComplete(null)).toBe(false)
  })

  it('is true when all required IDs are set', () => {
    expect(isConfigComplete(config())).toBe(true)
  })

  it('is false when a required ID is blank', () => {
    expect(isConfigComplete(config({ oauthClientId: '  ' }))).toBe(false)
  })

  it('does not require the optional applications tab name', () => {
    expect(isConfigComplete(config({ applicationsTabName: null }))).toBe(true)
  })
})
