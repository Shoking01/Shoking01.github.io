# Portfolio

Personal portfolio site. Static Astro build with a terminal-UI (TUI) visual identity.

The visual language is the whole identity and it is load-bearing: JetBrains Mono,
Catppuccin Mocha, rounded box-drawing frames, a monospace grid measured in `ch`, the
elevation ramp, the `#` marker, the scanline overlay. What the site does **not** do is
imitate a terminal session. There is no `user@host:~$` prompt, no command names, no
numbered history and no blinking caret. A portfolio that pretends to be a terminal is a
portfolio about pretending to be a terminal; this one looks the way it was built and
reads like a portfolio.

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

Note that the character check is looser than the real constraint on purpose: its safe
ranges include U+2190-21FF, but the two declared faces do not cover them, so `→` passes
`pnpm verify` and still falls back in a browser. Do not use it.

## Design rules

These are load-bearing. Changing one means revisiting every component that uses it.

- **Rounded box drawing only.** Panels, cards, and frames use `╭ ─ ╮ │ ╰ ╯`. Sharp corners
  (`┌ ┐ └ ┘`) and ASCII (`+ - |`) are wrong for this aesthetic.
- **The visual language is the identity; the simulation is not.** JetBrains Mono, the Mocha
  ramp, the rounded frames, the `ch` grid, the `#` marker and the scanline overlay all stay.
  The prompt, the command names, the numbered history, the blinking caret and the `ls` table
  do not come back. Nothing renders a `$` or an `@`.
- **The TUI is the shell, not the content.** Frames belong to nav, headers, section rules,
  project cards, code, and the footer. Prose drops the frame, holds a measure in `ch`, and
  uses `line-height: 1.7+` at a larger font size. Monospace body text at 15px is fatiguing
  over a long read; at 20px it is more legible than a proportional face at 15px, which is
  why 20px is the body size and chrome stayed at 12-15px.
- **Depth comes from the elevation ramp, not shadows.** Surfaces step
  `base → mantle → crust → surface0 → surface1 → surface2`. Panels sit on `surface0`.
- **The site is dark-only.** No theme toggle.
- **Content is English-only.** No i18n layer.

## The measure, and the shell it forces

`ch` scales with the font size, so the reading column and the shell are the same decision
twice. The arithmetic, in full, is in `src/styles/typography.css` under `--measure-prose`;
the short version:

| | prose | 1ch | `--measure-prose` | shell | shell width |
| :-- | :-- | :-- | :-- | :-- | :-- |
| before | 17px | 10.2px | 66ch = 673px | 76 cells @ 15px | 684px |
| **now** | **20px** | **12.0px** | **66ch = 792px** | **88 cells @ 15px** | **792px** |

`88 × 15 = 66 × 20 = 1320`, so the reading column and the shell are the same physical width
and neither has slack the other lacks. **The site is 792px wide, up from 684px** — that is
the visible cost of a 3px-larger body at an unchanged character count.

The alternative was to hold the shell at 684px and let the measure fall to 57 characters.
It was rejected because 66ch is a documented property of the reading mode, and because the
real ceiling on a reading column is a character count rather than a pixel count: 66 is the
middle of the 60-80 band monospace reads well in.

Two consequences to know before editing either file:

- `1ch` resolves against **the element's own font size**. A `66ch` `max-width` on an element
  still at 15px is 580px, and 580px of 20px text is 48 characters, not 66. Declare the size
  on the element that carries the measure, never one level above it.
- A grid with no `grid-template-columns` has one implicit `auto` track, sized by its content.
  `Panel` and `AsciiRule` hold runs of 256 box-drawing characters meant to be clipped, so an
  `auto` track asks for the run's max-content size, `fr` does not cap the answer, and the
  page opens sideways. Every single-column grid declares `grid-template-columns:
  minmax(0, 1fr)`.

## Accessibility rules

- `overlay0` on `base` fails WCAG contrast. It is for decorative borders and disabled states
  only, never for text that must be read.
- Meaning is never encoded by color alone. The lifecycle state is a word, a glyph and a hue;
  the current nav item is an underline and a weight as well as a colour.
- Every animation is neutralized under `@media (prefers-reduced-motion: reduce)`. There is
  exactly one: the scanline overlay's drift. Astro's `::view-transition-*` animations are
  killed by name, since no local stylesheet would reach them.
- Focus is always visible via `:focus-visible`, and the current page carries
  `aria-current="page"` on a real anchor.
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

`summary` is not decoration and it is not a one-liner in practice: it is the descriptive
paragraph at the top of the project's card on the home page, at prose size and a 63-character
measure. Write it as a sentence, not as a file name. The `title` is what the card links, and
it is a human name, not the slug.

A missing or malformed field fails `astro build` with the collection name, the entry,
the field and the file path — content errors surface at build time rather than
rendering as `undefined`:

```text
InvalidContentEntryDataError  projects → zz-broken  data does not match collection schema.
  description: Required
  role: Required
  date: Expected type "date", received "object"
```

## Adding a job

Create one file: `src/content/experience/<company-slug>.md`. Nothing else changes. Jobs
have no route of their own — they are a section of `/about`, rendered newest first by
`start` — and the entry is frontmatter only, with no case study to write.

```yaml
---
company: Company Name
role: Job Title # the row heading
location: City, Country # or Remote
remote: false
start: 2025-10 # so does 2025-10-06. A bare year must be quoted: "2023"
end: 2026-01 # omit for an ongoing role
current: false # true means ongoing; asserted, never inferred
granularity: month # month | year, defaults to month
summary: Optional one line, max 180 characters
highlights:
  - "Label: What was actually done, in the owner's words."
stack: [react, sql]
---
```

Three of those fields exist to stop the page claiming more than the source:

- **`current` is a flag, not an empty `end`.** An ongoing role sets `current: true` and
  omits `end`. A closed role with no `end` fails `astro build`, so forgetting the field
  cannot quietly turn a role that ended years ago into one that is still open.
- **`granularity` records the source's precision.** `start: 2025-10` and
  `start: 2025-01-01` both become the first of January, so a role the CV dated by year
  would otherwise render as "Jan 2025" — a month nobody ever claimed.
- **`summary` is optional.** A CV states what was done, not what the job was, and there
  is no honest one-liner to write from bullet points alone. The cap matches
  `projects.summary` so the two collections agree on what "one line" means.

Two quoting rules, both of which fail the build loudly rather than rendering wrong
years, but which are much easier to write than to remember:

- **Quote a bare year.** `start: 2023` is a YAML integer, and a date coerced from a
  number is milliseconds since the epoch — the page rendered "1970 - 1970" before the
  schema started rejecting numbers.
- **Quote every highlight.** Each one contains a colon, and an unquoted
  `Bug Triage: Isolated complex code defects` is a YAML mapping, not a string.

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

### The social card

`public/og.png` is a 1200×630 PNG, 11KB: a near-white `S` in `text` on `crust`, under a
`mauve` rule, set in JetBrains Mono. The colours are the same tokens the site renders
with, so the card cannot drift from the design system the way a second set of brand
colours would.

`Seo.astro` emits `og:image`, `og:image:width`, `og:image:height` and `og:image:alt`,
and `twitter:card` is `summary_large_image`. The dimensions are declared so a crawler
reserves the right aspect ratio before it fetches the file.

The gap this section used to describe is closed. It originally read that no `og:image`
existed because every crawler that matters renders JPEG, PNG or WebP and drops an SVG,
and that a raster would mean an image pipeline in a static site for one asset. That was
true of a file to be generated *on demand* — and wrong about the actual requirement, which
is a raster asset, not a pipeline. Rendering it once, offline, with a throwaway script
and committing the result gives the correct outcome with none of the cost: the build
still ships no image tooling, the file is reviewable in a diff, and every crawler that
would have dropped the SVG now reads this one.

## Layout

```text
src/
  content.config.ts      Content collection schemas (Zod)
  content/
    projects/            One markdown file per project
    experience/          One markdown file per job
  data/
    skills.ts            Skill taxonomy. Typed data, deliberately not a collection
  layouts/
    BaseLayout.astro     <head>, nav, footer, skip link, the shell width
  components/
    Panel.astro          Rounded box-drawing frame
    AsciiRule.astro      Section separator
    Box.astro            Elevation-ramp surface primitive (currently unused)
    SiteNav.astro        Framed primary navigation
    SiteFooter.astro     Framed status line
    ProjectCard.astro    One project: title, status, summary, metadata, two links
    StatusTag.astro      Lifecycle state: word, glyph and colour together
    Seo.astro            Head, canonical, Open Graph, Twitter
  styles/
    tokens.css           Catppuccin Mocha → CSS custom properties
    fonts.css            Self-hosted JetBrains Mono, two faces
    typography.css       Type scale, measure arithmetic, reading defaults
    global.css           Reset, base styles, focus, reduced motion
  pages/
    index.astro          Home: hero, intro, facts, project cards
    about.astro          Experience and Skills
    projects/[...slug].astro   Project detail
```

`Box.astro` has no callers. It predates the redesign, it is a one-rung surface switcher that
`Panel` and the page-level CSS now cover, and it is listed here so its absence is a fact in
the repository rather than a surprise. It is not dead code the redesign introduced.

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
  Omit `cols` and the panel is **fluid**: it fills its container and has no cap of
  its own, so its container has to have a definite width. A fluid panel inside a
  content-sized grid track asks for the max-content size of its 256-character rail
  and the page opens sideways. See the grid note above.
- Every frame element is `aria-hidden`. Panel content is ordinary markup.

