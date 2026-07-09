import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ApplicantRecord, QueuedEdit } from '../data/types'
import type { FieldRow, PositionRow, StageRow } from '../sheets/types'

export interface AppConfig {
  applicationsSheetId: string
  applicationsTabName: string | null
  reviewsSheetId: string
  oauthClientId: string
  pollIntervalMinutes: number
}

interface HiringDB extends DBSchema {
  config: { key: 'app'; value: AppConfig }
  stagesCache: { key: 'all'; value: StageRow[] }
  positionsCache: { key: 'all'; value: PositionRow[] }
  fieldsCache: { key: 'all'; value: FieldRow[] }
  applicantsSnapshot: { key: 'all'; value: ApplicantRecord[] }
  editQueue: { key: string; value: QueuedEdit }
}

const DB_NAME = 'hiring-eval-hub'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<HiringDB>> | null = null

export function getDb(): Promise<IDBPDatabase<HiringDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HiringDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('config')
        db.createObjectStore('stagesCache')
        db.createObjectStore('positionsCache')
        db.createObjectStore('fieldsCache')
        db.createObjectStore('applicantsSnapshot')
        db.createObjectStore('editQueue', { keyPath: 'email' })
      },
    })
  }
  return dbPromise
}
