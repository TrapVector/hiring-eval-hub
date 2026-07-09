import type { ApplicantRecord } from '../data/types'
import type { FieldRow, PositionRow, StageRow } from '../sheets/types'

export interface SyncState {
  applicants: ApplicantRecord[]
  stages: StageRow[]
  positions: PositionRow[]
  fields: FieldRow[]
  pendingCount: number
  isSyncing: boolean
  lastSyncedAt: number | null
  lastError: string | null
}

export const initialSyncState: SyncState = {
  applicants: [],
  stages: [],
  positions: [],
  fields: [],
  pendingCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  lastError: null,
}
