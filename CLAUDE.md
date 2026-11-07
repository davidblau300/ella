# Ella: dog breeds app

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
- At runtime: no external links, ads, analytics, cookies, sign-ups or network calls.
  Nothing is stored about the user. The font (Rubik, `@fontsource/rubik`) is bundled locally.

## Content rules

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
- `scripts/build-breeds.mjs`: fetches Wikidata/Wikipedia/Commons, makes the images and
  writes `src/data/breeds.ts`. Polite: one request at a time with a pause between
  requests (longer for the image host), a 30s timeout on every request,
  Retry-After-aware back-off, a descriptive User-Agent with no personal email, and an
  HTTP cache in `scripts/.cache/` (git-ignored) so re-runs don't refetch.

## Commands

```bash
npm install
npm run dev          # local dev server
npm test             # Vitest: data checks + Hebrew search
npm run build        # type-check + production build into dist/ (Vercel uses this)
npm run data         # fetch sources/photos and regenerate src/data/breeds.ts
npm run data -- candidates   # breeds with a Hebrew Wikipedia article not yet in a batch
npm run data -- photos <slug>   # list free photos from the breed's articles, previews in scripts/.cache/photos/
npm run data -- --refresh    # ignore the HTTP cache
node scripts/make-icons.mjs  # re-render PWA icons from public/favicon.svg
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
