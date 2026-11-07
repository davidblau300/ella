import { describe, expect, it } from 'vitest'
import { breeds } from '../src/data/breeds'
import { filterByName, normalizeHebrew, sortByHebrewName } from '../src/lib/search'

const names = (q: string) => filterByName(breeds, q).map((b) => b.nameHe)

describe('normalizeHebrew', () => {
  it('treats final letters as regular letters', () => {
    expect(normalizeHebrew('ךםןףץ')).toBe('כמנפצ')
  })
  it('drops nikud, geresh, hyphens and spaces', () => {
    expect(normalizeHebrew('צ\'יוואווה')).toBe('ציוואווה')
    expect(normalizeHebrew('שָׁלוֹם')).toBe('שלומ')
    expect(normalizeHebrew('שר-פיי')).toBe('שרפיי')
  })
})

describe('search', () => {
  it('returns everything for an empty query', () => {
    expect(filterByName(breeds, '  ')).toHaveLength(breeds.length)
  })

  it('finds breeds by a partial Hebrew name', () => {
    expect(names('ביג')).toContain('ביגל')
    expect(names('רטריבר')).toEqual(expect.arrayContaining(['גולדן רטריבר', 'לברדור רטריבר']))
    expect(names('האסק')).toContain('האסקי סיבירי')
  })

  it('matches a final letter typed in the middle of a name', () => {
    // "גרמן" with a final nun should find "רועה גרמני"
    expect(names('גרמן')).toContain('רועה גרמני')
    // "כנען" should find "כלב כנעני"
    expect(names('כנען')).toContain('כלב כנעני')
  })

  it('matches a regular letter typed where the name has a final letter', () => {
    // "פומרניאנ" (regular nun) should find "פומרניאן"
    expect(names('פומרניאנ')).toContain('פומרניאן')
  })

  it('ignores geresh and spaces', () => {
    expect(names('ציוואווה')).toContain("צ'יוואווה")
    expect(names('גולדןרטריבר')).toContain('גולדן רטריבר')
  })

  it('finds nothing for nonsense', () => {
    expect(names('קקקקק')).toEqual([])
  })
})

describe('sorting', () => {
  it('sorts in Hebrew alphabetical order', () => {
    const sorted = sortByHebrewName(breeds).map((b) => b.nameHe)
    const firstLetters = sorted.map((n) => n.charCodeAt(0))
    expect(firstLetters).toEqual([...firstLetters].sort((a, b) => a - b))
  })
})
