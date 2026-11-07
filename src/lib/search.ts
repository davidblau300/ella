const FINAL_TO_REGULAR: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' }

/**
 * Normalise Hebrew text for searching: final letters become regular letters,
 * nikud and cantillation marks are removed, and quote marks (geresh, gershayim),
 * hyphens and spaces are dropped so "צ'יוואווה" matches "ציוואווה".
 */
export function normalizeHebrew(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[ךםןףץ]/g, (c) => FINAL_TO_REGULAR[c])
    .replace(/["'׳״’”\-־\s]/g, '')
    .toLowerCase()
}

export function filterByName<T extends { nameHe: string }>(items: T[], query: string): T[] {
  const q = normalizeHebrew(query)
  if (!q) return items
  return items.filter((item) => normalizeHebrew(item.nameHe).includes(q))
}

const collator = new Intl.Collator('he')
export function sortByHebrewName<T extends { nameHe: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => collator.compare(a.nameHe, b.nameHe))
}
