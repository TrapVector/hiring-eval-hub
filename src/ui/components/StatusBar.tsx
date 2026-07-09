import { useStore } from '../../store/StoreContext'
import styles from './StatusBar.module.css'

export function StatusBar() {
  const { isOnline, pendingCount, isSyncing, lastError, lastSyncedAt, sync } = useStore()

  return (
    <div className={styles.bar}>
      {!isOnline && <span className={styles.offline}>Offline</span>}
      {isSyncing && <span>Syncing…</span>}
      {!isSyncing && pendingCount > 0 && (
        <span className={styles.pending}>
          {pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'}
        </span>
      )}
      {!isSyncing && pendingCount === 0 && lastSyncedAt !== null && <span className={styles.synced}>Synced</span>}
      {lastError && <span className={styles.error}>{lastError}</span>}
      <button type="button" onClick={sync} disabled={isSyncing || !isOnline}>
        Sync now
      </button>
    </div>
  )
}
