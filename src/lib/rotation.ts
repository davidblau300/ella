// Weekly rotation of unpinned activities. Every Sunday a new set of 6 is chosen from
// the pool, preferring activities she has not seen recently. Pinned activities are
// shown separately and are never part of (or replaced by) the rotation.
import { readJson, writeJson } from './storage'

export const ROTATION_KEY = 'ella.activityRotation.v1'
export const PER_WEEK = 6

export interface RotationState {
  /** week number the ranking belongs to */
  week: number
  /** this week's ranking of activity ids (most preferred first) */
  order: string[]
  /** id -> last week number it was shown */
  seen: Record<string, number>
}

const DAY = 24 * 60 * 60 * 1000
// 4 January 1970 was a Sunday
const FIRST_SUNDAY = Date.UTC(1970, 0, 4)

/** Week number in local time; a new week starts every Sunday at midnight. */
export function weekNumber(date: Date): number {
  const localMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((localMidnight - FIRST_SUNDAY) / (7 * DAY))
}

/** small deterministic hash, so the same week always gives the same order */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Rank the pool for a week: never-seen first, then least recently seen; ties shuffled by week. */
export function rankForWeek(ids: string[], seen: Record<string, number>, week: number): string[] {
  return [...ids].sort((a, b) => {
    const sa = seen[a] ?? -Infinity
    const sb = seen[b] ?? -Infinity
    if (sa !== sb) return sa - sb
    return hash(`${week}:${a}`) - hash(`${week}:${b}`)
  })
}

/** The unpinned activities to show: the first PER_WEEK of this week's ranking that are not pinned. */
export function visibleUnpinned(order: string[], poolIds: string[], pinned: Set<string>, count = PER_WEEK): string[] {
  const inPool = new Set(poolIds)
  const ranked = [...order.filter((id) => inPool.has(id)), ...poolIds.filter((id) => !order.includes(id))]
  return ranked.filter((id) => !pinned.has(id)).slice(0, count)
}

/**
 * Pure step: given the saved state, the pool, the pinned ids and the date, return
 * which activities to show and the state to save.
 */
export function rotate(
  state: RotationState | null,
  poolIds: string[],
  pinned: Set<string>,
  now: Date,
): { shown: string[]; state: RotationState } {
  const week = weekNumber(now)
  const seen = { ...(state?.seen ?? {}) }
  const order = state && state.week === week ? state.order : rankForWeek(poolIds, seen, week)
  const shown = visibleUnpinned(order, poolIds, pinned)
  for (const id of shown) seen[id] = week
  return { shown, state: { week, order, seen } }
}

/** Load, rotate and save (localStorage). */
export function currentRotation(poolIds: string[], pinned: Set<string>, now = new Date()): string[] {
  const { shown, state } = rotate(readJson<RotationState | null>(ROTATION_KEY, null), poolIds, pinned, now)
  writeJson(ROTATION_KEY, state)
  return shown
}
