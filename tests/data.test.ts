import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { breeds } from '../src/data/breeds'

const PUBLIC = path.resolve(import.meta.dirname, '..', 'public')
const HEBREW = /[א-ת]/
const NIKUD = /[֑-ׇ]/
const LATIN = /[A-Za-z]/

const textFields = (b: (typeof breeds)[number]) =>
  [b.nameHe, b.coat, b.colors, b.temperament, b.history, ...(b.funFacts ?? []), ...(b.origin ?? []).map((o) => o.nameHe)]
    .filter((t): t is string => Boolean(t))

describe('breed data', () => {
  it('has the first batch of breeds', () => {
    expect(breeds.length).toBeGreaterThanOrEqual(30)
  })

  it('has unique ids', () => {
    expect(new Set(breeds.map((b) => b.id)).size).toBe(breeds.length)
  })

  describe.each(breeds.map((b) => [b.id, b] as const))('%s', (_id, b) => {
    it('has a Hebrew name', () => {
      expect(b.nameHe).toMatch(HEBREW)
      expect(b.nameHe).not.toMatch(LATIN)
    })

    it('has a photo and a thumbnail on disk', () => {
      for (const p of [b.photo.large, b.photo.thumb]) {
        const file = path.join(PUBLIC, p)
        expect(existsSync(file), file).toBe(true)
        expect(statSync(file).size).toBeGreaterThan(1000)
      }
      expect(b.photo.width).toBeGreaterThan(0)
      expect(b.photo.height).toBeGreaterThan(0)
    })

    it('has photo credits', () => {
      expect(b.credit.author.trim()).not.toBe('')
      expect(b.credit.license.trim()).not.toBe('')
      expect(b.credit.file.trim()).not.toBe('')
      expect(b.credit.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//)
    })

    it('lists its sources', () => {
      expect(b.sources.some((s) => s.startsWith('https://he.wikipedia.org/'))).toBe(true)
    })

    it('has kid-readable Hebrew text: no nikud, no Latin letters, no links', () => {
      for (const t of textFields(b)) {
        expect(t, t).toMatch(HEBREW)
        expect(t, t).not.toMatch(NIKUD)
        expect(t, t).not.toMatch(LATIN)
      }
    })

    it('has sane numbers', () => {
      for (const r of [b.heightCm, b.weightKg, b.lifeYears]) {
        if (!r) continue
        expect(r[0]).toBeGreaterThan(0)
        expect(r[1]).toBeGreaterThanOrEqual(r[0])
      }
      for (const v of [b.energy, b.kids, b.grooming]) {
        if (v !== undefined) expect([1, 2, 3, 4, 5]).toContain(v)
      }
    })
  })
})
