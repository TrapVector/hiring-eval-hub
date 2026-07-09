import type { ApplicationRow } from '../sheets/types'

const TIMESTAMP_HEADER_PATTERN = /^timestamp$/i

export function findTimestampColumn(header: string[]): string | null {
  return header.find((h) => TIMESTAMP_HEADER_PATTERN.test(h.trim())) ?? null
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Keeps only the latest submission per email: by Timestamp when parseable,
 * falling back to sheet row order when timestamps tie or are absent
 * (CLAUDE.md §8.3). Rows with no email can't be joined and are dropped.
 */
export function dedupeApplications(
  rows: ApplicationRow[],
  keyColumn: string,
  timestampColumn: string | null,
): ApplicationRow[] {
  const latestByEmail = new Map<string, ApplicationRow>()

  for (const row of rows) {
    const rawEmail = row.values[keyColumn]
    if (!rawEmail?.trim()) continue
    const email = normalizeEmail(rawEmail)
    const existing = latestByEmail.get(email)
    if (!existing || isLater(row, existing, timestampColumn)) {
      latestByEmail.set(email, row)
    }
  }

  return [...latestByEmail.values()]
}

function isLater(candidate: ApplicationRow, current: ApplicationRow, timestampColumn: string | null): boolean {
  if (timestampColumn) {
    const candidateTime = Date.parse(candidate.values[timestampColumn] ?? '')
    const currentTime = Date.parse(current.values[timestampColumn] ?? '')
    if (!Number.isNaN(candidateTime) && !Number.isNaN(currentTime) && candidateTime !== currentTime) {
      return candidateTime > currentTime
    }
  }
  return candidate.rowIndex > current.rowIndex
}
