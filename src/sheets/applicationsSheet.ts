import { parseSheetRows } from './columns'
import { getSpreadsheetTabs, getValues } from './valuesApi'
import type { ApplicationRow, SheetsAuth } from './types'

/**
 * Read-only access to the Applications sheet. This module has no write
 * functions — the Applications sheet must never be modified (CLAUDE.md §4).
 */

export async function resolveApplicationsTabName(
  spreadsheetId: string,
  configuredTabName: string | undefined,
  auth: SheetsAuth,
): Promise<string> {
  if (configuredTabName) return configuredTabName
  const tabs = await getSpreadsheetTabs(spreadsheetId, auth)
  const first = tabs[0]
  if (!first) {
    throw new Error('Applications spreadsheet has no tabs')
  }
  return first
}

export async function readApplications(
  spreadsheetId: string,
  tabName: string,
  auth: SheetsAuth,
): Promise<{ header: string[]; rows: ApplicationRow[] }> {
  const values = await getValues(spreadsheetId, tabName, auth)
  const { header, rows } = parseSheetRows(values)
  return {
    header,
    rows: rows.map((rowValues, i) => ({ rowIndex: i, values: rowValues })),
  }
}
