// Polite HTTP helper for Wikimedia APIs: one request at a time, a fixed pause
// between requests, an explicit timeout on every request, Retry-After aware
// back-off on 429/5xx, and an on-disk cache so re-runs don't refetch.
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const USER_AGENT =
  'EllaDogBreeds/1.0 (offline Hebrew dog-breeds app for kids; build-time data script; Node.js fetch)'

const CACHE_DIR = path.resolve(import.meta.dirname, '..', '.cache')
// pause between requests to the same host; the image host rate-limits hard
const PAUSE_MS = 1500
const PAUSE_BY_HOST = { 'upload.wikimedia.org': 4000 }
const TIMEOUT_MS = 30_000
const MAX_TRIES = 8

const lastRequest = new Map()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function pace(url) {
  const host = new URL(url).host
  const wait = (lastRequest.get(host) ?? 0) + (PAUSE_BY_HOST[host] ?? PAUSE_MS) - Date.now()
  if (wait > 0) await sleep(wait)
  lastRequest.set(host, Date.now())
}

async function request(url, { binary = false, method = 'GET', body, headers = {} } = {}) {
  for (let attempt = 1; ; attempt++) {
    await pace(url)
    let res
    try {
      res = await fetch(url, {
        method,
        body,
        headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT, ...headers },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (err) {
      if (attempt >= MAX_TRIES) throw err
      const wait = 2000 * 2 ** (attempt - 1)
      console.warn(`  ! ${err.name} for ${short(url)}, retrying in ${wait / 1000}s`)
      await sleep(wait)
      continue
    }
    if (res.ok) return binary ? Buffer.from(await res.arrayBuffer()) : await res.text()
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_TRIES) {
      const retryAfter = Number(res.headers.get('retry-after'))
      const wait = Number.isFinite(retryAfter) && retryAfter > 0
        ? (retryAfter + 2) * 1000
        : 5000 * 2 ** (attempt - 1)
      console.warn(`  ! HTTP ${res.status} for ${short(url)}, waiting ${Math.round(wait / 1000)}s`)
      await res.body?.cancel()
      await sleep(wait)
      continue
    }
    throw new Error(`HTTP ${res.status} for ${url}`)
  }
}

const short = (url) => (url.length > 90 ? url.slice(0, 90) + '…' : url)

function cacheFile(key, ext) {
  const hash = createHash('sha1').update(key).digest('hex').slice(0, 20)
  return path.join(CACHE_DIR, `${hash}.${ext}`)
}

/** GET (or POST form) JSON with caching. */
export async function getJson(url, { refresh = false, form } = {}) {
  const key = form ? url + '?' + new URLSearchParams(form).toString() : url
  const file = cacheFile(key, 'json')
  if (!refresh) {
    try {
      return JSON.parse(await readFile(file, 'utf8'))
    } catch {
      /* not cached */
    }
  }
  const text = await request(url, form
    ? {
        method: 'POST',
        body: new URLSearchParams(form),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    : {})
  const json = JSON.parse(text)
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(file, text)
  return json
}

/** Download a binary file with caching. */
export async function getBinary(url, { refresh = false } = {}) {
  const file = cacheFile(url, 'bin')
  if (!refresh) {
    try {
      return await readFile(file)
    } catch {
      /* not cached */
    }
  }
  const buf = await request(url, { binary: true })
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(file, buf)
  return buf
}
