# Ella — dog breeds (in Hebrew)

A small offline web app for a 9-year-old Hebrew reader: a searchable list of dog
breeds, each with a big photo and simple Hebrew facts (origin, size, height and
weight, life span, coat, character, energy, how good with kids, grooming,
history and fun facts).

- Everything is in Hebrew and right-to-left; built for touch on phones and tablets.
- Static site (Vite + React + TypeScript), installable as a PWA that works offline.
- No backend, no external links, no analytics, no cookies, nothing stored.
- Facts come from Wikidata and Wikipedia (Hebrew and English); photos come from
  Wikimedia Commons under free licenses, credited on the "about" page.

```bash
npm install
npm run dev      # local dev server
npm test         # tests
npm run build    # production build into dist/
npm run data     # re-fetch data and photos (see CLAUDE.md)
```
