#!/usr/bin/env node
// Builds src/data/breeds.ts and public/dogs/* from Wikidata, Wikimedia Commons
// and Wikipedia, plus the hand-written Hebrew text in scripts/content/.
//
//   npm run data                 fetch + build everything listed in scripts/batches/
//   npm run data -- candidates   list breeds with a Hebrew Wikipedia article that
//                                are not in any batch yet (most sitelinks first)
//   npm run data -- photos <slug> [<slug>…]
//                                list freely licensed photos from the breed's Wikipedia
//                                articles and save previews to scripts/.cache/photos/<slug>/
//   npm run data -- --refresh    ignore the HTTP cache in scripts/.cache/
//
// See CLAUDE.md ("Adding a batch of breeds") for the full workflow.
import { mkdir, readFile, readdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { getBinary, getJson } from './lib/http.mjs'
import { wikitextToPlain, parseInfobox } from './lib/wikitext.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const BATCH_DIR = path.join(ROOT, 'scripts', 'batches')
const CONTENT_DIR = path.join(ROOT, 'scripts', 'content')
const SOURCES_DIR = path.join(ROOT, 'scripts', '.cache', 'sources')
const DOGS_DIR = path.join(ROOT, 'public', 'dogs')
const OUT_FILE = path.join(ROOT, 'src', 'data', 'breeds.ts')

const LARGE_WIDTH = 1000
const THUMB_SIZE = 160
const FREE_LICENSE = /^(cc[ -]?by(-sa)?( \d\.\d)?|cc0|public domain|pd\b|attribution|fal|gfdl)/i

const args = process.argv.slice(2)
const refresh = args.includes('--refresh')
const command = args.find((a) => !a.startsWith('--')) ?? 'build'

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))
const exists = (p) => access(p).then(() => true, () => false)
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

async function readBatches() {
  const files = (await readdir(BATCH_DIR)).filter((f) => f.endsWith('.json')).sort()
  const breeds = []
  for (const f of files) {
    for (const b of JSON.parse(await readFile(path.join(BATCH_DIR, f), 'utf8'))) breeds.push({ ...b, batch: f })
  }
  const seen = new Set()
  for (const b of breeds) {
    if (seen.has(b.qid) || seen.has(b.slug)) throw new Error(`Duplicate breed ${b.qid}/${b.slug} in ${b.batch}`)
    seen.add(b.qid).add(b.slug)
  }
  return breeds
}

// ---------------------------------------------------------------- candidates
async function candidates() {
  const query = `SELECT ?breed ?he ?en ?links WHERE {
    ?breed wdt:P31 wd:Q39367 .
    ?hewiki schema:about ?breed ; schema:isPartOf <https://he.wikipedia.org/> .
    ?breed wikibase:sitelinks ?links .
    OPTIONAL { ?breed rdfs:label ?he FILTER(lang(?he)="he") }
    OPTIONAL { ?breed rdfs:label ?en FILTER(lang(?en)="en") }
  } ORDER BY DESC(?links)`
  const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query)
  const json = await getJson(url, { refresh: true })
  const have = new Set((await readBatches()).map((b) => b.qid))
  const rows = new Map()
  for (const r of json.results.bindings) {
    const qid = r.breed.value.split('/').pop()
    if (!have.has(qid) && !rows.has(qid)) rows.set(qid, r)
  }
  console.log(`${rows.size} breeds with a Hebrew article are not in any batch yet:\n`)
  for (const [qid, r] of rows) console.log(`${qid}\t${r.links.value}\t${r.he?.value ?? '?'}\t${r.en?.value ?? '?'}`)
  console.log('\nNote: some breeds lack the P31=dog breed statement on Wikidata (e.g. Pomeranian, Q39579)')
  console.log('and will not show up here; they can still be added to a batch by QID.')
}

// ---------------------------------------------------------------- fetching
const claimValues = (entity, prop) =>
  (entity.claims?.[prop] ?? [])
    .filter((c) => c.rank !== 'deprecated' && c.mainsnak.snaktype === 'value')
    .sort((a, b) => (b.rank === 'preferred') - (a.rank === 'preferred'))
    .map((c) => c.mainsnak.datavalue.value)

async function wbEntities(ids, props) {
  const out = {}
  for (const part of chunk([...new Set(ids)], 50)) {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&formatversion=2` +
      `&props=${props}&languages=he|en&ids=${part.join('|')}`
    Object.assign(out, (await getJson(url, { refresh })).entities)
  }
  return out
}

function flagEmoji(iso2) {
  if (!/^[A-Z]{2}$/.test(iso2 ?? '')) return undefined
  return [...iso2].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('')
}

async function commonsInfo(files) {
  const out = {}
  for (const part of chunk([...new Set(files)], 50)) {
    const form = {
      action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo',
      iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1280',
      iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|Credit|AttributionRequired|UsageTerms',
      titles: part.map((f) => 'File:' + f).join('|'),
    }
    const json = await getJson('https://commons.wikimedia.org/w/api.php', { refresh, form })
    const norm = Object.fromEntries((json.query.normalized ?? []).map((n) => [n.to, n.from]))
    for (const p of json.query.pages) {
      const from = (norm[p.title] ?? p.title).replace(/^File:/, '')
      out[from] = p
    }
  }
  return out
}

async function wikitexts(lang, titles) {
  const out = {}
  for (const part of chunk([...new Set(titles)], 20)) {
    const form = {
      action: 'query', format: 'json', formatversion: '2', prop: 'revisions',
      rvprop: 'content', rvslots: 'main', redirects: '1', titles: part.join('|'),
    }
    const json = await getJson(`https://${lang}.wikipedia.org/w/api.php`, { refresh, form })
    const back = {}
    for (const n of [...(json.query.normalized ?? []), ...(json.query.redirects ?? [])]) back[n.to] = back[n.from] ?? n.from
    for (const p of json.query.pages) {
      const content = p.revisions?.[0]?.slots?.main?.content
      if (content) out[back[p.title] ?? p.title] = out[p.title] = content
    }
  }
  return out
}

// Wikimedia asks automated clients to download thumbnails in its standard widths
// (https://w.wiki/GHai) rather than original files, and rate-limits originals hard.
// Pick the largest standard width the original can provide, preferring >= 960px.
const STANDARD_WIDTHS = [1280, 960, 500, 330]

function thumbUrl(ii, maxWidth = Infinity) {
  const width = STANDARD_WIDTHS.find((w) => w < ii.width && w <= maxWidth) ?? STANDARD_WIDTHS.at(-1)
  // https://upload.wikimedia.org/wikipedia/commons/a/ab/Name.jpg
  //   -> https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Name.jpg/960px-Name.jpg
  const m = ii.url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/(\w\/\w\w)\/([^/?]+)/)
  if (!m) throw new Error(`Unexpected Commons URL ${ii.url}`)
  const [, base, hash, name] = m
  const ext = /\.(tiff?|webp)$/i.test(name) ? '.jpg' : ''
  return `${base}/thumb/${hash}/${name}/${width}px-${name}${ext}`
}

const downloadPhoto = (ii) => getBinary(thumbUrl(ii), { refresh })

async function makeImages(slug, buf, crop) {
  await mkdir(DOGS_DIR, { recursive: true })
  const large = sharp(buf).rotate().resize({ width: LARGE_WIDTH, withoutEnlargement: true })
  const info = await large.webp({ quality: 78 }).toFile(path.join(DOGS_DIR, `${slug}.webp`))
  let thumb = sharp(await sharp(buf).rotate().toBuffer())
  if (crop && typeof crop === 'object') {
    // focal point: { x, y } centre of the dog's head as fractions of width/height,
    // size = side of the square as a fraction of the shorter image side (default 0.9)
    const { width: w, height: h } = await thumb.metadata()
    const side = Math.round(Math.min(w, h) * (crop.size ?? 0.9))
    const left = Math.min(Math.max(Math.round(crop.x * w - side / 2), 0), w - side)
    const top = Math.min(Math.max(Math.round(crop.y * h - side / 2), 0), h - side)
    thumb = thumb.extract({ left, top, width: side, height: side }).resize(THUMB_SIZE, THUMB_SIZE)
  } else {
    thumb = thumb.resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: crop ?? sharp.strategy.attention })
  }
  await thumb.webp({ quality: 80 }).toFile(path.join(DOGS_DIR, `${slug}-thumb.webp`))
  return { width: info.width, height: info.height }
}

// ---------------------------------------------------------------- build
// size group from the middle of the sourced weight range (kg), unless content sets "size"
const SIZE_BY_WEIGHT = [[11, 'small'], [25, 'medium'], [45, 'large'], [Infinity, 'giant']]

async function build() {
  const breeds = await readBatches()
  console.log(`${breeds.length} breeds in batches`)
  const content = {}
  for (const b of breeds) {
    const file = path.join(CONTENT_DIR, `${b.slug}.json`)
    if (await exists(file)) content[b.slug] = JSON.parse(await readFile(file, 'utf8'))
  }

  console.log('Wikidata…')
  const entities = await wbEntities(breeds.map((b) => b.qid), 'labels|claims|sitelinks')
  const countryIds = breeds.flatMap((b) => claimValues(entities[b.qid], 'P495').map((v) => v.id))
  const countries = await wbEntities(countryIds, 'labels|claims')

  for (const b of breeds) {
    const e = entities[b.qid]
    b.heTitle = e.sitelinks?.hewiki?.title
    b.enTitle = e.sitelinks?.enwiki?.title
    b.labelHe = e.labels?.he?.value
    b.labelEn = e.labels?.en?.value
    b.photoFile = (content[b.slug]?.photo ?? claimValues(e, 'P18')[0])?.replace(/^File:/, '').replace(/_/g, ' ')
    b.origin = claimValues(e, 'P495').map((v) => {
      const c = countries[v.id]
      return { qid: v.id, nameHe: c?.labels?.he?.value, flag: flagEmoji(claimValues(c ?? {}, 'P297')[0]) }
    }).filter((o) => o.nameHe)
  }

  console.log('Wikipedia…')
  const he = await wikitexts('he', breeds.map((b) => b.heTitle).filter(Boolean))
  const en = await wikitexts('en', breeds.map((b) => b.enTitle).filter(Boolean))
  await mkdir(SOURCES_DIR, { recursive: true })
  for (const b of breeds) {
    const enText = en[b.enTitle] ?? ''
    b.infobox = parseInfobox(enText, 'Infobox dog breed')
    const notes = [
      `# ${b.labelHe} / ${b.labelEn} (${b.qid})`,
      `Origin (Wikidata P495): ${b.origin.map((o) => `${o.flag ?? ''} ${o.nameHe}`).join(', ') || '—'}`,
      `Photo: ${b.photoFile ?? '—'}`,
      '', '## en infobox', JSON.stringify(b.infobox, null, 1),
      '', `## he: ${b.heTitle}`, wikitextToPlain(he[b.heTitle] ?? ''),
      '', `## en: ${b.enTitle}`, wikitextToPlain(enText),
    ]
    await writeFile(path.join(SOURCES_DIR, `${b.slug}.md`), notes.join('\n'))
  }

  console.log('Commons…')
  const info = await commonsInfo(breeds.map((b) => b.photoFile).filter(Boolean))
  const problems = []
  const out = []
  for (const b of breeds) {
    const c = content[b.slug]
    if (!c) { problems.push(`${b.slug}: no scripts/content/${b.slug}.json yet (source notes in scripts/.cache/sources/)`); continue }
    const page = info[b.photoFile]
    const ii = page?.imageinfo?.[0]
    if (!ii) { problems.push(`${b.slug}: photo "${b.photoFile}" not found on Commons`); continue }
    const md = ii.extmetadata ?? {}
    const license = stripHtml(md.LicenseShortName?.value)
    if (!FREE_LICENSE.test(license)) { problems.push(`${b.slug}: photo license "${license}" not recognised as free`); continue }
    const largeFile = path.join(DOGS_DIR, `${b.slug}.webp`)
    const meta = path.join(DOGS_DIR, `${b.slug}.json`)
    let dims
    const prev = (await exists(meta)) ? JSON.parse(await readFile(meta, 'utf8')) : null
    if (!refresh && prev?.file === b.photoFile && JSON.stringify(prev?.crop ?? null) === JSON.stringify(c.thumbCrop ?? null) && await exists(largeFile)) {
      dims = prev.dims
    } else {
      console.log(`  image ${b.slug}`)
      try {
        dims = await makeImages(b.slug, await downloadPhoto(ii), c.thumbCrop)
      } catch (err) {
        problems.push(`${b.slug}: photo download failed (${err.message})`)
        continue
      }
      await writeFile(meta, JSON.stringify({ file: b.photoFile, crop: c.thumbCrop ?? null, dims }) + '\n')
    }
    const weightMid = c.weightKg ? (c.weightKg[0] + c.weightKg[1]) / 2 : undefined
    const size = c.size
      ? [c.size].flat()
      : weightMid ? [SIZE_BY_WEIGHT.find(([max]) => weightMid < max)[1]] : undefined
    const sources = []
    if (b.heTitle) sources.push(`https://he.wikipedia.org/wiki/${encodeURIComponent(b.heTitle.replace(/ /g, '_'))}`)
    if (b.enTitle && c.usedEnglish !== false) sources.push(`https://en.wikipedia.org/wiki/${encodeURIComponent(b.enTitle.replace(/ /g, '_'))}`)
    sources.push(`https://www.wikidata.org/wiki/${b.qid}`)
    out.push(clean({
      id: b.slug,
      qid: b.qid,
      nameHe: c.nameHe ?? b.labelHe,
      nameEn: b.labelEn,
      origin: c.origin ?? (b.origin.length ? b.origin.map(({ nameHe, flag }) => clean({ nameHe, flag })) : undefined),
      size,
      heightCm: c.heightCm,
      weightKg: c.weightKg,
      lifeYears: c.lifeYears,
      coat: c.coat,
      colors: c.colors,
      temperament: c.temperament,
      energy: c.energy,
      kids: c.kids,
      grooming: c.grooming,
      history: c.history,
      funFacts: c.funFacts?.length ? c.funFacts : undefined,
      photo: { large: `dogs/${b.slug}.webp`, thumb: `dogs/${b.slug}-thumb.webp`, ...dims },
      credit: clean({
        file: b.photoFile,
        author: stripHtml(md.Artist?.value) || stripHtml(md.Credit?.value) || 'לא צוין',
        license,
        licenseUrl: md.LicenseUrl?.value,
        sourceUrl: ii.descriptionurl,
      }),
      sources,
    }))
  }

  out.sort((a, b) => a.nameHe.localeCompare(b.nameHe, 'he'))
  const header = `// GENERATED by scripts/build-breeds.mjs — do not edit by hand.
// Edit scripts/content/<id>.json or scripts/batches/*.json and run \`npm run data\`.
import type { Breed } from './types'

export const breeds: Breed[] = `
  await writeFile(OUT_FILE, header + JSON.stringify(out, null, 2) + '\n')
  console.log(`\nWrote ${out.length} breeds to ${path.relative(ROOT, OUT_FILE)}`)
  if (problems.length) console.log(`\nSkipped ${problems.length}:\n  ` + problems.join('\n  '))
}

function clean(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''))
}

// ---------------------------------------------------------------- photo candidates
async function photos(slugs) {
  const breeds = (await readBatches()).filter((b) => slugs.includes(b.slug))
  if (!breeds.length) throw new Error('Give one or more slugs from scripts/batches/')
  const entities = await wbEntities(breeds.map((b) => b.qid), 'sitelinks')
  for (const b of breeds) {
    const files = new Set()
    for (const [lang, key] of [['en', 'enwiki'], ['he', 'hewiki']]) {
      const title = entities[b.qid].sitelinks?.[key]?.title
      if (!title) continue
      const form = { action: 'query', format: 'json', formatversion: '2', prop: 'images', imlimit: '100', titles: title }
      const json = await getJson(`https://${lang}.wikipedia.org/w/api.php`, { form })
      for (const im of json.query.pages[0]?.images ?? []) {
        const name = im.title.replace(/^[^:]+:/, '')
        if (/\.(jpe?g|png|webp)$/i.test(name) && !/logo|icon|flag|map|svg/i.test(name)) files.add(name)
      }
    }
    const info = await commonsInfo([...files])
    const dir = path.join(ROOT, 'scripts', '.cache', 'photos', b.slug)
    await mkdir(dir, { recursive: true })
    console.log(`\n${b.slug}:`)
    let n = 0
    for (const [file, page] of Object.entries(info)) {
      const ii = page.imageinfo?.[0]
      if (!ii) continue
      const license = stripHtml(ii.extmetadata?.LicenseShortName?.value)
      // only photos big enough for the ~1000px large version
      if (!FREE_LICENSE.test(license) || ii.width < 1000) continue
      const preview = path.join(dir, `${String(++n).padStart(2, '0')}.jpg`)
      const buf = await getBinary(thumbUrl(ii, 330))
      await sharp(buf).rotate().jpeg().toFile(preview)
      const author = stripHtml(ii.extmetadata?.Artist?.value).slice(0, 40)
      console.log(`  ${path.basename(preview)}  ${ii.width}×${ii.height}  ${license}  ${author}  "${file}"`)
    }
  }
}

if (command === 'candidates') await candidates()
else if (command === 'photos') await photos(args.filter((a) => !a.startsWith('--')).slice(1))
else await build()
