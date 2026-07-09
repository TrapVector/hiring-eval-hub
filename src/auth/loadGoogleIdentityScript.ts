import { GIS_SCRIPT_SRC } from './constants'

let loadPromise: Promise<void> | null = null

export function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve()
  }
  if (loadPromise) {
    return loadPromise
  }
  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Failed to load Google Identity Services script'))
    }
    document.head.appendChild(script)
  })
  return loadPromise
}
