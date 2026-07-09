/**
 * Runs `callback` on load and every `intervalMinutes`, pausing while the
 * tab is hidden or offline and resuming on focus/online (CLAUDE.md §8.6).
 * Returns a stop function that removes all listeners/timers.
 */
export function startPollingLoop(callback: () => void, intervalMinutes: number): () => void {
  let timer: ReturnType<typeof setInterval> | null = null

  function shouldRun(): boolean {
    return !document.hidden && navigator.onLine
  }

  function tick(): void {
    if (shouldRun()) {
      callback()
    }
  }

  function start(): void {
    if (timer !== null) return
    timer = setInterval(tick, intervalMinutes * 60_000)
  }

  function stop(): void {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function handleVisibilityOrOnlineChange(): void {
    if (shouldRun()) {
      callback()
      start()
    } else {
      stop()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityOrOnlineChange)
  window.addEventListener('online', handleVisibilityOrOnlineChange)
  window.addEventListener('offline', handleVisibilityOrOnlineChange)

  if (shouldRun()) {
    callback()
    start()
  }

  return () => {
    stop()
    document.removeEventListener('visibilitychange', handleVisibilityOrOnlineChange)
    window.removeEventListener('online', handleVisibilityOrOnlineChange)
    window.removeEventListener('offline', handleVisibilityOrOnlineChange)
  }
}
