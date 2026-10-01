/**
 * Structural verification of the built site.
 *
 * These are the constraints in the feature document that no compiler enforces: no
 * external font request, every animation neutralised under `prefers-reduced-motion`,
 * `overlay0` never used as a readable text colour, and no client-side JavaScript
 * beyond the view-transition router. Each one is a rule that is easy to break by
 * accident six months from now and impossible to notice by looking at a page.
 *
 * Run against `dist/`, so it checks what actually ships rather than what the source
 * intends. Exits non-zero on the first failure.
 *
 *   node scripts/verify-structure.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, extname } from 'node:path'

const root = process.cwd()
const dist = join(root, 'dist')
const src = join(root, 'src')

const failures = []
const notes = []

function check(name, condition, detail) {
  if (condition) {
    notes.push(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`)
  } else {
    failures.push(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

if (!existsSync(dist)) {
  console.error('dist/ not found. Run `pnpm build` first.')
  process.exit(1)
}

const distFiles = walk(dist)
const htmlFiles = distFiles.filter((f) => extname(f) === '.html')
const cssFiles = distFiles.filter((f) => extname(f) === '.css')
const srcFiles = walk(src)

// The generated palette is inlined per page, so the union of every emitted document
// plus every emitted stylesheet is the right thing to search.
const emitted = [...htmlFiles, ...cssFiles].map((f) => [relative(dist, f), readFileSync(f, 'utf8')])

/* ------------------------------------------------------------------ *
 * 1. No external font request, and no off-origin RESOURCE request
 * ------------------------------------------------------------------ */
const EXTERNAL = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'use.typekit.net',
  'use.fontawesome.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'cdnjs.cloudflare.com',
  'ajax.googleapis.com',
]

// Only attributes that MAKE THE BROWSER FETCH something. An `<a href>` to GitHub or a
// canonical `<link href>` is a hyperlink, not a request, and flagging those would make
// this check cry wolf on the first real outbound link.
const RESOURCE_ATTRS = [
  // src on anything that loads a subresource
  /<(?:script|img|iframe|source|video|audio|embed|object|track)\b[^>]*\bsrc\s*=\s*["'](?:https?:)?\/\/[^"']+["']/gi,
  // href on a <link> that loads a subresource (canonical, sitemap and alternate are not)
  /<link\b(?=[^>]*\brel\s*=\s*["']?(?:stylesheet|preload|modulepreload|preconnect|dns-prefetch|prefetch|icon|apple-touch-icon|manifest)\b)[^>]*\bhref\s*=\s*["'](?:https?:)?\/\/[^"']+["']/gi,
  // srcset on responsive images
  /\bsrcset\s*=\s*["'](?:https?:)?\/\/[^"']+["']/gi,
  // CSS url() and @import
  /url\(\s*["']?(?:https?:)?\/\/[^)"']+["']?\s*\)/gi,
  /@import\s+(?:url\()?\s*["'](?:https?:)?\/\/[^"']+["']/gi,
]

const found = []
for (const [file, text] of emitted) {
  for (const host of EXTERNAL) {
    if (text.includes(host)) found.push(`${file} -> ${host}`)
  }
  for (const pattern of RESOURCE_ATTRS) {
    for (const m of text.matchAll(pattern)) found.push(`${file} -> ${m[0].slice(0, 90)}`)
  }
}
check(
  'no external font or CDN request in the built output',
  found.length === 0,
  found.length ? found.join('; ') : `${emitted.length} emitted files scanned, 0 subresource requests off-origin`,
)

/* ------------------------------------------------------------------ *
 * 2. Every @keyframes is neutralised under prefers-reduced-motion
 * ------------------------------------------------------------------ */
const allCss = cssFiles.map((f) => readFileSync(f, 'utf8')).join('\n')
// Astro may inline the stylesheet into the HTML, so fall back to that too.
const allCssOrHtml = allCss || htmlFiles.map((f) => readFileSync(f, 'utf8')).join('\n')

const keyframes = [...allCssOrHtml.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
const reducedBlock = (() => {
  const i = allCssOrHtml.indexOf('prefers-reduced-motion')
  if (i === -1) return ''
  // Walk braces from the media query to its matching close. The minifier collapses
  // whitespace, so the block has to be found structurally, not by line.
  let depth = 0
  let started = false
  for (let j = i; j < allCssOrHtml.length; j++) {
    if (allCssOrHtml[j] === '{') {
      depth++
      started = true
    } else if (allCssOrHtml[j] === '}') {
      depth--
      if (started && depth === 0) return allCssOrHtml.slice(i, j + 1)
    }
  }
  return allCssOrHtml.slice(i, i + 2000)
})()

check(
  'a prefers-reduced-motion block exists',
  reducedBlock.length > 0,
  reducedBlock.length ? `${reducedBlock.length} bytes` : 'not found',
)
// The minifier rewrites `0.01ms` as `.01ms` and `0ms` as `0s`, so match both spellings.
check(
  'the reduced-motion block kills animations outright',
  /animation:\s*none\s*!important/.test(reducedBlock) &&
    /animation-duration:\s*\.?0\.?0?1ms\s*!important/.test(reducedBlock),
  'contains both `animation: none !important` and the near-zero duration catch-all',
)
check(
  'the reduced-motion block kills view transitions',
  /::view-transition-group\(\*\)/.test(reducedBlock),
  '::view-transition-group(*) targeted by name',
)
check(
  'the scanline drift is disabled under reduced motion',
  /body::?before/.test(reducedBlock),
  `body::before named in the block (keyframes found: ${keyframes.join(', ') || 'none'})`,
)
// The allowlist is the honest way to say "this keyframe is handled, and here is how":
// the named animations are killed by SELECTOR, so the block never has to contain the
// keyframe's own name. A name in this list is a claim that something above names the
// rule it drives, so adding a keyframe without a selector to kill it fails here rather
// than shipping. `caret-blink` left this list when the caret did.
check(
  'every @keyframes declared in the project is reachable from that block',
  keyframes.length === 0 ||
    keyframes.every(
      (name) =>
        ['scanline-drift'].includes(name) || reducedBlock.includes(`.${name}`) || reducedBlock.includes(name),
    ),
  `keyframes: ${keyframes.join(', ')}`,
)

/* ------------------------------------------------------------------ *
 * 3. overlay0 / overlay1 are never used as a readable text colour
 * ------------------------------------------------------------------ */
const offenders = []
const COLOR_PROPS = /(?:^|[;{\s])(color|background-color|border-color|text-decoration-color|outline-color)\s*:\s*([^;}]+)/gi
for (const file of srcFiles) {
  if (extname(file) !== '.css' && extname(file) !== '.astro') continue
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(COLOR_PROPS)) {
    const prop = m[1].toLowerCase()
    const value = m[2]
    if (!/overlay0|overlay1/.test(value)) continue
    // Text-bearing properties are the ones that matter. Borders, outlines and
    // backgrounds are allowed to be decorative.
    if (prop === 'color' || prop === 'text-decoration-color') {
      offenders.push(`${relative(root, file)}: ${prop}: ${value.trim()}`)
    }
  }
}
check(
  'overlay0 / overlay1 are never a text colour in source',
  offenders.length === 0,
  offenders.length ? offenders.join('; ') : `${srcFiles.length} source files scanned`,
)

// And the reverse: the frame/disabled tokens must exist and be documented as non-text.
const tokens = readFileSync(join(src, 'styles', 'tokens.css'), 'utf8')
check(
  '--c-frame and the disabled path resolve to overlay0, and are documented as decorative',
  /--c-frame:\s*var\(--ctp-overlay0\)/.test(tokens) && /decorative/i.test(tokens),
  '--c-frame: var(--ctp-overlay0)',
)

/* ------------------------------------------------------------------ *
 * 4. No client-side JavaScript beyond the view-transition router
 * ------------------------------------------------------------------ */
const scripts = []
for (const [file, text] of emitted.filter(([f]) => f.endsWith('.html'))) {
  for (const m of text.matchAll(/<script\b[^>]*>/gi)) scripts.push({ file, tag: m[0] })
}
const unexpected = scripts.filter((s) => !/ClientRouter/.test(s.tag))
check(
  'the only <script> in the built HTML is the view-transition router',
  scripts.length > 0 && unexpected.length === 0,
  scripts.length
    ? `${scripts.length} script tag(s): ${scripts.map((s) => (s.tag.match(/src="([^"]+)"/) || [, 'inline'])[1]).join(', ')}`
    : 'no script tags found',
)
const islands = emitted.filter(([f]) => f.endsWith('.html')).filter(([, t]) => t.includes('<astro-island'))
check('no framework islands are rendered', islands.length === 0, `${islands.length} documents with islands`)

/* ------------------------------------------------------------------ *
 * 5. The token layer is complete
 * ------------------------------------------------------------------ */
const allHtml = htmlFiles.map((f) => readFileSync(f, 'utf8')).join('\n')
const ctpNames = new Set([...allHtml.matchAll(/--ctp-([a-z0-9]+)\s*:/g)].map((m) => m[1]))
const EXPECTED_26 = [
  'rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon', 'peach', 'yellow', 'green',
  'teal', 'sky', 'sapphire', 'blue', 'lavender',
  'text', 'subtext1', 'subtext0', 'overlay2', 'overlay1', 'overlay0',
  'surface2', 'surface1', 'surface0', 'base', 'mantle', 'crust',
]
const missingColors = EXPECTED_26.filter((n) => !ctpNames.has(n))
check(
  'all 26 Mocha colors are emitted as CSS custom properties',
  missingColors.length === 0,
  `${ctpNames.size}/26 found${missingColors.length ? `, missing: ${missingColors.join(', ')}` : ''}`,
)

const RAMP = ['crust', 'mantle', 'base', 'surface0', 'surface1', 'surface2']
const missingRamp = RAMP.filter((n) => !new RegExp(`--surface-[a-z]+:\\s*var\\(--ctp-${n}\\)`).test(tokens))
check(
  'the full elevation ramp is exposed as surface tokens',
  missingRamp.length === 0,
  missingRamp.length ? `missing: ${missingRamp.join(', ')}` : RAMP.join(' -> '),
)

/* ------------------------------------------------------------------ *
 * 6. Only characters the two font faces can render are used
 * ------------------------------------------------------------------ */
// Outside U+0000-00FF, U+2000-206F and the box-drawing/block blocks, a character
// falls back to an OS font. U+2192 (`->`) and U+2713 (`v`) are the traps.
const SAFE = /^[\t\n\r\x20-\x7E -￿ -⁯←-⇿─-╿▀-▟]*$/
const UNSAFE = []
for (const [file, text] of emitted.filter(([f]) => f.endsWith('.html'))) {
  for (const m of text.matchAll(/>([^<]*)</g)) {
    for (const ch of m[1]) {
      if (ch === '\n' || ch === '\t' || ch === '\r') continue
      if (!SAFE.test(ch)) UNSAFE.push(`${file}: U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} (${ch})`)
    }
  }
}
const uniqueUnsafe = [...new Set(UNSAFE)]
check(
  'no rendered character falls outside the two declared font faces',
  uniqueUnsafe.length === 0,
  uniqueUnsafe.length ? uniqueUnsafe.slice(0, 12).join('; ') : 'all text is covered by the declared unicode-ranges',
)

/* ------------------------------------------------------------------ *
 * 7. The social card exists, is the right size, and is actually referenced
 * ------------------------------------------------------------------ */
// Three separate ways this breaks, none of them visible by looking at a page: the PNG
// is deleted or gitignored, it is replaced by something that is not 1200x630, or
// `Seo.astro` loses the tags. In all three cases the site still builds and still looks
// correct, and the only symptom is a link preview with no image.
const ogPath = join(dist, 'og.png')
const ogExists = existsSync(ogPath)

// Dimensions are read from the PNG IHDR rather than decoded. A PNG header is 8 bytes of
// signature then a length/type chunk, and width and height sit at 16 and 20 as
// big-endian uint32. This is enough to prove the aspect ratio without pulling in an
// image dependency for one assertion.
const ogSize = (() => {
  if (!ogExists) return null
  const buf = readFileSync(ogPath)
  const isPng =
    buf.length > 24 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (!isPng) return { png: false }
  return { png: true, w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), bytes: buf.length }
})()

check(
  'public/og.png ships as a real 1200x630 PNG',
  ogSize?.png === true && ogSize.w === 1200 && ogSize.h === 630,
  ogSize?.png
    ? `${ogSize.w}x${ogSize.h}, ${ogSize.bytes} bytes${ogSize.w !== 1200 || ogSize.h !== 630 ? ' (wrong dimensions)' : ''}`
    : ogExists
      ? 'the file exists but is not a PNG'
      : 'dist/og.png not found',
)

// Every page carries the card, not just the home page, and the URL is absolute.
// A relative `og:image` is not resolved by most crawlers, so it has to be checked too.
const pagesWithCard = htmlFiles.filter((f) =>
  /<meta\s+property="og:image"\s+content="https:\/\/shoking01\.github\.io\/og\.png"/i.test(
    readFileSync(f, 'utf8'),
  ),
)
check(
  'every page declares an absolute og:image pointing at the shipped card',
  htmlFiles.length > 0 && pagesWithCard.length === htmlFiles.length,
  `${pagesWithCard.length}/${htmlFiles.length} pages`,
)

// A card with no declared dimensions makes the preview reflow when the image lands.
const withDims = htmlFiles.filter((f) => {
  const t = readFileSync(f, 'utf8')
  return /og:image:width"\s+content="1200"/i.test(t) && /og:image:height"\s+content="630"/i.test(t)
})
check(
  'every page declares og:image:width and og:image:height',
  htmlFiles.length > 0 && withDims.length === htmlFiles.length,
  `${withDims.length}/${htmlFiles.length} pages`,
)

const largeCard = htmlFiles.filter((f) =>
  /<meta\s+name="twitter:card"\s+content="summary_large_image"/i.test(readFileSync(f, 'utf8')),
)
check(
  'twitter:card is summary_large_image everywhere, matching the card that now exists',
  htmlFiles.length > 0 && largeCard.length === htmlFiles.length,
  `${largeCard.length}/${htmlFiles.length} pages`,
)

/* ------------------------------------------------------------------ *
 * 8. No scoped rule targets a class this component does not render
 *
 * This one exists because of a bug that was live on the site and invisible.
 *
 * `SiteNav` renders its root through `<Panel>` and declared `position: sticky` on it in
 * a scoped style block. Astro does not stamp a component's `data-astro-cid` onto a CHILD
 * component's root element, so `.nav` compiled to `.nav[data-astro-cid-…]`, the nav
 * element carried only `Panel`'s id, and the selector matched nothing. The nav scrolled
 * away with the page. Every other rule in that file still worked, because `.nav__row`,
 * `.nav__list` and `.nav__link` are elements the component does render — so the file
 * looked entirely healthy while one rule silently did nothing.
 *
 * Neither the compiler nor a linter reports it: it is valid CSS matching an empty set.
 *
 * THE RULE, precisely: a class that a component passes to a CHILD component as a `class`
 * or `class:list` prop is rendered by the child, so it carries the CHILD's scope id.
 * Styling it from the parent with a plain scoped selector can therefore never match. The
 * fix is always `:global(.that-class)` — which is what `SiteNav` now does.
 *
 * Checked at SOURCE, not against `dist/`, because the built output cannot tell a class
 * that was never rendered from one that was rendered by a different component. It also
 * does not flag a class that is built by string construction (`.panel--${surface}`), since
 * a class that is legitimately unused on every page is not the bug this is looking for.
 * ------------------------------------------------------------------ */

const astroFiles = srcFiles.filter((f) => extname(f) === '.astro')
const deadScoped = []

for (const file of astroFiles) {
  const text = readFileSync(file, 'utf8')
  const styleAt = text.indexOf('<style')
  if (styleAt === -1) continue
  const template = text.slice(0, styleAt)
  const style = text.slice(styleAt)

  // Walk the template's tags and split the classes by WHO renders the element.
  //
  // A capitalised tag is NOT automatically a component. `Box` and `AsciiRule` both do
  // `<Tag class:list={[…]}>` where `Tag` is a destructured `as` prop holding an HTML
  // element name, and those elements are rendered by the file itself, carrying its own
  // scope id. Treating a capital as a component flag made both look broken.
  //
  // So the test is whether the name is actually imported from a `.astro` file, or is
  // dotted (`Foo.Bar`). Everything else is an element this component emits.
  const frontmatter = text.startsWith('---') ? text.slice(0, text.indexOf('---', 3)) : ''
  const imported = new Set()
  for (const m of frontmatter.matchAll(/import\s+([A-Za-z][\w]*)\s+from\s+['"][^'"]*\.astro['"]/g)) {
    imported.add(m[1])
  }

  const own = new Set()
  const propped = new Set()

  const classesIn = (tagText) => {
    const found = []
    for (const m of tagText.matchAll(/\sclass="([^"{}]*)"/g)) {
      for (const c of m[1].split(/\s+/)) if (c) found.push(c)
    }
    for (const m of tagText.matchAll(/class:list=\{?\[([^\]]*)\]/g)) {
      // Interpolated fragments (`` `--x${y}` ``) are skipped: they are built at runtime
      // and their literal prefix is not a class that appears in the markup.
      for (const q of m[1].matchAll(/['"`]([^'"`$]*)['"`]/g)) if (q[1]) found.push(q[1])
    }
    return found
  }

  for (const tag of template.matchAll(/<([A-Za-z][\w.-]*)((?:"[^"]*"|'[^']*'|\{[^}]*\}|[^>"'])*)\/?>/g)) {
    const name = tag[1]
    const isComponent = imported.has(name) || (name.includes('.') && !name.startsWith('.'))
    for (const c of classesIn(tag[0])) (isComponent ? propped : own).add(c)
  }

  // Every plain scoped class selector in the style block. A selector inside
  // `:global(…)` is exempt: that is the fix, not the bug.
  const globalAt = [...style.matchAll(/:global\(([^)]*)\)/g)].map((m) => [m.index, m.index + m[0].length])
  const insideGlobal = (i) => globalAt.some(([a, b]) => i >= a && i <= b)

  for (const m of style.matchAll(/(^|[\s,>+~{])\.(-?[_a-zA-Z][\w-]*)/g)) {
    const cls = m[2]
    if (insideGlobal(m.index)) continue
    if (!propped.has(cls) || own.has(cls)) continue
    deadScoped.push(`${relative(root, file)}: .${cls}`)
  }
}

check(
  'no scoped rule styles a class that a child component renders',
  deadScoped.length === 0,
  deadScoped.length
    ? `${deadScoped.length} dead selector(s): ${[...new Set(deadScoped)].slice(0, 8).join('; ')} — use :global()`
    : `${astroFiles.length} Astro components scanned`,
)

/* ------------------------------------------------------------------ */
console.log('structure verification\n')
for (const line of notes) console.log(line)
if (failures.length) {
  console.log('')
  for (const line of failures) console.log(line)
  console.log(`\n${failures.length} check(s) FAILED`)
  process.exit(1)
}
console.log(`\nall ${notes.length} checks passed`)
