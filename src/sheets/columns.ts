import type { SheetRow } from './types'

/** Splits raw sheet values into a header row and header-keyed records, tolerant of ragged rows. */
export function parseSheetRows(values: SheetRow[]): { header: string[]; rows: Record<string, string>[] } {
  const [header = [], ...dataRows] = values
  const rows = dataRows.map((row) => Object.fromEntries(header.map((column, i) => [column, row[i] ?? ''])))
  return { header, rows }
}

/** Builds a full sheet row array from a header-keyed record, preserving header column order. */
export function buildRow(header: string[], values: Record<string, string>): SheetRow {
  return header.map((column) => values[column] ?? '')
}

export function findColumnIndex(header: string[], column: string): number {
  return header.indexOf(column)
}

/** 0-based column index -> A1-notation column letters (0 -> 'A', 25 -> 'Z', 26 -> 'AA'). */
export function columnLetter(index: number): string {
  let n = index + 1
  let letters = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    letters = String.fromCharCode(65 + rem) + letters
    n = Math.floor((n - 1) / 26)
  }
  return letters
}
