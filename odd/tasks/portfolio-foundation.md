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

- [ ] **T1** — Scaffold: `pnpm create astro` (minimal), `git init`, `.gitignore`, enable `git add` of the generated lockfile
- [ ] **T2** — Token layer: import `@catppuccin/palette` at build time, emit all 26 Mocha colors as CSS custom properties plus semantic aliases
- [ ] **T3** — Typography: self-host JetBrains Mono via `@fontsource-variable`, define the type scale, and set the reading-optimized defaults (measure, line-height) that the TUI-shell pattern depends on
- [ ] **T4** — Global CSS: reset, base element styles, focus-visible rings, `prefers-reduced-motion` block
- [ ] **T5** — TUI primitives: `Panel` (rounded frame), `AsciiRule` (section separator), and a `Box` primitive for the elevation/surface ramp
- [ ] **T6** — Base layout: TUI nav, footer, `<ClientRouter />` view transitions, skip link
- [ ] **T7** — Content layer: `src/content/config.ts` with a Zod-validated `projects` collection; 2 example project entries
- [ ] **T8** — Home page: TUI hero, project list rendering from the collection
- [ ] **T9** — Project detail page: `/projects/[...slug]` via `getStaticPaths()`, unframed reading layout
- [ ] **T10** — SEO/meta: per-page description, canonical, OG/Twitter tags, `@astrojs/sitemap`
- [ ] **T11** — Verification pass: `pnpm build` clean, `pnpm astro check` clean, contrast + reduced-motion structurally verified

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

_(updated as tasks complete — checked off only after observed outcomes and checks)_

## Next step

T1 — scaffold.

## Verification evidence

_(filled in per task)_
