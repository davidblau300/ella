import { describe, expect, it } from 'vitest'
import { PER_WEEK, rotate, weekNumber, type RotationState } from '../src/lib/rotation'

const pool = Array.from({ length: 40 }, (_, i) => `a${i}`)
// Sunday 8 November 2026 and the days around it
const sat = new Date(2026, 10, 7, 12)
const sun = new Date(2026, 10, 8, 9)
const wed = new Date(2026, 10, 11, 18)
const nextSun = new Date(2026, 10, 15, 9)

describe('weekly rotation', () => {
  it('starts a new week on Sunday', () => {
    expect(weekNumber(sun)).toBe(weekNumber(sat) + 1)
    expect(weekNumber(wed)).toBe(weekNumber(sun))
    expect(weekNumber(nextSun)).toBe(weekNumber(sun) + 1)
  })

  it('shows 6 unpinned activities', () => {
    const { shown } = rotate(null, pool, new Set(), sun)
    expect(shown).toHaveLength(PER_WEEK)
    expect(new Set(shown).size).toBe(PER_WEEK)
  })

  it('never shows or replaces a pinned activity in the weekly list', () => {
    const pinned = new Set(['a1', 'a2', 'a3'])
    let state: RotationState | null = null
    for (let w = 0; w < 10; w++) {
      const r = rotate(state, pool, pinned, new Date(2026, 10, 8 + 7 * w, 9))
      state = r.state
      expect(r.shown).toHaveLength(PER_WEEK)
      for (const id of pinned) expect(r.shown).not.toContain(id)
    }
  })

  it('keeps the same activities during the week', () => {
    const first = rotate(null, pool, new Set(), sun)
    const later = rotate(first.state, pool, new Set(), wed)
    expect(later.shown).toEqual(first.shown)
  })

  it('changes the activities when a new week starts', () => {
    const first = rotate(null, pool, new Set(), sun)
    const next = rotate(first.state, pool, new Set(), nextSun)
    expect(next.shown).toHaveLength(PER_WEEK)
    expect(next.shown.filter((id) => first.shown.includes(id))).toEqual([])
  })

  it('prefers activities she has not seen recently: all 40 appear before any repeats', () => {
    let state: RotationState | null = null
    const seenOrder: string[] = []
    for (let w = 0; w < Math.ceil(pool.length / PER_WEEK); w++) {
      const r = rotate(state, pool, new Set(), new Date(2026, 10, 8 + 7 * w, 9))
      state = r.state
      seenOrder.push(...r.shown)
    }
    expect(new Set(seenOrder.slice(0, pool.length)).size).toBe(pool.length)
  })

  it('fills the gap from the same week when she pins a shown activity', () => {
    const first = rotate(null, pool, new Set(), sun)
    const pinnedNow = new Set([first.shown[0]])
    const after = rotate(first.state, pool, pinnedNow, wed)
    expect(after.shown).toHaveLength(PER_WEEK)
    expect(after.shown).not.toContain(first.shown[0])
    expect(after.shown.slice(0, 5)).toEqual(first.shown.slice(1))
  })

  it('copes with activities leaving the pool', () => {
    const first = rotate(null, pool, new Set(), sun)
    const smaller = pool.filter((id) => !first.shown.includes(id))
    const r = rotate(first.state, smaller, new Set(), wed)
    expect(r.shown).toHaveLength(PER_WEEK)
    for (const id of r.shown) expect(smaller).toContain(id)
  })
})
