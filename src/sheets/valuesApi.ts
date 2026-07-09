import { sheetsRequest } from './httpClient'
import type { SheetRow, SheetsAuth } from './types'

interface ValuesResponse {
  values?: SheetRow[]
}

interface BatchGetResponse {
  valueRanges?: { range: string; values?: SheetRow[] }[]
}

interface SpreadsheetMetaResponse {
  sheets?: { properties?: { title?: string } }[]
}

export async function getValues(spreadsheetId: string, range: string, auth: SheetsAuth): Promise<SheetRow[]> {
  const data = await sheetsRequest<ValuesResponse>(
    `${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
    auth,
  )
  return data.values ?? []
}

export async function batchGetValues(
  spreadsheetId: string,
  ranges: string[],
  auth: SheetsAuth,
): Promise<Record<string, SheetRow[]>> {
  const query = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&')
  const data = await sheetsRequest<BatchGetResponse>(
    `${encodeURIComponent(spreadsheetId)}/values:batchGet?${query}`,
    auth,
  )
  const result: Record<string, SheetRow[]> = {}
  for (const vr of data.valueRanges ?? []) {
    result[vr.range] = vr.values ?? []
  }
  return result
}

export async function updateValues(
  spreadsheetId: string,
  range: string,
  values: SheetRow[],
  auth: SheetsAuth,
): Promise<void> {
  await sheetsRequest(
    `${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    auth,
    { method: 'PUT', body: { range, values } },
  )
}

export async function appendValues(
  spreadsheetId: string,
  range: string,
  values: SheetRow[],
  auth: SheetsAuth,
): Promise<void> {
  await sheetsRequest(
    `${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    auth,
    { method: 'POST', body: { range, values } },
  )
}

export async function getSpreadsheetTabs(spreadsheetId: string, auth: SheetsAuth): Promise<string[]> {
  const data = await sheetsRequest<SpreadsheetMetaResponse>(
    `${encodeURIComponent(spreadsheetId)}?fields=sheets.properties.title`,
    auth,
  )
  return (data.sheets ?? [])
    .map((s) => s.properties?.title)
    .filter((title): title is string => Boolean(title))
}

export async function addSheetTabs(spreadsheetId: string, titles: string[], auth: SheetsAuth): Promise<void> {
  if (titles.length === 0) return
  const requests = titles.map((title) => ({ addSheet: { properties: { title } } }))
  await sheetsRequest(`${encodeURIComponent(spreadsheetId)}:batchUpdate`, auth, {
    method: 'POST',
    body: { requests },
  })
}
