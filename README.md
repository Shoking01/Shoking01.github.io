# Portfolio

Personal portfolio site. Static Astro build with a terminal-UI (TUI) visual identity.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Astro (static output, no server runtime) |
| Color | Catppuccin Mocha, emitted from `@catppuccin/palette` at build time |
| Typeface | JetBrains Mono, self-hosted. No external font request at runtime. |
| Styling | Hand-written CSS. No Tailwind, no CSS framework. |
| Content | Astro Content Collections (glob loader + Zod) |
| Client JS | None by default. The only script shipped is Astro's view-transition router. |

## Fonts

Two `@font-face` rules, one family, disjoint character ranges. Both self-hosted, no
CDN, no runtime request off the machine.

| Face | Source | Covers |
| :-- | :-- | :-- |
| `JetBrains Mono Variable` 100-800 | `@fontsource-variable/jetbrains-mono`, latin subset | Latin text |
| `JetBrains Mono Variable` 400 | vendored `src/assets/fonts/JetBrainsMono-Regular.woff2` | U+2500-257F box drawing, U+2580-259F block elements |

The second face is not optional. `@fontsource-variable` is sliced from the
`google/fonts` build of JetBrains Mono, and that build contains **zero** box-drawing
glyphs — measured by decompressing the shipped `woff2` and reading its `cmap`. Every
one of the six shipped subsets is missing the block. Without the vendored face, `╭ ─ ╮
│ ╰ ╯` would fall back to whatever monospace font the OS has, which defeats the
central visual decision of this site. The vendored file is byte-for-byte the official
JetBrains v2.304 release build, and every glyph in it has a 600/1000 em advance width —
identical to the Latin letterforms — so frames sit exactly on the monospace grid.

Only the latin subset of the fontsource package is declared. The other five subsets
can never match a character on an English-only site, and importing the package's entry
CSS would ship them as dead files plus a base64 data URI in the critical-path CSS.


## Commands

| Command | Action |
| :-- | :-- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start local dev server at `localhost:4321` |
| `pnpm build` | Build the production site to `./dist/` |
| `pnpm preview` | Preview the production build locally |
| `pnpm typecheck` | Type-check the project (`astro check`) |
| `pnpm verify` | Structural checks against `dist/` — see below |

## What `pnpm verify` checks

`astro build` catches types, schemas and missing routes. It cannot catch the rules that
actually protect this design, because none of them are errors:

- no subresource request leaves the origin — no font CDN, no CDN at all
- every `@keyframes` is neutralised under `prefers-reduced-motion: reduce`, including
  Astro's `::view-transition-*` animations, which no local stylesheet would reach
- `overlay0` and `overlay1` are never used as a `color` in source — borders, outlines
  and disabled states are allowed, readable text is not
- the only `<script>` in the built HTML is the view-transition router, and no framework
  island is rendered
- all 26 Mocha colors and all six elevation surfaces are present
- no rendered character falls outside the two declared font faces — the trap here is
  `→` (U+2192) and `✓` (U+2713), which look fine in a diff and silently fall back to an
  OS font in the browser

It runs against `dist/`, so it checks what ships rather than what the source intends.

## Design rules

These are load-bearing. Changing one means revisiting every component that uses it.

- **Rounded box drawing only.** Panels, cards, and frames use `╭ ─ ╮ │ ╰ ╯`. Sharp corners
  (`┌ ┐ └ ┘`) and ASCII (`+ - |`) are wrong for this aesthetic.
- **The TUI is the shell, not the content.** Frames belong to nav, headers, section rules,
  project cards, code, and the footer. Case-study prose drops the frame, widens its measure,
  and uses `line-height: 1.7+` with a larger font size. Monospace body text at small sizes is
  fatiguing over a long read.
- **Depth comes from the elevation ramp, not shadows.** Surfaces step
  `base → mantle → crust → surface0 → surface1 → surface2`. Panels sit on `surface0`.
- **The site is dark-only.** No theme toggle.
- **Content is English-only.** No i18n layer.

## Accessibility rules

- `overlay0` on `base` fails WCAG contrast. It is for decorative borders and disabled states
  only, never for text that must be read.
- Meaning is never encoded by color alone.
- Every animation, including the blinking caret, is neutralized under
  `@media (prefers-reduced-motion: reduce)`.
- Focus is always visible via `:focus-visible`.
- The scanline overlay is decorative, `pointer-events: none`, and never sits over body text.

## Adding a project

Create one file: `src/content/projects/<slug>.md`. Nothing else changes — no
component edits, no imports, no registration. The slug is the filename, and it becomes
the URL (`/projects/<slug>`).

```yaml
---
title: Project Name
summary: One line for the card. Max 180 characters.
description: One or two sentences. Max 300. Used for meta and social cards.
role: What you did on it, in your words. Not a job title.
date: 2025-04-18
status: active # active | maintenance | archived
featured: false # featured projects lead the home page
order: 100 # ascending; ties fall back to the date
stack: [go, postgres]
links:
  - label: architecture notes
    href: https://example.com/notes
---
```

The markdown body is the case study. It renders in the unframed reading mode: no
panel, a 66ch measure, `line-height: 1.75` and a font-size step up from the rest of the
site.

A missing or malformed field fails `astro build` with the collection name, the entry,
the field and the file path — content errors surface at build time rather than
rendering as `undefined`:

```text
InvalidContentEntryDataError  projects → zz-broken  data does not match collection schema.
  description: Required
  role: Required
  date: Expected type "date", received "object"
```

## Code blocks

Syntax highlighting is a Shiki theme generated from the same `@catppuccin/palette`
Mocha colors as the design tokens, so a code block cannot drift away from the page
around it. All fourteen token colors clear WCAG AA against the code surface.

Shiki writes its background onto the `<pre>` as an inline style and Shiki 4.4.3 — the
version Astro 7 resolves — has no `defaultColor` option to suppress that. The theme's
`editor.background` is therefore `crust` and its `editor.foreground` is `text`, which
are exactly `--surface-sunken` and `--c-text` in `global.css`. If you change one, change
`mochaHex` so both move.

## Metadata

`src/components/Seo.astro` owns the document head. `title`, `description` and
`canonical` are required props, so no page can render without them, and every Open
Graph and Twitter tag is derived from those same three values rather than restated —
which is the usual way a social card ends up disagreeing with the page it describes.
The canonical URL is resolved against `site.url`, so it is absolute.

`@astrojs/sitemap` reads the same `site.url` from `astro.config.mjs`, so the sitemap
and the canonical links cannot drift apart. A case study is `og:type=article` and adds
`article:published_time`; the home page is `website`.

### Known gap: no `og:image`

There is deliberately no `og:image`. Every crawler that matters renders JPEG, PNG or
WebP and silently drops an SVG, and producing a raster here would mean adding an image
pipeline to a static site for one asset. `twitter:card` is therefore `summary` rather
than `summary_large_image`, which would ask for a large card this page cannot supply.

To close it: drop a 1200×630 image at `public/og.png` and add

```astro
<meta property="og:image" content={new URL('/og.png', site.url).href} />
<meta name="twitter:card" content="summary_large_image" />
```

## Layout

```text
src/
  content/
    config.ts            Content collection schemas (Zod)
    projects/            One markdown file per project
  layouts/
    BaseLayout.astro     <head>, nav, footer, skip link
  components/
    Panel.astro          Rounded box-drawing frame
    AsciiRule.astro      Section separator
    Box.astro            Elevation-ramp surface primitive
  styles/
    tokens.css           Catppuccin Mocha → CSS custom properties
    fonts.css            Self-hosted JetBrains Mono, two faces
    typography.css       Type scale, measure, reading defaults
    global.css           Reset, base styles, focus, reduced motion
  pages/
    index.astro          Home
    projects/[...slug].astro   Project detail
```

## The frame is a character grid

`Panel` does not draw a CSS border and paste corner glyphs on it. The frame is real
box-drawing text on a grid measured in `ch`, which is possible because of how the
glyphs were drawn:

| Glyph | Metrics (upem 1000, advance 600) | Consequence |
| :-- | :-- | :-- |
| `─` | ink `x -20..620` | overhangs its cell by 20 units each side, so a run tiles seamlessly |
| `│` | ink `y -400..1120`, stem `x 250..350` | 1.52 em tall, so at `line-height: 1.5` consecutive stems overlap by 0.02 em and read as one hairline |
| `╭ ╮ ╯ ╰` | 0.1 em arms on the 600 advance | meet the rails without a seam |

`--leading-chrome: 1.5` is therefore not a style preference. It is the only
line-height at which `│` connects, and it is why the chrome and prose scales are
defined together.

Consequences worth knowing before editing `Panel`:

- `Panel` is for chrome. Case-study prose drops the frame entirely and uses the
  `.prose` reading mode, which runs at `line-height: 1.75`. A `│` chain at 1.75
  would break into dashes, which is one more reason the frame comes off.
- `cols` is a character count, not a pixel width. A panel is
  `min(cols ch, 100%)`, and the rails are clipped rather than gapped when the
  viewport is narrower, because a clipped `─` is still part of a continuous line.
- Every frame element is `aria-hidden`. Panel content is ordinary markup.

