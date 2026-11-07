/** When this version of the app was built (ISO string, set at build time). */
export const BUILD_TIME: string = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : ''

/** "7.11.2026, 15:42" in Israel time */
export function formatBuildTime(iso: string): string {
  if (!iso) return 'לא ידוע'
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  )
  return `${Number(parts.day)}.${Number(parts.month)}.${parts.year}, ${parts.hour}:${parts.minute}`
}
