/**
 * Render public/favicon.svg into the raster icons a browser will actually ask for.
 *
 * WHY THIS EXISTS. A favicon set is three files that are supposed to be one drawing:
 * the SVG, the .ico for everything that will not take an SVG, and the apple-touch-icon
 * PNG for iOS, which ignores both of the others. Kept by hand they drift — someone
 * edits the SVG, the tab shows the new mark and the iPhone home screen keeps the old
 * one for a year. So the two rasters are generated from the SVG and never edited.
 *
 * WHY HEADLESS CHROME AND NOT A LIBRARY. sharp and resvg would both do the conversion,
 * and both are a native dependency in a project that currently has none. Chrome is
 * already on the machine and can rasterise SVG exactly the way a browser will, which
 * is the rendering that has to match — the whole reason the mark is measured in
 * browser pixels.
 *
 * WHY THE COLOUR IS HARDCODED HERE. The SVG says `currentColor`, which resolves to the
 * initial value of `color` when the image is loaded as a document, and that is what
 * makes the mark themeable in the page. A raster has no cascade to inherit from, so
 * the fill has to be given. It is `--ctp-text`, the same token the SVG inherits, so
 * substituting it here is the faithful translation rather than a second opinion.
 *
 * The apple-touch-icon additionally gets the page background painted behind it:
 * iOS composites the icon on an opaque white sheet if the image has no alpha, and a
 * light glyph on white is invisible. Without this the home screen icon is a blank
 * rounded square.
 *
 *   node scripts/favicon.mjs
 */

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = join(root, 'public', 'favicon.svg')

/* --ctp-text and --ctp-base from the Mocha palette, i.e. `--c-text` and
   `--surface-page` in the token layer. Duplicated as literals because this script
   runs outside the build and does not import the palette module. */
const FG = '#cdd6f4'
const BG = '#1e1e2e'

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]

/*
 * FIND THE BROWSER WITHOUT RUNNING IT.
 *
 * `chrome --version` looks harmless and is not: Chrome is a single-instance app, so a
 * `--version` on a machine that already has Chrome open is forwarded to that running
 * instance as a request, and the new process never prints and never exits. This script
 * hung on it three times for the full tool timeout with no output past the first line.
 *
 * So the candidate is only checked for EXISTENCE, and `--version` is never invoked. The
 * `--headless=new` run below is a separate profile and does not reach the running
 * instance, so nothing here can be forwarded anywhere.
 */
function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (existsSync(p)) return p
  }
  throw new Error(
    `no Chrome or Edge found. Looked in:\n  ${CHROME_CANDIDATES.join('\n  ')}\n` +
      'Edit CHROME_CANDIDATES if your browser lives elsewhere.',
  )
}

const svg = readFileSync(svgPath, 'utf8')
if (!/currentColor/.test(svg)) {
  console.error('favicon.svg no longer uses currentColor; this script colours it explicitly.')
  console.error('Update FG above to match the token the SVG used to inherit.')
  process.exit(1)
}
const tinted = svg.replace(/currentColor/g, FG)

const profile = mkdtempSync(join(tmpdir(), 'favicon-'))
const PORT = 9600 + Math.floor(Math.random() * 300)

/** Sizes each artefact needs, and why. */
const TARGETS = [
  { file: 'apple-touch-icon.png', size: 180, opaque: true, why: 'iOS home screen; ignores SVG and .ico' },
  { file: 'favicon-32x32.png', size: 32, opaque: false, why: 'declared in <link> so the browser picks one file' },
]

/** .ico holds up to four PNGs; 16/32/48 covers tab, bookmark bar and history. */
const ICO_SIZES = [16, 32, 48]

const chrome = spawn(findChrome(), [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank',
], { stdio: 'ignore' })

/*
 * THE SCRIPT HAS TO BE THE ONE THAT EXITS.
 *
 * With `stdio: 'ignore'` the child is still tracked as a job, so Node's event loop
 * keeps a handle open for it and this module never reaches the end even after every
 * CDP call has resolved and `kill()` has been sent. Two runs of this hung for the full
 * 240s and 300s timeouts with no output at all, which is what a handle that is never
 * closed looks like: the work is done and the process is immortal.
 *
 * `unref()` takes the child off the loop, and the explicit `process.exit` at the end
 * is what guarantees it regardless of what else a browser might have left registered.
 * The two are both here on purpose: either alone fixes the common case, and together
 * they mean a stale handle from a future edit cannot wedge a build silently again.
 */
chrome.unref()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Reject rather than hang. A headless browser that never answers must not wedge a build. */
function withTimeout(promise, ms, what) {
  let t
  return Promise.race([
    promise.finally(() => clearTimeout(t)),
    new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} timed out after ${ms}ms`)), ms) }),
  ])
}

async function endpoint() {
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (res.ok) return (await res.json()).webSocketDebuggerUrl
    } catch {}
    await sleep(250)
  }
  throw new Error('browser did not expose a debugging endpoint')
}

function connect(url) {
  return new Promise((resolve_, reject) => {
    const ws = new WebSocket(url)
    const pending = new Map()
    let id = 0
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id && pending.has(m.id)) {
        const { res, rej } = pending.get(m.id)
        pending.delete(m.id)
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)
      }
    })
    ws.addEventListener('open', () => resolve_({
      send: (method, params = {}, sessionId) => {
        const mid = ++id
        const payload = { id: mid, method, params }
        if (sessionId) payload.sessionId = sessionId
        ws.send(JSON.stringify(payload))
        return new Promise((res, rej) => pending.set(mid, { res, rej }))
      },
    }))
    ws.addEventListener('error', reject)
  })
}

/** Minimal ICO container: a 6-byte header, a 16-byte directory entry per image, then the PNGs. */
function buildIco(pngs) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)   // reserved
  header.writeUInt16LE(1, 2)   // type: icon
  header.writeUInt16LE(pngs.length, 4)

  let offset = 6 + 16 * pngs.length
  const dir = []
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0)  // width, 0 meaning 256
    e.writeUInt8(size >= 256 ? 0 : size, 1)  // height
    e.writeUInt8(0, 2)                       // palette
    e.writeUInt8(0, 3)                       // reserved
    e.writeUInt16LE(1, 4)                    // colour planes
    e.writeUInt16LE(32, 6)                   // bits per pixel
    e.writeUInt32LE(data.length, 8)
    e.writeUInt32LE(offset, 12)
    dir.push(e)
    offset += data.length
  }
  return Buffer.concat([header, ...dir, ...pngs.map((p) => p.data)])
}

try {
  const browser = await withTimeout(connect(await endpoint()), 30000, 'browser connection')
  const { targetId } = await withTimeout(browser.send('Target.createTarget', { url: 'about:blank' }), 20000, 'createTarget')
  const { sessionId } = await withTimeout(browser.send('Target.attachToTarget', { targetId, flatten: true }), 20000, 'attachToTarget')
  await withTimeout(browser.send('Page.enable', {}, sessionId), 20000, 'Page.enable')

  /** Draw the mark into a canvas at `size` and return raw PNG bytes. */
  const render = async (size, opaque) => {
    await withTimeout(browser.send('Emulation.setDeviceMetricsOverride', {
      width: size, height: size, deviceScaleFactor: 1, mobile: false,
    }, sessionId), 20000, `setDeviceMetrics ${size}`)
    const { result } = await withTimeout(browser.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(async () => {
        const svg = ${JSON.stringify(tinted)};
        const opaque = ${opaque};
        const bg = ${JSON.stringify(BG)};
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej;
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
        const c = document.createElement('canvas');
        c.width = ${size}; c.height = ${size};
        const g = c.getContext('2d');
        if (opaque) { g.fillStyle = bg; g.fillRect(0, 0, ${size}, ${size}); }
        g.drawImage(img, 0, 0, ${size}, ${size});
        return c.toDataURL('image/png').split(',')[1];
      })()`,
    }, sessionId), 30000, `render ${size}`)
    return Buffer.from(result.value, 'base64')
  }

  for (const t of TARGETS) {
    const png = await render(t.size, t.opaque)
    writeFileSync(join(root, 'public', t.file), png)
    console.log(`  ${t.file.padEnd(24)} ${t.size}x${t.size}  ${String(png.length).padStart(5)} bytes  (${t.why})`)
  }

  const icoParts = []
  for (const size of ICO_SIZES) {
    icoParts.push({ size, data: await render(size, false) })
  }
  const ico = buildIco(icoParts)
  writeFileSync(join(root, 'public', 'favicon.ico'), ico)
  console.log(`  ${'favicon.ico'.padEnd(24)} ${ICO_SIZES.join('/')}     ${String(ico.length).padStart(5)} bytes  (fallback for browsers without SVG)`)

  // The hashed copy the layout actually links. A favicon on a bare path is cached by
  // URL and never re-requested, so a replaced icon looks like it had no effect; a name
  // that changes with the content makes the browser fetch the new one immediately and
  // keeps serving the old one from cache for everyone who already had it.
  const svgBytes = readFileSync(svgPath)
  const svgHash = createHash('sha256').update(svgBytes).digest('hex').slice(0, 8)
  const hashedName = `favicon-${svgHash}.svg`
  writeFileSync(join(root, 'public', hashedName), svgBytes)
  console.log(`  ${hashedName.padEnd(24)} 1        ${String(svgBytes.length).padStart(5)} bytes  (what the layout links; name tracks content)`)

  // Stale hashed copies from earlier runs would accumulate forever and nothing would
  // ever reference them, so the directory is swept to just the one this run produced.
  const publicDir = join(root, 'public')
  for (const entry of readdirSync(publicDir)) {
    if (/^favicon-[0-9a-f]{8}\.svg$/.test(entry) && entry !== hashedName) {
      rmSync(join(publicDir, entry), { force: true })
      console.log(`  removed stale ${entry}`)
    }
  }

  // Fail loudly rather than shipping an icon that is the wrong shape.
  const { result: probe } = await withTimeout(browser.send('Runtime.evaluate', {
    returnByValue: true, awaitPromise: true, expression: `(async () => {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej;
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(${JSON.stringify(tinted)}); });
      const at = (size) => {
        const c = document.createElement('canvas'); c.width = size; c.height = size;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0, size, size);
        const d = g.getImageData(0, 0, size, size).data;
        let ink = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 24) ink++;
        return +((ink / (size * size)) * 100).toFixed(1);
      };
      return JSON.stringify({ p16: at(16), p32: at(32) });
    })()`,
  }, sessionId), 30000, 'probe')
  const ink = JSON.parse(probe.value)
  const ok = ink.p16 >= 12 && ink.p16 <= 28
  console.log(`\nink coverage at 16px: ${ink.p16}%  (readable band 12-28%) ${ok ? 'OK' : 'OUT OF BAND'}`)
  if (!ok) {
    console.error('The mark is too light or too heavy at 16px. Adjust the stroke width before shipping.')
    process.exitCode = 1
  }
} finally {
  // `kill()` alone can leave the profile behind when the process is killed hard, so the
  // profile is removed on a delay and a stale one is swept before a new run. Two orphaned
  // `%TEMP%/favicon-*` directories were left behind by a run that hung, which is the
  // failure this prevents rather than repeats.
  chrome.kill()
  setTimeout(() => {
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 3 }) } catch {}
  }, 500).unref?.()
  // See the note on `unref()` above: without this the process outlives its own work.
  process.exit(process.exitCode ?? 0)
}
