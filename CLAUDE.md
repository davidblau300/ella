# Ella: dog breeds and after-school activities app

## Git workflow (every session follows this)

- Work directly on `main`. No branches, no pull requests.
- After every working change: run the tests and the build, then commit and push to `main`
  (`git push -u origin main`).
- Never push when `npm test` or `npm run build` fails.
- No AI attribution lines in commits or PRs (`.claude/settings.json` turns them off).

## Who it's for

A 9-year-old girl who reads only Hebrew. She uses it by touch on a phone or tablet,
sometimes on a computer.

- Every word she sees is Hebrew. The layout is right-to-left (`<html lang="he" dir="rtl">`).
- Any text that speaks to the reader uses **feminine singular** ("חפשי", "נסי").
- Simple words a 9-year-old reads easily. Plain Hebrew, **no nikud**.
- Body text at least 18px, tap targets at least 48px.
- At runtime: no ads, analytics, cookies, sign-ups or network calls. Kid-facing screens
  have no external links; links (phone, websites, sources) exist only on the parents'
  screen behind the parent gate. The font (Rubik, `@fontsource/rubik`) is bundled locally.
- The only things stored are on the device (localStorage): her pinned activities
  (`ella.activityPins.v1`, with a copy of each pinned activity) and the weekly rotation
  state (`ella.activityRotation.v1`). Nothing leaves the device.

## App structure

- Home page (`#/`, also the PWA start URL): two big tiles, "כלבים" and "חוגים".
  Every section has a way back home (home button / back buttons).
- Dogs: `#/dogs` list, `#/breed/<id>` breed page, `#/about` photo credits (parents).
- Activities: `#/activities` list, `#/activity/<id>` detail, `#/parents[/<id>]`
  parents' screen behind `ParentGate` (multiply two numbers between 12 and 19; unlocked
  until the app reloads).
- Activities list: pinned (heart) activities first, never replaced; then 6 unpinned ones
  from the pool, re-chosen every Sunday, preferring ones she hasn't seen recently
  (`src/lib/rotation.ts`, pure and tested). A pinned activity that leaves the pool stays
  visible from its saved copy and is marked "לא מופיע יותר ברשימות" on the parents' screen.

## Tablet, install and hosting

- Main device: a tablet, in portrait and landscape (also phones and computers).
  Landscape tablets show breeds in two columns (three on wide screens) and the breed
  page side by side (photo + facts). Check both orientations after layout changes.
- Installable PWA: manifest name "Ella", `display: standalone`, `orientation: any`.
  Icons in `public/icons/` (Android/manifest 48–512, maskable 192/512, Apple touch
  120/152/167/180) plus `public/apple-touch-icon.png`, all rendered from
  `public/favicon.svg` by `node scripts/make-icons.mjs`.
- Fully offline after the first open: the service worker precaches the app shell,
  fonts, icons and every breed photo and thumbnail. `npm run build` ends with
  `scripts/check-precache.mjs`, which fails the build if any photo is not precached.
- Automatic updates (`src/pwa.ts`, `src/lib/updatePolicy.ts`): the service worker is in
  `prompt` mode. A new deploy downloads fully in the background (checked on open, every
  hour, and whenever the app returns to the foreground). It switches (reload, same screen)
  right away on the home page, otherwise the next time the app opens or comes back from the
  background, or when she goes home. Never reload mid-screen. The build date and time
  (`__BUILD_TIME__`, Israel time) is shown on the parents' screen.
- Hosting: Vercel, deploying from `main` (`vercel.json`: Vite build to `dist/`, an
  index.html fallback rewrite, no-cache headers for the service worker,
  `X-Robots-Tag: noindex`). Routing is hash-based (`#/breed/<id>`, `#/about`).
- Kept out of search engines: `<meta name="robots" content="noindex, nofollow">`,
  `public/robots.txt` disallows everything, plus the `X-Robots-Tag` header.

## Activities content rules

- Real activities in the Ramat Aviv area (Ramat Aviv, Ramat Aviv Gimel, Neve Avivim,
  Afeka, Tzukei Aviv and nearby) whose **published** grades include 3rd or 4th grade.
- Every entry comes from a source page that was actually read. Never invent an activity or
  a detail; if days, times, grades or price aren't published, leave them out.
- `nameHe` and `description` are short, kid-friendly Hebrew written by hand from the
  source. Times, grades, prices and contact details come from the source via the script.
- Municipal prices are shown as published in the municipal registration system, which
  does not say whether they are monthly; don't add a period.

## Content rules (dogs)

- Facts come from sources and are never invented. Sources: Wikidata (breed list, Hebrew
  labels, origin, image), Hebrew Wikipedia, English Wikipedia where the Hebrew article
  lacks detail, and Wikimedia Commons (photos with author and license).
- The Hebrew text is written by hand from those sources (not machine-copied).
- If a fact isn't in the sources, leave that field out. Don't guess.
- Kid-friendly: tell sad or violent history (fighting dogs, wars) gently and briefly, or skip it.
- Ratings (`energy`, `kids`, `grooming`, 1–5 paws) are only set when the sources describe
  that trait (e.g. "very energetic", "good with children", "needs daily brushing").
- Life expectancy: use a range when the sources give one; when they only give an average
  from studies, use a single value `[x, x]` (shown as "בערך x שנים").
- Size group: set `size` in the content file when the sources name it ("small breed",
  "giant"), or when a breed spans several sizes (poodle: `["small","medium","large"]`).
  Otherwise the script derives it from the middle of `weightKg`:
  under 11 kg small, under 25 medium, under 45 large, otherwise giant.
- One clear, freely licensed Commons photo per breed: author, license and source page
  are recorded and shown on the "about" page (for parents).

## Project layout

- `src/data/breeds.ts`: **generated** breed data (one typed file). Don't edit by hand.
- `src/data/types.ts`: the `Breed` type.
- `src/lib/search.ts`: Hebrew search (final letters = regular letters, ignores nikud,
  geresh, spaces and hyphens) and Hebrew sorting.
- `public/dogs/<id>.webp` (about 1000px wide) and `public/dogs/<id>-thumb.webp`
  (160×160, round icon in the list). `public/dogs/<id>.json` records which Commons
  file the images came from.
- `scripts/batches/batch-NN.json`: which breeds are in the app (`qid` + `slug`).
- `scripts/content/<slug>.json`: the hand-written Hebrew text and sourced numbers.
- `src/data/activities.ts`: **generated** activities pool + `activitiesRefreshedOn`.
- `scripts/activities/pool.json`: curated activities (hand-written Hebrew text + source
  reference: municipal activity codes, or a page URL with phrases to re-check) and
  `ignored` municipal codes with the reason they were left out.
- `scripts/activities/centers.json`: the area's municipal centres (name, neighbourhood,
  address, phone, page), read from each centre's page on tel-aviv.gov.il.
- `scripts/build-activities.mjs`: refreshes the activities pool (see below).
- `scripts/build-breeds.mjs`: fetches Wikidata/Wikipedia/Commons, makes the images and
  writes `src/data/breeds.ts`. Polite: one request at a time with a pause between
  requests (longer for the image host), a 30s timeout on every request,
  Retry-After-aware back-off, a descriptive User-Agent with no personal email, and an
  HTTP cache in `scripts/.cache/` (git-ignored) so re-runs don't refetch.

## Commands

```bash
npm install
npm run dev          # local dev server
npm test             # Vitest: breed + activity data, search, rotation, pins, parent gate
npm run build        # type-check + production build into dist/ + offline precache check (Vercel uses this)
npm run data         # fetch sources/photos and regenerate src/data/breeds.ts
npm run data -- candidates   # breeds with a Hebrew Wikipedia article not yet in a batch
npm run data -- photos <slug>   # list free photos from the breed's articles, previews in scripts/.cache/photos/
npm run data -- --refresh    # ignore the HTTP cache
node scripts/make-icons.mjs  # re-render PWA icons from public/favicon.svg
npm run activities           # refresh activities from their sources (see "Refresh activities")
```

The data script needs network access to `query.wikidata.org`, `www.wikidata.org`,
`he.wikipedia.org`, `en.wikipedia.org`, `commons.wikimedia.org` and
`upload.wikimedia.org`. Wikimedia rate-limits shared IPs hard (429 with Retry-After,
sometimes 10 minutes); the script waits and continues, so run it in the background.
Photos are always downloaded as Commons thumbnails in Wikimedia's standard widths
(1280/960/500/330, see https://w.wiki/GHai), never as original files: originals get
an IP-wide 429 lasting 10 minutes.

## Adding the next batch of breeds

1. `npm run data -- candidates` lists breeds with a Hebrew Wikipedia article that are
   not in any batch, best-known (most Wikipedia sitelinks) first. Some breeds lack the
   "dog breed" statement on Wikidata (the Pomeranian, Q39579, was one), so also check
   well-known breeds by hand and add them by QID.
2. Create `scripts/batches/batch-NN.json` (next number) with about 30 entries:
   `[{ "qid": "Q…", "slug": "english-name-in-kebab-case" }]`.
3. Run `npm run data`. Breeds without a content file are skipped, but their source notes
   are written to `scripts/.cache/sources/<slug>.md`: the Wikidata origin and photo, the
   English infobox, and the Hebrew and English article text.
4. For each breed write `scripts/content/<slug>.json` from those notes, following the
   content rules. All fields are optional; leave out anything the sources don't give:
   ```json
   {
     "nameHe": "only if the Wikidata Hebrew label is not the right display name",
     "origin": [{ "nameHe": "גרמניה", "flag": "🇩🇪" }],
     "photo": "File name on Commons, to override the Wikidata image",
     "photoAuthor": "only if the cleaned-up Commons author text is unreadable",
     "thumbCrop": { "x": 0.3, "y": 0.35, "size": 0.8 },
     "size": "small | medium | large | giant, or an array",
     "heightCm": [55, 65], "weightKg": [22, 40], "lifeYears": [10, 13],
     "coat": "…", "colors": "…", "temperament": "…",
     "energy": 4, "kids": 5, "grooming": 2,
     "history": "…",
     "funFacts": ["…", "…", "…"]
   }
   ```
   `thumbCrop` sets the round list icon: `x`/`y` are the centre of the dog's head as
   fractions of the photo's width/height, `size` the square's side as a fraction of the
   shorter side. Without it, sharp's smart crop is used (often cuts the head off).
   `origin` overrides Wikidata's country of origin. Use it when Wikidata has a historical
   or regional entity without a flag, or lists redundant entries.
5. Run `npm run data` again, then look at every new photo and thumbnail in `public/dogs/`.
   It must be one clear, whole dog of the breed. If not, pick a better freely licensed
   Commons photo (`photo`) and re-run. `npm run data -- photos <slug>` lists the freely
   licensed photos used in the breed's Hebrew and English articles, with previews.
6. `npm test && npm run build`, then commit and push to `main`.

## Refresh activities

Run this every few months (or when asked) to keep the activities pool current.

1. Network: the environment must allow `www.tel-aviv.gov.il` and `www.eretzmuseum.org.il`
   (ask the user to add any new source's domain the same way).
2. `npm run activities`. It:
   - downloads the municipality's public activity list (the JSON behind
     https://www.tel-aviv.gov.il/Residents/CommunityAndSports/Pages/CommunityClasses.aspx,
     endpoint `TlvListUtils.svc/GetActivities/false/`) and fills in times, grades and
     prices for every pool entry by its activity codes, keeping only groups for grades 3–4;
   - re-checks each centre page in `centers.json` and each page source in `pool.json`
     (museum page, youth-movement table) for its recorded phrases;
   - **drops** entries whose codes or phrases are gone (they disappear from the pool; if she
     pinned one, she still sees it and parents see "לא מופיע יותר ברשימות");
   - prints **new candidates**: listed activities at the area's centres for grades 3–4
     that are neither in the pool nor in `ignored`;
   - writes `src/data/activities.ts` with today's date as `activitiesRefreshedOn` and
     `checkedOn` on every entry.
3. Codes change every school year (the municipal codes end in the year, e.g. `…2027…`).
   For each new candidate: read its listing, then add it to `pool.json` (merge groups of
   the same class into one entry, write `nameHe` + `description` from the published
   details) or add the code to `ignored` with a reason (boys only, parent+child, special
   programme, contradictory listing…).
4. To add a non-municipal source (club, museum, youth movement…): read the page, add an
   entry with `source.type: "page"`, its `url`, `check` phrases that prove the activity is
   still listed, and `fields` copied from the page (place, neighbourhood if stated,
   address, organizer, phone, website, grades, times, price).
5. Keep the area to centres whose page (or name) places them in or next to Ramat Aviv;
   aim for a pool of about 40.
6. `npm test && npm run build`, look at `#/activities` and `#/parents`, then commit and push.
