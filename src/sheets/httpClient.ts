import { SheetsApiError } from './errors'
import type { SheetsAuth } from './types'

const API_ROOT = 'https://sheets.googleapis.com/v4/spreadsheets'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT'
  body?: unknown
}

/**
 * Thin fetch wrapper for the Sheets REST API. Attaches the bearer token,
 * and on a 401 asks `auth` to reconnect and retries exactly once, per
 * CLAUDE.md §8.5 (the app must recover from a lapsed token gracefully).
 */
export async function sheetsRequest<T>(
  path: string,
  auth: SheetsAuth,
  options: RequestOptions = {},
): Promise<T> {
  const token = await auth.getAccessToken()
  let res = await fetchSheets(path, token, options)
  if (res.status === 401) {
    const freshToken = await auth.reconnect()
    res = await fetchSheets(path, freshToken, options)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new SheetsApiError(
      res.status,
      `Sheets API ${options.method ?? 'GET'} ${path} failed: ${res.status} ${body}`,
    )
  }
  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}

function fetchSheets(path: string, token: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  return fetch(`${API_ROOT}/${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
}
