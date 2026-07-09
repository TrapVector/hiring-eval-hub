import type { QueuedEdit } from '../data/types'
import type { SheetsAuth } from '../sheets/types'
import type { AppConfig } from './db'
import { flushQueue } from './flush'
import {
  loadCachedFields,
  loadCachedPositions,
  loadCachedStages,
  loadSnapshot,
  saveCachedFields,
  saveCachedPositions,
  saveCachedStages,
  saveSnapshot,
} from './configStore'
import { enqueueEdit, getQueuedEdits } from './queueStore'
import { pollOnce } from './syncEngine'
import { initialSyncState, type SyncState } from './types'

type Listener = (state: SyncState) => void

/**
 * Owns in-memory sync state and mediates every read/write path described in
 * CLAUDE.md §8: optimistic edits go through the IndexedDB queue immediately,
 * sync() polls and re-merges (respecting queue precedence), flush() replays
 * the queue into the Reviews sheet.
 */
export class AppStore {
  private state: SyncState = initialSyncState
  private listeners = new Set<Listener>()

  getState(): SyncState {
    return this.state
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  /** Loads the last-read snapshot + cached config tables + queue count from IndexedDB so the app opens instantly (§7). */
  async hydrate(): Promise<void> {
    const [applicants, stages, positions, fields, queue] = await Promise.all([
      loadSnapshot(),
      loadCachedStages(),
      loadCachedPositions(),
      loadCachedFields(),
      getQueuedEdits(),
    ])
    this.setState({ applicants, stages, positions, fields, pendingCount: queue.length })
  }

  async editStage(email: string, stage: string, config: AppConfig, auth: SheetsAuth): Promise<void> {
    await this.applyEdit(email, { stage }, config, auth)
  }

  async editNote(email: string, note: string, config: AppConfig, auth: SheetsAuth): Promise<void> {
    await this.applyEdit(email, { note }, config, auth)
  }

  async editOfferedPosition(email: string, offeredPosition: string, config: AppConfig, auth: SheetsAuth): Promise<void> {
    await this.applyEdit(email, { offeredPosition }, config, auth)
  }

  async sync(config: AppConfig, auth: SheetsAuth): Promise<void> {
    if (this.state.isSyncing) return
    this.setState({ isSyncing: true, lastError: null })
    try {
      const result = await pollOnce(config, auth)
      const queue = await getQueuedEdits()
      await Promise.all([
        saveSnapshot(result.applicants),
        saveCachedStages(result.stages),
        saveCachedPositions(result.positions),
        saveCachedFields(result.fields),
      ])
      this.setState({
        applicants: result.applicants,
        stages: result.stages,
        positions: result.positions,
        fields: result.fields,
        pendingCount: queue.length,
        isSyncing: false,
        lastSyncedAt: Date.now(),
      })
    } catch (err) {
      this.setState({ isSyncing: false, lastError: err instanceof Error ? err.message : String(err) })
    }
  }

  async flush(config: AppConfig, auth: SheetsAuth): Promise<void> {
    try {
      await flushQueue(config, auth)
    } catch {
      // A failure before any row could be processed (offline, not yet
      // authenticated, network error) leaves the whole queue as-is; the
      // next flush/online event retries it (§8.4.5).
    } finally {
      const queue = await getQueuedEdits()
      this.setState({ pendingCount: queue.length })
    }
  }

  private async applyEdit(
    email: string,
    changes: QueuedEdit['changes'],
    config: AppConfig,
    auth: SheetsAuth,
  ): Promise<void> {
    const applicants = this.state.applicants.map((a) => (a.email === email ? { ...a, ...changes } : a))
    this.setState({ applicants })
    await enqueueEdit({ email, changes, ts: Date.now() })
    const queue = await getQueuedEdits()
    this.setState({ pendingCount: queue.length })
    void this.flush(config, auth)
  }

  private setState(patch: Partial<SyncState>): void {
    this.state = { ...this.state, ...patch }
    for (const listener of this.listeners) {
      listener(this.state)
    }
  }
}
