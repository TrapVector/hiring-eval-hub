import { dedupeApplications, findTimestampColumn } from '../data/dedupeApplications'
import { resolveFields } from '../data/fields'
import { mergeApplicants } from '../data/mergeApplicants'
import { applyQueuePrecedence } from '../data/queueLogic'
import type { ApplicantRecord } from '../data/types'
import { readApplications, resolveApplicationsTabName } from '../sheets/applicationsSheet'
import { readFields, readPositions, readReviews, readStages } from '../sheets/reviewsSheet'
import type { FieldRow, PositionRow, SheetsAuth, StageRow } from '../sheets/types'
import type { AppConfig } from './db'
import { getQueuedEdits } from './queueStore'

export interface SyncResult {
  applicants: ApplicantRecord[]
  stages: StageRow[]
  positions: PositionRow[]
  fields: FieldRow[]
}

/**
 * Reads Applications + the Reviews-sheet config tabs, merges them, and
 * overlays any not-yet-flushed local edits (CLAUDE.md §8.2–§8.4.4).
 */
export async function pollOnce(config: AppConfig, auth: SheetsAuth): Promise<SyncResult> {
  const tabName = await resolveApplicationsTabName(
    config.applicationsSheetId,
    config.applicationsTabName ?? undefined,
    auth,
  )

  const [{ header, rows }, fields, stages, positions, { records: reviews }] = await Promise.all([
    readApplications(config.applicationsSheetId, tabName, auth),
    readFields(config.reviewsSheetId, auth),
    readStages(config.reviewsSheetId, auth),
    readPositions(config.reviewsSheetId, auth),
    readReviews(config.reviewsSheetId, auth),
  ])

  const { keyColumn } = resolveFields(fields)
  if (!keyColumn) {
    throw new Error('Fields config has no key (email) column configured')
  }

  const timestampColumn = findTimestampColumn(header)
  const deduped = dedupeApplications(rows, keyColumn, timestampColumn)
  const defaultStage = stages[0]?.stage ?? ''
  const merged = mergeApplicants(deduped, keyColumn, reviews, defaultStage)

  const queue = await getQueuedEdits()
  const applicants = applyQueuePrecedence(merged, queue)

  return { applicants, stages, positions, fields }
}
