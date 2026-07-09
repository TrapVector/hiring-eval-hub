import { appendReviewsRow, readReviews, writeReviewsRow } from '../sheets/reviewsSheet'
import type { SheetsAuth } from '../sheets/types'
import type { AppConfig } from './db'
import { dequeueEdit, getQueuedEdits } from './queueStore'

/**
 * Replays queued edits into the Reviews sheet: update the applicant's row
 * if one exists, else append a new one. Successfully flushed edits are
 * dequeued; failures stay queued and retry on the next flush (§8.4.3/5).
 */
export async function flushQueue(config: AppConfig, auth: SheetsAuth): Promise<void> {
  const queue = await getQueuedEdits()
  if (queue.length === 0) return

  const { header, records } = await readReviews(config.reviewsSheetId, auth)
  const byEmail = new Map(records.map((r) => [r.email, r]))

  for (const edit of queue) {
    const existing = byEmail.get(edit.email)
    const values = {
      email: edit.email,
      stage: edit.changes.stage ?? existing?.stage ?? '',
      offeredPosition: edit.changes.offeredPosition ?? existing?.offeredPosition ?? '',
      note: edit.changes.note ?? existing?.note ?? '',
      updatedAt: new Date().toISOString(),
    }

    try {
      if (existing) {
        await writeReviewsRow(config.reviewsSheetId, header, existing.sheetRow, values, auth)
      } else {
        await appendReviewsRow(config.reviewsSheetId, header, values, auth)
      }
      await dequeueEdit(edit.email)
    } catch {
      // Leave it queued; the next flush (or online/reconnect event) retries it.
    }
  }
}
