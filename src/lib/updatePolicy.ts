/**
 * When to switch to a new version that has finished downloading in the background.
 * - 'startup'    the app was just opened and a new version is already waiting
 * - 'resumed'    the app came back from the background (she opened it again)
 * - 'downloaded' a new version just finished downloading while she uses the app
 * - 'navigated'  she moved to another screen
 * Switching reloads the page, so while she is busy on a screen it waits; on the home
 * page (nothing to lose) it switches right away.
 */
export type UpdateEvent = 'startup' | 'resumed' | 'downloaded' | 'navigated'

export function shouldApplyUpdate({ pending, onHome, event }: { pending: boolean; onHome: boolean; event: UpdateEvent }) {
  if (!pending) return false
  return onHome || event === 'startup' || event === 'resumed'
}
