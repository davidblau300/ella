import type { Range, SizeGroup } from '../data/types'

export const SIZE_LABELS: Record<SizeGroup, string> = {
  small: 'קטן',
  medium: 'בינוני',
  large: 'גדול',
  giant: 'ענק',
}
export const SIZE_ORDER: SizeGroup[] = ['small', 'medium', 'large', 'giant']

const num = (n: number) => String(Math.round(n * 10) / 10)

/**
 * "22–32 ק״ג", written low-to-high; the bidi isolate keeps the numbers in order in RTL text.
 * A single value (an average from the sources) is shown as "בערך 12 שנים".
 */
export function formatRange([lo, hi]: Range, unit: string): string {
  if (lo === hi) return `בערך ${num(lo)} ${unit}`
  return `⁦${num(lo)}–${num(hi)}⁩ ${unit}`
}

/** keep "16:30–17:15" in reading order inside right-to-left text */
export const ltrTimes = (text: string) => text.replace(/(\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2})/g, '⁦$1⁩')
