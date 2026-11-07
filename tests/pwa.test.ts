import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '..')
const read = (p: string) => readFileSync(path.join(root, p), 'utf8')

describe('install, offline and privacy setup', () => {
  it('keeps search engines out', () => {
    expect(read('index.html')).toMatch(/<meta name="robots" content="noindex, nofollow"/)
    expect(read('public/robots.txt')).toMatch(/User-agent: \*\s+Disallow: \/\s*$/)
    expect(read('vercel.json')).toContain('X-Robots-Tag')
  })

  it('is Hebrew and right-to-left', () => {
    expect(read('index.html')).toContain('<html lang="he" dir="rtl">')
  })

  it('has every home-screen icon on disk', () => {
    const config = read('vite.config.ts')
    for (const s of [48, 72, 96, 128, 144, 192, 256, 384, 512]) {
      expect(existsSync(path.join(root, `public/icons/icon-${s}.png`))).toBe(true)
    }
    for (const s of [120, 152, 167, 180]) {
      expect(existsSync(path.join(root, `public/icons/apple-touch-icon-${s}.png`))).toBe(true)
      expect(read('index.html')).toContain(`sizes="${s}x${s}" href="/icons/apple-touch-icon-${s}.png"`)
    }
    expect(existsSync(path.join(root, 'public/apple-touch-icon.png'))).toBe(true)
    expect(existsSync(path.join(root, 'public/icons/maskable-512.png'))).toBe(true)
    expect(config).toContain("name: 'Ella'")
    expect(config).toContain("display: 'standalone'")
    expect(config).toContain("orientation: 'any'")
  })

  it('precaches photos for offline use', () => {
    expect(read('vite.config.ts')).toMatch(/globPatterns: \[.*webp/)
    expect(read('package.json')).toContain('scripts/check-precache.mjs')
  })
})
