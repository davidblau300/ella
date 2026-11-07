// Small wrapper around localStorage: everything stays on this device, and the app
// keeps working (in memory) when storage is unavailable.
const memory = new Map<string, string>()

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw != null) return JSON.parse(raw) as T
  } catch {
    const raw = memory.get(key)
    if (raw != null) return JSON.parse(raw) as T
  }
  return fallback
}

export function writeJson(key: string, value: unknown) {
  const raw = JSON.stringify(value)
  try {
    window.localStorage.setItem(key, raw)
  } catch {
    memory.set(key, raw)
  }
}
