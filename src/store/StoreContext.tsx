import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AppStore } from './AppStore'
import type { AppConfig } from './db'
import { startPollingLoop } from './pollingLoop'
import { initialSyncState, type SyncState } from './types'

interface StoreContextValue extends SyncState {
  isOnline: boolean
  sync: () => void
  editStage: (email: string, stage: string) => void
  editNote: (email: string, note: string) => void
  editOfferedPosition: (email: string, offeredPosition: string) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ config, children }: { config: AppConfig; children: ReactNode }) {
  const auth = useAuth()
  const store = useMemo(() => new AppStore(), [])
  const [state, setState] = useState<SyncState>(initialSyncState)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => store.subscribe(setState), [store])

  useEffect(() => {
    void store.hydrate()
  }, [store])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (auth.status !== 'signed-in') return
    return startPollingLoop(() => {
      void store.sync(config, auth)
    }, config.pollIntervalMinutes)
  }, [auth.status, store, config, auth])

  const value = useMemo<StoreContextValue>(
    () => ({
      ...state,
      isOnline,
      sync: () => void store.sync(config, auth),
      editStage: (email, stage) => void store.editStage(email, stage, config, auth),
      editNote: (email, note) => void store.editNote(email, note, config, auth),
      editOfferedPosition: (email, offeredPosition) =>
        void store.editOfferedPosition(email, offeredPosition, config, auth),
    }),
    [state, isOnline, store, config, auth],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return ctx
}
