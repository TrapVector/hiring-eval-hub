import type { ApplicantRecord, QueuedEdit } from './types'

/**
 * Collapses multiple queued edits for the same email into one, merging
 * their changes (so a note edit followed later by a stage edit produces a
 * single entry with both) and keeping the latest timestamp (CLAUDE.md §8.4).
 */
export function coalesceQueue(entries: QueuedEdit[]): QueuedEdit[] {
  const byEmail = new Map<string, QueuedEdit>()

  for (const entry of entries) {
    const existing = byEmail.get(entry.email)
    byEmail.set(entry.email, {
      email: entry.email,
      changes: { ...existing?.changes, ...entry.changes },
      ts: Math.max(existing?.ts ?? 0, entry.ts),
    })
  }

  return [...byEmail.values()]
}

/**
 * Overlays queued (not-yet-flushed) local edits onto freshly polled
 * records, so a poll never clobbers unsynced changes (CLAUDE.md §8.4.4).
 */
export function applyQueuePrecedence(records: ApplicantRecord[], queue: QueuedEdit[]): ApplicantRecord[] {
  const queueByEmail = new Map(queue.map((e) => [e.email, e]))

  return records.map((record) => {
    const pending = queueByEmail.get(record.email)
    return pending ? { ...record, ...pending.changes } : record
  })
}
