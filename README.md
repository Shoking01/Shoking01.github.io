# Portfolio

Personal portfolio site. Static Astro build with a terminal-UI (TUI) visual identity.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Astro (static output, no server runtime) |
| Color | Catppuccin Mocha, emitted from `@catppuccin/palette` at build time |
| Typeface | JetBrains Mono, self-hosted via `@fontsource-variable/jetbrains-mono` |
| Styling | Hand-written CSS. No Tailwind, no CSS framework. |
| Content | Astro Content Collections (glob loader + Zod) |
| Client JS | None by default. The only script shipped is Astro's view-transition router. |

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
    typography.css       Type scale, measure, reading defaults
    global.css           Reset, base styles, focus, reduced motion
  pages/
    index.astro          Home
    projects/[...slug].astro   Project detail
```
