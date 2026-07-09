import { coalesceQueue } from '../data/queueLogic'
import type { QueuedEdit } from '../data/types'
import { getDb } from './db'

export async function getQueuedEdits(): Promise<QueuedEdit[]> {
  const db = await getDb()
  return db.getAll('editQueue')
}

/** Persists an edit, coalescing it with any existing queued edit for the same email. */
export async function enqueueEdit(edit: QueuedEdit): Promise<void> {
  const db = await getDb()
  const existing = await db.get('editQueue', edit.email)
  const [merged] = coalesceQueue(existing ? [existing, edit] : [edit])
  if (merged) {
    await db.put('editQueue', merged)
  }
}

export async function dequeueEdit(email: string): Promise<void> {
  const db = await getDb()
  await db.delete('editQueue', email)
}
