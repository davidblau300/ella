import type { Activity } from '../data/types'
import { readJson, writeJson } from './storage'

export const PINS_KEY = 'ella.activityPins.v1'

/** A pinned activity, with a copy of its data so it stays visible even if it leaves the pool. */
export interface Pin {
  id: string
  pinnedAt: string
  snapshot: Activity
}

export const loadPins = (): Pin[] => readJson<Pin[]>(PINS_KEY, [])

export function pinActivity(activity: Activity): Pin[] {
  const pins = loadPins().filter((p) => p.id !== activity.id)
  const next = [{ id: activity.id, pinnedAt: new Date().toISOString(), snapshot: activity }, ...pins]
  writeJson(PINS_KEY, next)
  return next
}

export function unpinActivity(id: string): Pin[] {
  const next = loadPins().filter((p) => p.id !== id)
  writeJson(PINS_KEY, next)
  return next
}

export interface PinnedView {
  activity: Activity
  /** true when the activity is no longer in the current pool */
  removed: boolean
}

/** Pinned activities, newest first: current data from the pool, or the saved copy if it left the pool. */
export function pinnedViews(pins: Pin[], pool: Activity[]): PinnedView[] {
  return pins.map((p) => {
    const current = pool.find((a) => a.id === p.id)
    return current ? { activity: current, removed: false } : { activity: p.snapshot, removed: true }
  })
}
