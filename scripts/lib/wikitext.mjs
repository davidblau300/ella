// Rough wikitext helpers, good enough to read article text while writing
// the Hebrew content and to pull fields out of an infobox.

/** Find the end index of a {{…}} block that starts at `start`. */
function templateEnd(text, start) {
  let depth = 0
  for (let i = start; i < text.length - 1; i++) {
    if (text[i] === '{' && text[i + 1] === '{') { depth++; i++ }
    else if (text[i] === '}' && text[i + 1] === '}') { depth--; i++; if (depth === 0) return i + 1 }
  }
  return text.length
}

function removeTemplates(text) {
  let out = ''
  let i = 0
  while (i < text.length) {
    const j = text.indexOf('{{', i)
    if (j === -1) { out += text.slice(i); break }
    out += text.slice(i, j)
    const end = templateEnd(text, j)
    const inner = text.slice(j + 2, end - 2)
    // keep the visible value of a few inline templates (convert, lang, nowrap…)
    const p = inner.split('|').map((s) => s.trim())
    if (/^(convert|cvt)$/i.test(p[0])) {
      out += ['-', '–', 'to', 'and', 'or'].includes(p[2]) ? `${p[1]}–${p[3]} ${p[4]}` : `${p[1]} ${p[2]}`
    } else {
      const k = inner.match(/^\s*(lang|nowrap|transl|small|langx)\s*\|(?:[^|]*\|)?([^|]*)$/i)
      if (k) out += k[2]
    }
    i = end
  }
  return out
}

export function wikitextToPlain(text) {
  return removeTemplates(
    text
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<ref[^>/]*\/>/g, '')
      .replace(/<ref[\s\S]*?<\/ref>/g, ''),
  )
    .replace(/\{\|[\s\S]*?\|\}/g, '')
    .replace(/\[\[(?:File|Image|קובץ|תמונה):(?:[^[\]]|\[\[[^\]]*\]\])*\]\]/gi, '')
    .replace(/\[\[(?:Category|קטגוריה):[^\]]*\]\]/gi, '')
    .replace(/\[\[[a-z-]{2,12}:[^\]]*\]\]/g, '')
    .replace(/\[\[([^|\]]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/\[https?:[^\s\]]+ ([^\]]*)\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Return {field: plain value} for the first template named `name`. */
export function parseInfobox(text, name) {
  const re = new RegExp(`\\{\\{\\s*${name.replace(/ /g, '[ _]')}`, 'i')
  const m = re.exec(text)
  if (!m) return {}
  const body = text.slice(m.index + 2, templateEnd(text, m.index) - 2)
  // split on top-level pipes
  const parts = []
  let depth = 0, cur = ''
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2)
    if (two === '{{' || two === '[[') { depth++; cur += two; i++; continue }
    if (two === '}}' || two === ']]') { depth--; cur += two; i++; continue }
    if (body[i] === '|' && depth === 0) { parts.push(cur); cur = ''; continue }
    cur += body[i]
  }
  parts.push(cur)
  const out = {}
  for (const p of parts.slice(1)) {
    const eq = p.indexOf('=')
    if (eq === -1) continue
    const key = p.slice(0, eq).trim()
    const val = wikitextToPlain(p.slice(eq + 1)).replace(/\s+/g, ' ').trim()
    if (val && !/image|caption|altname|nickname|fci|akc|ckc|ukc|kc_|nzkc|ankc|^note/i.test(key)) out[key] = val
  }
  return out
}
