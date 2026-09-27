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
| `pnpm astro check` | Type-check the project |

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

