import { ensureReviewsWorkbook, writeFields, writePositions, writeStages } from '../sheets/reviewsSheet'
import type { FieldRow, PositionRow, SheetsAuth, StageRow } from '../sheets/types'

export interface ConfigTables {
  stages: StageRow[]
  positions: PositionRow[]
  fields: FieldRow[]
}

/** Creates any missing Reviews-sheet tabs, then writes the wizard/Settings config tables. */
export async function writeConfigTables(reviewsSheetId: string, tables: ConfigTables, auth: SheetsAuth): Promise<void> {
  await ensureReviewsWorkbook(reviewsSheetId, auth)
  await Promise.all([
    writeStages(reviewsSheetId, tables.stages, auth),
    writePositions(reviewsSheetId, tables.positions, auth),
    writeFields(reviewsSheetId, tables.fields, auth),
  ])
}
