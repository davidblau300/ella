// Renders every PWA / home-screen icon in public/icons/ from public/favicon.svg.
// Run: node scripts/make-icons.mjs
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const pub = path.resolve(import.meta.dirname, '..', 'public')
const out = path.join(pub, 'icons')
await mkdir(out, { recursive: true })
const svg = await readFile(path.join(pub, 'favicon.svg'))
const render = (size) => sharp(svg, { density: Math.ceil(72 * (size / 64)) }).resize(size, size)

// Android / manifest ("any"), and Apple touch icons (iPhone 120/180, iPad 152, iPad Pro 167)
export const ANY_SIZES = [48, 72, 96, 128, 144, 192, 256, 384, 512]
export const APPLE_SIZES = [120, 152, 167, 180]
for (const s of ANY_SIZES) await render(s).png().toFile(path.join(out, `icon-${s}.png`))
// Apple icons must be opaque (iOS fills transparent corners with black)
for (const s of APPLE_SIZES) {
  await render(s).flatten({ background: '#f28c28' }).png().toFile(path.join(out, `apple-touch-icon-${s}.png`))
}
await render(180).flatten({ background: '#f28c28' }).png().toFile(path.join(pub, 'apple-touch-icon.png'))
// maskable: full-bleed background, artwork inside the 80% safe zone
for (const s of [192, 512]) {
  const inner = await render(Math.round(s * 0.72)).toBuffer()
  await sharp({ create: { width: s, height: s, channels: 4, background: '#f28c28' } })
    .composite([{ input: inner, gravity: 'center' }]).png().toFile(path.join(out, `maskable-${s}.png`))
}
console.log('icons written to public/icons/')
