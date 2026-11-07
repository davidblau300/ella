#!/usr/bin/env node
// Refreshes the after-school activities pool (src/data/activities.ts) from its sources.
//
//   npm run activities              re-check every source and rewrite src/data/activities.ts
//   npm run activities -- --cached  use the HTTP cache in scripts/.cache/ (for development)
//
// What it does (see CLAUDE.md > "Refresh activities"):
// - Downloads the Tel Aviv municipality's public activity list (the data behind
//   https://www.tel-aviv.gov.il/Residents/CommunityAndSports/Pages/CommunityClasses.aspx)
//   and fills in times, grades and prices for each curated entry in
//   scripts/activities/pool.json by its municipal activity codes.
// - Re-checks the other source pages (museum page, youth-movement table) for the
//   phrases recorded in pool.json.
// - Drops entries whose codes or phrases are gone, and prints them.
// - Prints NEW candidates: activities at the area's centres whose grades include
//   3rd or 4th grade and that are not in the pool yet, for a person to review.
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getText } from './lib/http.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const POOL_FILE = path.join(ROOT, 'scripts', 'activities', 'pool.json')
const CENTERS_FILE = path.join(ROOT, 'scripts', 'activities', 'centers.json')
const OUT_FILE = path.join(ROOT, 'src', 'data', 'activities.ts')

const TLV_API = 'https://www.tel-aviv.gov.il/_vti_bin/TlvSP2013PublicSite/TlvListUtils.svc/GetActivities/false/'
const TLV_LISTING = 'https://www.tel-aviv.gov.il/Residents/CommunityAndSports/Pages/CommunityClasses.aspx'
const TLV_TABLES = 'https://www.tel-aviv.gov.il/_vti_bin/TlvSP2013PublicSite/TlvList.svc/GetTables'
// the youth-movement contact table on YouthMovements.aspx (ids copied from the page's own request)
const SCOUTS_TABLE_BODY = JSON.stringify({
  dataSource: {
    Fields: null, ItemdIds: [], ListContentTypes: ['סוג תוכן למרכזי שירות'],
    ListId: 'd6edefe7-0e62-4b5e-a141-4851f7a1ac6d', SiteId: '24aa409e-01ed-482e-b0ed-1956972addb1',
    ViewId: 'fed57653-c354-46b9-b1a5-e28297d3a883', WebId: '3af57d92-807c-43c5-8d5f-6fd455eb2776',
  },
  dataSrcFullUrl: null, showTitle: true, title: 'שבטי צופים', filters: [], isDigitel: false,
  isTitleOgen: true, itemPageUrl: null, maxColToShow: 6, rowPaging: 7, titleOgen: 'שבטי צופים',
})

const GRADE_LETTERS = { 201: 'א', 202: 'ב', 203: 'ג', 204: 'ד', 205: 'ה', 206: 'ו' }
const TARGET_GRADES = ['203', '204'] // 3rd and 4th grade

const refresh = !process.argv.includes('--cached')
const today = new Date().toISOString().slice(0, 10)

/** "כיתות ג'–ה'" / "כיתה ד'" / "כיתות ד'–ו' ונוער" from municipal audience codes */
export function formatGrades(codes) {
  const nums = [...new Set(codes)].filter((c) => GRADE_LETTERS[c]).map(Number).sort((a, b) => a - b)
  const teens = codes.includes('301')
  if (!nums.length) return teens ? 'נוער' : ''
  const letter = (n) => `${GRADE_LETTERS[n]}'`
  const contiguous = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1)
  let text
  if (nums.length === 1) text = `כיתה ${letter(nums[0])}`
  else if (contiguous) text = `כיתות ${letter(nums[0])}–${letter(nums.at(-1))}`
  else text = `כיתות ${nums.map(letter).join(', ')}`
  return teens ? `${text} ונוער` : text
}

const weeklyTimes = (a) =>
  (a.WeeklyTimes ?? []).map((w) => JSON.parse(w)).sort((x, y) => x.dayIndex - y.dayIndex)
    .map((w) => `${w.Value} ${w.new_from}–${w.new_to}`)

function formatPrice(prices) {
  const p = [...new Set(prices.filter((x) => x > 0))].sort((a, b) => a - b)
  if (!p.length) return undefined
  const n = (x) => x.toLocaleString('en-US')
  const range = p.length === 1 ? `${n(p[0])} ש"ח` : `${n(p[0])}–${n(p.at(-1))} ש"ח (לפי סוג השיעור)`
  return `${range}. המחיר כפי שמופיע במערכת הרישום העירונית; לא צוין שם אם הוא לחודש או לתקופה אחרת.`
}

async function main() {
  const poolFile = JSON.parse(await readFile(POOL_FILE, 'utf8'))
  const pool = poolFile.activities
  const ignored = new Set((poolFile.ignored ?? []).map((x) => x.code))
  const centers = JSON.parse(await readFile(CENTERS_FILE, 'utf8'))
  const problems = []

  console.log('Municipal activity list…')
  const raw = JSON.parse(await getText(TLV_API, { refresh }))
  const tlv = typeof raw === 'string' ? JSON.parse(raw) : raw
  const byCode = new Map(tlv.Activities.map((a) => [a.ActivityCode, a]))
  console.log(`  ${tlv.Activities.length} activities city-wide`)

  console.log('Centre pages…')
  for (const [code, c] of Object.entries(centers)) {
    if (code.startsWith('_')) continue
    const html = await getText(c.pageUrl, { refresh })
    if (!html.includes(c.check)) problems.push(`centre ${code} (${c.nameHe}): "${c.check}" no longer on ${c.pageUrl}; re-read the page`)
  }

  let scoutsTable
  const out = []
  const dropped = []
  for (const entry of pool) {
    const s = entry.source
    const base = { id: entry.id, nameHe: entry.nameHe, category: entry.category, description: entry.description }
    if (s.type === 'tlv') {
      const center = centers[s.institute]
      const found = s.codes.map((c) => byCode.get(c)).filter(Boolean)
        .filter((a) => a.Institute.InstituteCode === s.institute)
        .filter((a) => (a.AudienceTargets ?? []).some((t) => TARGET_GRADES.includes(t.AudienceCode)))
      const missing = s.codes.filter((c) => !found.some((a) => a.ActivityCode === c))
      if (!found.length) { dropped.push(`${entry.id}: none of its codes are listed any more (${s.codes.join(', ')})`); continue }
      if (missing.length) console.log(`  note: ${entry.id}: codes no longer listed or no longer for grades 3-4: ${missing.join(', ')}`)
      // one line per distinct day+time; groups with the same time are merged and their grades combined
      const byTime = new Map()
      for (const a of found) {
        for (const t of weeklyTimes(a)) {
          byTime.set(t, [...(byTime.get(t) ?? []), ...(a.AudienceTargets ?? []).map((x) => x.AudienceCode)])
        }
      }
      const dayOrder = (t) => "אבגדהוש".indexOf(t.match(/יום (.)/)?.[1] ?? 'ש')
      const times = [...byTime].map(([text, codes]) => ({ text, grades: formatGrades(codes) }))
        .sort((x, y) => dayOrder(x.text) - dayOrder(y.text) || x.text.localeCompare(y.text))
      out.push(clean({
        ...base,
        place: entry.place ?? center.nameHe,
        neighborhood: center.neighborhood,
        address: entry.place ? undefined : center.address,
        grades: formatGrades(found.flatMap((a) => (a.AudienceTargets ?? []).map((t) => t.AudienceCode))),
        times,
        organizer: entry.place ? `${center.nameHe} (החוג מתקיים ב${entry.place})` : center.nameHe,
        phone: center.phone,
        website: center.pageUrl,
        price: formatPrice(found.map((a) => a.Price)),
        sourceUrl: TLV_LISTING,
        sourceRef: `קוד פעילות במערכת העירונית: ${found.map((a) => a.ActivityCode).join(', ')}`,
        checkedOn: today,
      }))
    } else if (s.type === 'page' || s.type === 'tlvTable') {
      let text
      if (s.type === 'page') text = await getText(s.url, { refresh })
      else {
        scoutsTable ??= await getText(TLV_TABLES, {
          refresh,
          body: SCOUTS_TABLE_BODY,
          headers: { 'Content-Type': 'application/json;charset=UTF-8', Accept: 'application/json; odata=verbose', Referer: s.url },
        })
        text = scoutsTable.includes(s.row) ? scoutsTable : ''
      }
      const lost = s.check.filter((phrase) => !text.includes(phrase))
      if (lost.length) { dropped.push(`${entry.id}: "${lost.join('", "')}" no longer on ${s.url}`); continue }
      const f = s.fields
      out.push(clean({
        ...base,
        place: f.placeHe,
        neighborhood: f.neighborhood,
        address: f.address,
        grades: f.grades.length === 1 ? `${f.grades[0].replace('כיתה', 'מכיתה')}` : `כיתות ${f.grades.map((g) => g.replace('כיתה ', '')).join('–')}`,
        gradesNote: f.gradesNote,
        times: f.times ?? [],
        organizer: f.organizer,
        phone: f.phone,
        website: f.website,
        price: f.price,
        sourceUrl: s.url,
        checkedOn: today,
      }))
    }
  }

  // new candidates: area activities for grades 3-4 that the pool does not mention
  const known = new Set(pool.flatMap((e) => e.source.codes ?? []))
  const candidates = tlv.Activities.filter((a) => centers[a.Institute.InstituteCode]
    && !known.has(a.ActivityCode) && !ignored.has(a.ActivityCode)
    && (a.AudienceTargets ?? []).some((t) => TARGET_GRADES.includes(t.AudienceCode)))

  const header = `// GENERATED by scripts/build-activities.mjs — do not edit by hand.
// Edit scripts/activities/pool.json or centers.json and run \`npm run activities\`.
import type { Activity } from './types'

/** date of the last full refresh of the pool (shown on the parents' screen) */
export const activitiesRefreshedOn = '${today}'

export const activities: Activity[] = `
  await writeFile(OUT_FILE, header + JSON.stringify(out, null, 2) + '\n')
  console.log(`\nWrote ${out.length} activities to ${path.relative(ROOT, OUT_FILE)}`)
  if (dropped.length) console.log(`\nDropped ${dropped.length} (no longer listed):\n  ${dropped.join('\n  ')}`)
  if (problems.length) console.log(`\nCheck by hand:\n  ${problems.join('\n  ')}`)
  if (candidates.length) {
    console.log(`\n${candidates.length} listed activities for grades 3-4 at these centres are not in the pool (review, then add to pool.json "activities" or to "ignored" with a reason):`)
    for (const a of candidates) {
      console.log(`  ${a.ActivityCode}  ${a.Institute.InstituteName}  ${a.ActivityName}  [${formatGrades(a.AudienceTargets.map((t) => t.AudienceCode))}]  ${weeklyTimes(a).join('; ')}`)
    }
  }
}

function clean(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''))
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
