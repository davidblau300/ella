// Fails the build if the service worker does not precache every breed photo and
// thumbnail (and the core install files), so the app is guaranteed to work offline.
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const sw = await readFile(path.join(root, 'dist', 'sw.js'), 'utf8')
const data = await readFile(path.join(root, 'src', 'data', 'breeds.ts'), 'utf8')
const breeds = JSON.parse(data.slice(data.indexOf('= [') + 2))

const required = [
  'index.html',
  'manifest.webmanifest',
  'apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  ...breeds.flatMap((b) => [b.photo.large, b.photo.thumb]),
]
const missing = required.filter((p) => !sw.includes(`"${p}"`))
if (missing.length) {
  console.error(`Service worker is missing ${missing.length} file(s) from its precache:\n  ${missing.join('\n  ')}`)
  process.exit(1)
}
console.log(`Precache OK: ${breeds.length} breeds, ${breeds.length * 2} photos and the app shell are cached for offline use.`)
