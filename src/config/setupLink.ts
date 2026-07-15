export interface SetupLinkFields {
  applicationsSheetId: string
  applicationsTabName: string | null
  reviewsSheetId: string
  oauthClientId: string
}

const QUERY_PARAM = 'setup'

/** Base64url-encodes (no padding) so the payload is safe to embed in a URL query value. */
function base64UrlEncode(input: string): string {
  const base64 = btoa(unescape(encodeURIComponent(input)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return decodeURIComponent(escape(atob(padded)))
}

/** Encodes the four Step-1 setup fields as a compact, URL-safe query value. */
export function encodeSetupLink(fields: SetupLinkFields): string {
  return base64UrlEncode(JSON.stringify(fields))
}

/**
 * Builds the full setup URL for a given page origin+path (so it respects
 * whatever base path the app is served from, in dev or on GitHub Pages).
 */
export function buildSetupUrl(baseUrl: string, fields: SetupLinkFields): string {
  const url = new URL(baseUrl)
  url.search = ''
  url.searchParams.set(QUERY_PARAM, encodeSetupLink(fields))
  return url.toString()
}

/**
 * Decodes the setup query param out of a `location.search` string. Returns
 * `null` on anything missing/malformed rather than throwing — same
 * graceful-degradation style as the rest of the config layer.
 */
export function decodeSetupLink(search: string): SetupLinkFields | null {
  const params = new URLSearchParams(search)
  const raw = params.get(QUERY_PARAM)
  if (!raw) return null

  try {
    const decoded: unknown = JSON.parse(base64UrlDecode(raw))
    if (!isSetupLinkFields(decoded)) return null
    return decoded
  } catch {
    return null
  }
}

function isSetupLinkFields(value: unknown): value is SetupLinkFields {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.applicationsSheetId === 'string' &&
    (typeof v.applicationsTabName === 'string' || v.applicationsTabName === null) &&
    typeof v.reviewsSheetId === 'string' &&
    typeof v.oauthClientId === 'string'
  )
}
