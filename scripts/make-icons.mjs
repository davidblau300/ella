// Renders the PWA icons in public/ from public/favicon.svg. Run: node scripts/make-icons.mjs
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const pub = path.resolve(import.meta.dirname, '..', 'public')
const svg = await readFile(path.join(pub, 'favicon.svg'))
const render = (size) => sharp(svg, { density: 72 * (size / 64) }).resize(size, size).png()
await render(192).toFile(path.join(pub, 'icon-192.png'))
await render(512).toFile(path.join(pub, 'icon-512.png'))
await render(180).toFile(path.join(pub, 'apple-touch-icon.png'))
// maskable: full-bleed background with the paw inside the safe zone
const inner = await render(360).toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#f28c28' } })
  .composite([{ input: inner, gravity: 'center' }]).png().toFile(path.join(pub, 'icon-512-maskable.png'))
console.log('icons written')
