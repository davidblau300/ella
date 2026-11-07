// Keeps the installed app up to date without anyone doing anything:
// new versions download in the background (the service worker precaches everything,
// photos included) and the app switches to them at a good moment (see updatePolicy).
import { registerSW } from 'virtual:pwa-register'
import { parseHash } from './lib/route'
import { shouldApplyUpdate, type UpdateEvent } from './lib/updatePolicy'

const CHECK_EVERY_MS = 60 * 60 * 1000 // look for a new version every hour

export function startAutoUpdate() {
  if (!('serviceWorker' in navigator)) return
  let pending = false
  let applying = false

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // a new version has fully downloaded and is waiting
      pending = true
      maybeApply('downloaded')
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return
      // a version that finished downloading earlier is waiting as the app opens: switch now
      if (registration.waiting && navigator.serviceWorker.controller) {
        pending = true
        maybeApply('startup')
      }
      const check = () => { if (navigator.onLine) registration.update().catch(() => {}) }
      setInterval(check, CHECK_EVERY_MS)
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check() })
    },
  })

  function maybeApply(event: UpdateEvent) {
    if (applying) return
    if (shouldApplyUpdate({ pending, onHome: parseHash(window.location.hash).page === 'home', event })) {
      applying = true
      void updateSW(true) // activate the new version and reload (same screen, new code)
    }
  }

  window.addEventListener('hashchange', () => maybeApply('navigated'))
  let wasHidden = false
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') wasHidden = true
    else if (wasHidden) { wasHidden = false; maybeApply('resumed') }
  })
}
