import { buildRow, columnLetter, parseSheetRows } from './columns'
import { addSheetTabs, appendValues, getSpreadsheetTabs, getValues, updateValues } from './valuesApi'
import type { FieldRole, FieldRow, PositionRow, ReviewsRow, SheetsAuth, StageRow } from './types'

export const REVIEWS_TAB = 'Reviews'
export const STAGES_TAB = 'Stages'
export const POSITIONS_TAB = 'Positions'
export const FIELDS_TAB = 'Fields'

export const REVIEWS_HEADER = ['email', 'stage', 'offeredPosition', 'note', 'updatedAt']
export const STAGES_HEADER = ['stage', 'isActionQueue']
export const POSITIONS_HEADER = ['position']
export const FIELDS_HEADER = ['column', 'role', 'show', 'order', 'keyInfo']

export interface ReviewsRecord extends ReviewsRow {
  /** 1-based row number in the sheet (including the header row), for targeted updates. */
  sheetRow: number
}

/** Creates any of the four app-owned tabs (and their header row) that don't already exist. */
export async function ensureReviewsWorkbook(spreadsheetId: string, auth: SheetsAuth): Promise<void> {
  await ensureTab(spreadsheetId, REVIEWS_TAB, REVIEWS_HEADER, auth)
  await ensureTab(spreadsheetId, STAGES_TAB, STAGES_HEADER, auth)
  await ensureTab(spreadsheetId, POSITIONS_TAB, POSITIONS_HEADER, auth)
  await ensureTab(spreadsheetId, FIELDS_TAB, FIELDS_HEADER, auth)
}

async function ensureTab(spreadsheetId: string, tab: string, header: string[], auth: SheetsAuth): Promise<void> {
  const existingTabs = await getSpreadsheetTabs(spreadsheetId, auth)
  if (!existingTabs.includes(tab)) {
    await addSheetTabs(spreadsheetId, [tab], auth)
    await updateValues(spreadsheetId, tableRange(tab, header), [header], auth)
    return
  }
  const [existingHeader = []] = await getValues(spreadsheetId, `${tab}!1:1`, auth)
  if (existingHeader.length === 0) {
    await updateValues(spreadsheetId, tableRange(tab, header), [header], auth)
  }
}

export async function readReviews(
  spreadsheetId: string,
  auth: SheetsAuth,
): Promise<{ header: string[]; records: ReviewsRecord[] }> {
  const values = await getValues(spreadsheetId, REVIEWS_TAB, auth)
  const { header, rows } = parseSheetRows(values)
  const records = rows.map((row, i) => ({
    email: (row.email ?? '').trim().toLowerCase(),
    stage: row.stage ?? '',
    offeredPosition: row.offeredPosition ?? '',
    note: row.note ?? '',
    updatedAt: row.updatedAt ?? '',
    sheetRow: i + 2,
  }))
  return { header, records }
}

export async function readStages(spreadsheetId: string, auth: SheetsAuth): Promise<StageRow[]> {
  const values = await getValues(spreadsheetId, STAGES_TAB, auth)
  const { rows } = parseSheetRows(values)
  return rows.map((row) => ({
    stage: row.stage ?? '',
    isActionQueue: parseBoolean(row.isActionQueue ?? ''),
  }))
}

export async function readPositions(spreadsheetId: string, auth: SheetsAuth): Promise<PositionRow[]> {
  const values = await getValues(spreadsheetId, POSITIONS_TAB, auth)
  const { rows } = parseSheetRows(values)
  return rows.map((row) => ({ position: row.position ?? '' }))
}

export async function readFields(spreadsheetId: string, auth: SheetsAuth): Promise<FieldRow[]> {
  const values = await getValues(spreadsheetId, FIELDS_TAB, auth)
  const { rows } = parseSheetRows(values)
  return rows.map((row) => ({
    column: row.column ?? '',
    role: parseFieldRole(row.role ?? ''),
    show: parseBoolean(row.show ?? ''),
    order: parseOrder(row.order ?? ''),
    keyInfo: parseBoolean(row.keyInfo ?? ''),
  }))
}

/** Overwrites an existing Reviews row in place (header-order-aware). */
export async function writeReviewsRow(
  spreadsheetId: string,
  header: string[],
  sheetRow: number,
  values: ReviewsRow,
  auth: SheetsAuth,
): Promise<void> {
  const row = buildRow(header, values)
  await updateValues(spreadsheetId, rowRange(REVIEWS_TAB, header, sheetRow), [row], auth)
}

/** Appends a new Reviews row for an applicant with no existing row. */
export async function appendReviewsRow(
  spreadsheetId: string,
  header: string[],
  values: ReviewsRow,
  auth: SheetsAuth,
): Promise<void> {
  const row = buildRow(header, values)
  await appendValues(spreadsheetId, tableRange(REVIEWS_TAB, header), [row], auth)
}

/** Overwrites the whole Stages table (header + all rows) — used by the setup wizard/Settings. */
export async function writeStages(spreadsheetId: string, stages: StageRow[], auth: SheetsAuth): Promise<void> {
  const values = [STAGES_HEADER, ...stages.map((s) => [s.stage, s.isActionQueue ? 'TRUE' : 'FALSE'])]
  await updateValues(spreadsheetId, wholeTableRange(STAGES_TAB, STAGES_HEADER, values.length), values, auth)
}

/** Overwrites the whole Positions table (header + all rows) — used by the setup wizard/Settings. */
export async function writePositions(spreadsheetId: string, positions: PositionRow[], auth: SheetsAuth): Promise<void> {
  const values = [POSITIONS_HEADER, ...positions.map((p) => [p.position])]
  await updateValues(spreadsheetId, wholeTableRange(POSITIONS_TAB, POSITIONS_HEADER, values.length), values, auth)
}

/** Overwrites the whole Fields table (header + all rows) — used by the setup wizard/Settings. */
export async function writeFields(spreadsheetId: string, fields: FieldRow[], auth: SheetsAuth): Promise<void> {
  const values = [
    FIELDS_HEADER,
    ...fields.map((f) => [
      f.column,
      f.role,
      f.show ? 'TRUE' : 'FALSE',
      f.order === null ? '' : String(f.order),
      f.keyInfo ? 'TRUE' : 'FALSE',
    ]),
  ]
  await updateValues(spreadsheetId, wholeTableRange(FIELDS_TAB, FIELDS_HEADER, values.length), values, auth)
}

function wholeTableRange(tab: string, header: string[], rowCount: number): string {
  return `${tab}!A1:${columnLetter(header.length - 1)}${rowCount}`
}

function rowRange(tab: string, header: string[], sheetRow: number): string {
  return `${tab}!A${sheetRow}:${columnLetter(header.length - 1)}${sheetRow}`
}

function tableRange(tab: string, header: string[]): string {
  return `${tab}!A1:${columnLetter(header.length - 1)}1`
}

function parseBoolean(value: string): boolean {
  return value.trim().toUpperCase() === 'TRUE'
}

function parseOrder(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

function parseFieldRole(value: string): FieldRole {
  const v = value.trim()
  return v === 'key' || v === 'name' || v === 'preferredName' || v === 'long' ? v : ''
}
