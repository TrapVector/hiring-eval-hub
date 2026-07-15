import { describe, expect, it } from 'vitest'
import { buildSetupUrl, decodeSetupLink, encodeSetupLink } from './setupLink'
import type { SetupLinkFields } from './setupLink'

function fields(overrides: Partial<SetupLinkFields> = {}): SetupLinkFields {
  return {
    applicationsSheetId: 'apps-sheet-placeholder',
    applicationsTabName: null,
    reviewsSheetId: 'reviews-sheet-placeholder',
    oauthClientId: 'placeholder-client-id.apps.googleusercontent.com',
    ...overrides,
  }
}

describe('encodeSetupLink / decodeSetupLink', () => {
  it('round-trips all fields', () => {
    const original = fields({ applicationsTabName: 'Form Responses 1' })
    const encoded = encodeSetupLink(original)
    expect(decodeSetupLink(`?setup=${encoded}`)).toEqual(original)
  })

  it('preserves a null tab name through the round trip', () => {
    const original = fields({ applicationsTabName: null })
    const encoded = encodeSetupLink(original)
    expect(decodeSetupLink(`?setup=${encoded}`)?.applicationsTabName).toBeNull()
  })

  it('is safe to embed directly in a URL query value', () => {
    const encoded = encodeSetupLink(fields())
    expect(encoded).not.toMatch(/[+/=]/)
  })
})

describe('decodeSetupLink', () => {
  it('returns null when the query param is missing', () => {
    expect(decodeSetupLink('?other=1')).toBeNull()
  })

  it('returns null for an empty search string', () => {
    expect(decodeSetupLink('')).toBeNull()
  })

  it('returns null for malformed base64', () => {
    expect(decodeSetupLink('?setup=%%%not-base64%%%')).toBeNull()
  })

  it('returns null when required fields are missing', () => {
    const encoded = encodeSetupLink({ ...fields(), applicationsSheetId: '' })
    // still valid shape (empty string is a string) - now try genuinely malformed shape
    expect(decodeSetupLink(`?setup=${encoded}`)).not.toBeNull()
    const badPayload = btoa(JSON.stringify({ oauthClientId: 'only-one-field' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(decodeSetupLink(`?setup=${badPayload}`)).toBeNull()
  })
})

describe('buildSetupUrl', () => {
  it('preserves the base origin and path, replacing any existing query', () => {
    const url = buildSetupUrl('https://example.github.io/hiring-eval-hub/?stale=1', fields())
    expect(url.startsWith('https://example.github.io/hiring-eval-hub/?setup=')).toBe(true)
    expect(url).not.toContain('stale')
  })

  it('produces a URL that decodes back to the same fields', () => {
    const original = fields({ applicationsTabName: 'Sheet1' })
    const url = buildSetupUrl('http://localhost:5173/', original)
    const search = url.slice(url.indexOf('?'))
    expect(decodeSetupLink(search)).toEqual(original)
  })
})
