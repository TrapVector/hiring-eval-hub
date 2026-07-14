export type SheetRow = string[]

export interface SheetsAuth {
  getAccessToken: () => Promise<string>
  reconnect: () => Promise<string>
}

// A type alias (not an interface) so it structurally satisfies Record<string, string>
// when passed to buildRow() — interfaces don't get the implicit index signature.
export type ReviewsRow = {
  email: string
  stage: string
  offeredPosition: string
  note: string
  updatedAt: string
}

export interface StageRow {
  stage: string
  isActionQueue: boolean
}

export interface PositionRow {
  position: string
}

export type FieldRole = 'key' | 'name' | 'preferredName' | 'long' | ''

export interface FieldRow {
  column: string
  role: FieldRole
  show: boolean
  order: number | null
  /** Included in the printed interview packet's key-info block, independent of `show`/`role`. */
  keyInfo: boolean
}

export interface ApplicationRow {
  /** 0-based index among data rows (excludes header); used for duplicate tie-breaking. */
  rowIndex: number
  values: Record<string, string>
}
