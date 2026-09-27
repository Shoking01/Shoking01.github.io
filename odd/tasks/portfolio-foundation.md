# Portfolio Foundation — ODD

**Feature ID:** `portfolio-foundation`
**Status:** in progress
**Started:** 2026-09-26
**Repository:** `Portfolio/` (was an empty, non-git folder)

## Objective

Stand up a production-shaped Astro portfolio with a TUI visual identity (Catppuccin Mocha, JetBrains Mono, rounded box-drawing), a typed project content layer, and the checks needed to keep it honest as projects get added over time.

## Problem

The site needs to hold 3 projects today and 30 in two years. Structure must make "add a project" mean "add one file" rather than "edit a component, add markup, remember a field." Separately, the aesthetic is specific enough that a wrong early choice (sharp corners, wrong font, flat color use) would force rewriting every visual primitive later.

## Why this scope

Five design decisions were locked with the user before any code was written, because each one is expensive to reverse once components exist:

| Decision | Choice | Reason |
|---|---|---|
| Color source | Catppuccin Mocha via `@catppuccin/palette` v1.8.0 | No general Astro integration exists; palette is emitted to CSS custom properties at build time |
| Aesthetic | TUI (terminal UI) | User's original intent |
| Typeface | JetBrains Mono | Tall x-height keeps monospace readable at small sizes; OFL, free, commercially safe |
| Box drawing | Rounded `╭─╮ │ ╰╯` | Charm/lipgloss grammar; matches Catppuccin's "soothing" brand instead of fighting it |
| Content language | English only | No i18n. Matches the code and identifiers; Spanish is addable later via Astro i18n without reworking the content layer |

Also decided: **no Tailwind.** Hand-written CSS is required for fine control over box drawing, borders, and character rendering.

## Constraints

- Static output. No server runtime, no database, no headless CMS. Project content lives in the repo.
- Zero client-side JavaScript by default. Islands only where they earn their weight.
- Full elevation ramp must be used: `base → mantle → crust → surface0 → surface1 → surface2`. Using only `base` + `text` reads as a flat dark theme, not a TUI.
- TUI is the **shell**; reading happens inside it. Frames and ASCII for nav, headers, section rules, cards, code, footer. Case-study prose drops the frame, widens the measure, and gets `line-height: 1.7+`.
- Accessibility is a hard requirement, not a polish pass:
  - `overlay0` on `base` fails contrast and must never carry readable text.
  - Any scanline/CRT overlay: very low opacity, `pointer-events: none`.
  - Every animation (including any blinking caret) must be disabled under `prefers-reduced-motion: reduce`.
  - Do not encode meaning by color alone.

## Authorized scope

Scaffold and build the portfolio site in this folder. Initialize git with a work-unit commit per task on a feature branch.

Out of scope for this feature: deployment configuration, analytics, contact form backend, résumé PDF generation, additional pages beyond the ones listed below.

## TDD resolution

- **Mode:** off / not configured.
- **Source:** no test framework exists in the project and the user did not request one. A static content site does not present a behavior-first unit under test in a way that justifies introducing a runner before it is needed.
- **Runner:** none.
- **Applicable checks instead:** `pnpm build` (catches Astro, TypeScript, and Zod schema errors), `pnpm astro check` (type checking), plus structural verification of the accessibility constraints listed above.

## Delivery strategy

- **Strategy:** `ask-on-risk` (default).
- **Chain strategy:** not selected. Not applicable yet — the folder is not a git repository and no PR exists.
- **Size forecast:** ~900–1200 authored changed lines for the full foundation.
- **Heuristic note:** this exceeds the ~400-line per-task planning heuristic. It naturally does: a design token layer, a typography scale, and a component primitives layer are the deliverable, not padding. Proceeding without size-only rework; no tests omitted, nothing minified, no artificial split.
- **Action when a PR is opened:** re-check the ~400-line delivery budget at PR time and apply `ask-on-risk` then, since the delivery decision belongs to the repository once it is a git remote with a PR workflow.

## Route declaration

| Task | Route | Trigger evidence |
|---|---|---|
| T1–T9 | delegated direct | Writer trigger: 2+ non-trivial new files; nothing exists to read inline, so the reader would only duplicate the brief |
| Design decisions | direct inline (complete) | 5 locked decisions, already done and recorded |

The writer thread is single and sequential, so the aesthetic stays internally consistent across tokens, primitives, and pages.

## Checklist

- [x] **T1** — Scaffold: `pnpm create astro` (minimal), `git init`, `.gitignore`, enable `git add` of the generated lockfile — `76f2c02`
- [x] **T2** — Token layer: import `@catppuccin/palette` at build time, emit all 26 Mocha colors as CSS custom properties plus semantic aliases — `9253f7b`
- [x] **T3** — Typography: self-host JetBrains Mono via `@fontsource-variable`, define the type scale, and set the reading-optimized defaults (measure, line-height) that the TUI-shell pattern depends on — `723738a`
- [x] **T4** — Global CSS: reset, base element styles, focus-visible rings, `prefers-reduced-motion` block — `d2366d4`
- [x] **T5** — TUI primitives: `Panel` (rounded frame), `AsciiRule` (section separator), and a `Box` primitive for the elevation/surface ramp — `d890a03`
- [x] **T6** — Base layout: TUI nav, footer, `<ClientRouter />` view transitions, skip link — `477f28c`
- [x] **T7** — Content layer: Zod-validated `projects` collection; 2 example project entries — `3a9b288`
- [x] **T8** — Home page: TUI hero, project list rendering from the collection — `6eb2c65`
- [x] **T9** — Project detail page: `/projects/[...slug]` via `getStaticPaths()`, unframed reading layout — `75c01e5`
- [x] **T10** — SEO/meta: per-page description, canonical, OG/Twitter tags, `@astrojs/sitemap` — `ef60f40`
- [x] **T11** — Verification pass: `pnpm build` clean, `pnpm astro check` clean, contrast + reduced-motion structurally verified — `97e5284`

### Deviations from the checklist as written

- **T7 said `src/content/config.ts`.** The locked design decision said the current content-layer
  API at `src/content.config.ts`, and the installed Astro is 7.3.5, not 5.x. The locked decision wins;
  the path is `src/content.config.ts` and the loader is `glob()` from `astro/loaders`.
- **T1 said Astro 5-era scaffolding.** `pnpm create astro@latest` installed Astro 7.3.5, Node >=22.12.
  Nothing in the plan assumed the older major.


## Acceptance criteria

1. `pnpm build` completes with no errors.
2. `pnpm astro check` reports no type errors.
3. Adding a project requires creating exactly one markdown file in `src/content/projects/` — no component edits.
4. A project missing a required field fails the build with a readable Zod error.
5. All 26 Mocha colors and the full elevation ramp are available as CSS custom properties.
6. JetBrains Mono is self-hosted; no external font CDN request at runtime.
7. No animation or blinking caret is visible under `prefers-reduced-motion: reduce`.
8. `overlay0` is not used as a text color on `base` anywhere.
9. The generated HTML ships no client-side JS beyond what an explicit island requires.
10. View-transition navigation works between home and a project detail page.

## Applicable checks

- `pnpm build`
- `pnpm astro check`
- Manual/structural: `prefers-reduced-motion` handling, contrast of text/background pairs, absence of external font requests, absence of stray client JS.

## Progress

All eleven tasks complete on `feat/portfolio-foundation`, one work-unit commit each.
`main` points at the T1 scaffold commit so the feature branch has a base to diff
against.

The aesthetic stayed internally consistent because it was derived from measurements
rather than taste wherever a measurement was available: Catppuccin's contrast ratios
decided which color may sit on which surface, and JetBrains Mono's glyph metrics
decided the frame geometry. Two of those measurements changed the design rather than
confirming it — see the risk register below.

## Next step

Fill in the placeholders in `src/site.config.ts` and the two example projects, then
decide on the deployment target. Two things are deliberately unfinished and documented
in the README: there is no `og:image`, and the example project content is placeholder
prose written to demonstrate the reading mode rather than to describe real work.

## Verification evidence

### Commands

```text
$ pnpm build
[build] output: "static"
[build] mode: "static"
[build] directory: ...\Portfolio\dist\
[build] Collecting build info... ✓ Completed in 539ms.
[vite] built in 329ms
[build] generating static routes
  ├─ /projects/driftwatch/index.html (+13ms)
  ├─ /projects/quorum/index.html (+3ms)
  ├─ /index.html (+5ms)
  ✓ Completed in 53ms.
[@astrojs/sitemap] `sitemap-index.xml` created at `dist`
[build] 3 page(s) built in 1.02s
Complete!

$ pnpm astro check
Result (18 files):
- 0 errors
- 0 warnings
- 0 hints

$ pnpm verify
all 13 checks passed
```

### Structural checks (`pnpm verify`, against `dist/`)

```text
PASS  no external font or CDN request in the built output — 4 emitted files scanned, 0 subresource requests off-origin
PASS  a prefers-reduced-motion block exists — 428 bytes
PASS  the reduced-motion block kills animations outright — `animation: none !important` + near-zero duration catch-all
PASS  the reduced-motion block kills view transitions — ::view-transition-group(*) targeted by name
PASS  the blinking caret and the scanline drift are disabled under reduced motion — keyframes found: caret-blink, scanline-drift
PASS  every @keyframes declared in the project is reachable from that block
PASS  overlay0 / overlay1 are never a text colour in source — 22 source files scanned
PASS  --c-frame and the disabled path resolve to overlay0, documented as decorative
PASS  the only <script> in the built HTML is the view-transition router — 3 tags, all /_astro/ClientRouter...js
PASS  no framework islands are rendered — 0 documents with islands
PASS  all 26 Mocha colors are emitted as CSS custom properties — 26/26 found
PASS  the full elevation ramp is exposed as surface tokens — crust -> mantle -> base -> surface0 -> surface1 -> surface2
PASS  no rendered character falls outside the two declared font faces
```

### Runtime checks (headless Edge against the built `dist/`)

Motion, with the preference set explicitly in both directions. Headless Chrome reports
`prefers-reduced-motion: reduce` by default, so the control case has to be emulated or
it is not a control:

```text
prefers-reduced-motion: no-preference
  caret   animation-name: caret-blink     duration: 1.1s  iteration: infinite
  scanline animation-name: scanline-drift duration: 8s    iteration: infinite

prefers-reduced-motion: reduce
  caret   animation-name: none  duration: 0s  iteration: 1
  scanline animation-name: none  duration: 0s  iteration: 1
```

View transition, home to `/projects/driftwatch`:

```text
sentinel on window survived: "alive"        (so it was not a full page load)
performance navigation entries: 1 -> 1      (no document navigation)
events fired: astro:before-preparation, astro:after-swap, astro:page-load
path: /projects/driftwatch   title: Driftwatch — Your Name
article.prose computed border/background: 0px / rgba(0, 0, 0, 0)   (frame genuinely off)
framed .panel elements on the page: 4
off-origin requests: none
console errors: none
scripts the browser actually fetched: /_astro/ClientRouter.astro_astro_type_script_index_0_lang.CYDbzu1r.js
```

Reading layout, measured at a 1000px viewport:

```text
1ch at 15px: 8.781px
reading column: 657.42px = exactly 66 characters at 17px
line-height: 29.75px on 17px = 1.75
opening paragraph: 19px on a 58ch measure
code block: 657.42px wide, background rgb(17, 17, 27) = crust
```

Contrast, measured rather than assumed (`subtext0` is the reason the muted text token is
documented as safe only up to `surface0`):

```text
foreground      base    surface0  surface1  surface2
text           11.34     8.69      6.31      4.62
subtext0        7.37     5.65      4.10      3.00   <- fails from surface1 up
overlay2        5.81     4.45      3.23      2.37   <- fails from surface0 up
overlay1        4.44     3.40      2.47      1.81   <- fails AA even on base
overlay0        3.36     2.57      1.87      1.37   <- fails AA even on base
```

All fourteen Shiki token colors clear AA against the code surface; the dimmest is
`overlay2` at 6.64:1.

### Acceptance criteria

| # | Criterion | Result |
|---|---|---|
| 1 | `pnpm build` completes with no errors | Met. 3 pages, sitemap emitted. |
| 2 | `pnpm astro check` reports no type errors | Met. 0 errors, 0 warnings, 0 hints. |
| 3 | Adding a project is one markdown file, no component edits | Met. Verified: dropping `acceptance-probe.md` produced its card and its detail link, and `git status` showed the new markdown file as the only source change. |
| 4 | A missing required field fails the build with a readable Zod error | Met. `InvalidContentEntryDataError projects → zz-broken`, listing `description: Required`, `role: Required`, `date: Expected type "date"`, plus the file path. |
| 5 | All 26 Mocha colors and the full elevation ramp available as custom properties | Met. 26/26, all six surfaces. |
| 6 | JetBrains Mono self-hosted, no external font CDN at runtime | Met, with one deviation — see the risk register. |
| 7 | No animation or blinking caret under `prefers-reduced-motion: reduce` | Met. Verified in-browser in both directions. |
| 8 | `overlay0` not used as a text color on `base` anywhere | Met. Enforced by `pnpm verify` across 22 source files. |
| 9 | No client-side JS beyond what an explicit island requires | Met. One script, the view-transition router. No islands. |
| 10 | View-transition navigation works between home and a detail page | Met. Verified in-browser, sentinel survived. |

### Risk register

1. **`@fontsource-variable/jetbrains-mono` cannot render this design.** The package is
   sliced from the `google/fonts` build of JetBrains Mono, whose cmap has 229 code
   points and none from U+2500-257F or U+2580-259F. All six shipped subsets were checked
   and all six are missing the block. Left alone, every frame character would fall back
   to an OS monospace font with unknown metrics and no guarantee of rounded corners.
   **Fix:** `JetBrainsMono-Regular.woff2` from the official JetBrains v2.304 release is
   vendored byte-for-byte and declared under the same family with a `unicode-range`
   scoped to the two missing blocks. The package stays the declared dependency and
   still serves all Latin text. This is a deviation from the locked typeface decision as
   worded, made to keep the locked box-drawing decision, which is stated as the more
   important of the two. sha256 and provenance are in `src/styles/fonts.css` and the
   README.
2. **No `og:image`.** Deliberate, documented in the README with the three lines that
   close it. Every crawler that matters drops SVG, and a raster would mean adding an
   image pipeline for one asset.
3. **Character budget.** Because the site declares exactly two font faces, characters
   outside `U+0000-00FF`, `U+2000-206F` and the two box-drawing blocks fall back to an
   OS font. `→` (U+2192) and `✓` (U+2713) are the traps. `pnpm verify` now fails the
   build output if either appears in rendered text.
4. **Shiki owns the code background.** Shiki 4.4.3, the version Astro 7 resolves, has
   no `defaultColor` option and always writes `editor.background` inline onto the
   `<pre>`. The theme's values are set to `crust` and `text` so they agree with
   `--surface-sunken` and `--c-text`; both files carry the cross-reference. Omitting
   the `colors` block is worse, not better — Shiki falls back to its own `#1e1e1e`.
5. **Example project content is invented.** `driftwatch.md` and `quorum.md` describe
   plausible systems but are not real work. Every personal field is a marked
   placeholder. They exist to exercise the reading mode and the card layout, and the
   user should replace them.

