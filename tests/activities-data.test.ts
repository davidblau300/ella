import { describe, expect, it } from 'vitest'
import { activities, activitiesRefreshedOn } from '../src/data/activities'
import { CATEGORIES } from '../src/lib/categories'

const HEBREW = /[א-ת]/
const LATIN = /[A-Za-z]/
const LETTERS = 'אבגדהו'

/** grade numbers (1-6) covered by text like "כיתות ב'–ה'", "כיתה ד'", "מכיתה ד'", "כיתות א', ג'" */
function gradesCovered(text: string): number[] {
  const idx = (l: string) => LETTERS.indexOf(l) + 1
  const range = text.match(/([א-ו])'[–-]([א-ו])'/)
  if (range) return Array.from({ length: idx(range[2]) - idx(range[1]) + 1 }, (_, i) => idx(range[1]) + i)
  const from = text.match(/מכיתה ([א-ו])'/)
  if (from) return Array.from({ length: 7 - idx(from[1]) }, (_, i) => idx(from[1]) + i)
  return [...text.matchAll(/([א-ו])'/g)].map((m) => idx(m[1]))
}

describe('activities pool', () => {
  it('has a pool of activities to rotate through', () => {
    expect(activities.length).toBeGreaterThanOrEqual(30)
  })

  it('has unique ids', () => {
    expect(new Set(activities.map((a) => a.id)).size).toBe(activities.length)
  })

  it('records the date of the last refresh', () => {
    expect(activitiesRefreshedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  describe.each(activities.map((a) => [a.id, a] as const))('%s', (_id, a) => {
    it('has a source URL and a date checked', () => {
      expect(a.sourceUrl).toMatch(/^https:\/\//)
      expect(a.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(a.checkedOn))).toBe(false)
    })

    it('is for 3rd or 4th grade', () => {
      const covered = gradesCovered(a.grades)
      expect(covered.includes(3) || covered.includes(4), a.grades).toBe(true)
    })

    it('has kid-facing text in Hebrew only', () => {
      for (const t of [a.nameHe, a.description, a.place, a.grades, a.neighborhood, ...a.times.map((x) => x.text)]) {
        if (!t) continue
        expect(t, t).toMatch(HEBREW)
        expect(t, t).not.toMatch(LATIN)
      }
    })

    it('has a known category and an organizer', () => {
      expect(CATEGORIES[a.category]).toBeDefined()
      expect(a.organizer.trim()).not.toBe('')
    })
  })
})
