# Terminal Interactivo — ODD

**Feature ID:** `terminal-interactive`
**Branch:** `feat/portfolio-foundation` (existing feature branch; no new branch)
**Delivery strategy:** `exception-ok` — no push, PR or merge is authorized; work-unit commits stay on this feature branch. `ask-on-risk` would require a chain-strategy question for a PR that does not exist yet.
**Runner:** `pnpm build`, `pnpm typecheck`, `pnpm verify` (structural checks over `dist/`). No unit-test framework exists and none is introduced.

## Specs

**S1 — Interactivo, no decorado.** The user asked, verbatim: "Quiero cambiar todo el diseño de la Web, que se mantenga como Terminal pero mas moderna." When offered three directions, the user chose, verbatim: "Terminal interactivo". Acceptance: the site gains a real interactive shell — typed boot sequence, a command input, blinking caret, command history and a visible command palette — rather than static terminal imagery. The current design removed that theatre on purpose (see `index.astro` and `SiteNav.astro` frontmatter); this feature explicitly reverses that decision. Checks: `pnpm verify` asserts the shell ships in every page that uses it, its script is declared, its animations are killed under reduced motion, and the no-JS command links are present.

**S2 — Rust en primer plano.** The user asked, verbatim: "Agregando mi conocimiento de Rust". Acceptance: a dedicated Rust spotlight section with its own anchor and a matching shell command. Every factual claim must already exist in `src/site.config.ts`, `src/data/skills.ts` or `src/pages/index.astro`; no invented version numbers, metrics or availability claims.

**S3 — Catppuccin Mocha intacto.** The user asked, verbatim: "manteniendo los colores de Catppuccin Mocha". Acceptance: all 26 Mocha colors still emitted as `--ctp-*`; new UI references only semantic tokens from `tokens.css`, never raw `--ctp-*` values; the six-step elevation ramp and its contrast rules are unchanged.

**S4 — Accessibility and progressive enhancement are non-negotiable.** Discovered constraint, not a user request: `scripts/verify-structure.mjs` currently fails on any client script beyond `ClientRouter` and allows only `scanline-drift` as a keyframe. Acceptance: the verifier is updated to ALLOW exactly the shell script and the new keyframes, and to ASSERT the new guarantees — it is never loosened by deleting a check. Under `prefers-reduced-motion` the typing, blink and reveal animations are off; boot text is present in the HTML before JavaScript runs; the shell is operable by keyboard; command links work without JavaScript; `overlay0`/`overlay1` remain non-text tokens.

## Tasks

| ID | Specs | Route | Status | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1, S2, S3, S4 | inline — verifier RED checks first | done — 9 RED, then 33/33 GREEN | `18d35e0` |
| T2 | S1, S3, S4 | inline — shell component, script, styles | done — shell ships, script syntax checked | `18d35e0` |
| T3 | S2, S4 | inline — Rust spotlight, nav, home integration | done — anchor, nav link, shell command | `18d35e0` |
| T4 | S1–S4 | inline — full check pass, docs, close | done — `build 4/4`, `typecheck 0/0/0`, `verify 33/33` | `18d35e0` |

Route evidence: every unit is one understood behavior; no two independent units needing several minutes each were launched together, and the context backstop has not fired. The parent writes inline and owns git.

## Log

**L1** (original request, verbatim): "Quiero cambiar todo el diseño de la Web, que se mantenga como Terminal pero mas moderna. Agregando mi conocimiento de Rust y manteniendo los colores de Catppuccin Mocha"

**L2** (answer to the one design question, verbatim): "Terminal interactivo"

**L3** — Evidence gathered before writing: `src/styles/palette.ts` generates the 26 Mocha tokens; `src/styles/tokens.css` aliases them semantically; `src/components/Panel.astro` draws real box-drawing frames; `src/data/skills.ts` already lists Rust twice plus GPUI/Axum; `site.config.ts` tagline and `index.astro` intro already make the owner's Rust/GPUI performance thesis. `scripts/verify-structure.mjs` check 4 forbids all scripts except `ClientRouter`, and check 2 allowlists only `scanline-drift` — both must change deliberately.

**L4** — Design decision: progressive enhancement. Boot lines and all Rust content ship as real HTML text; JavaScript enhances rather than authors the content. `is:inline` script avoids a module-defer flash of full text.

**L5** — Delivery: all four tasks implemented inline and delivered in one work-unit commit, `18d35e0` (`feat(terminal): interactive shell with typed boot and rust spotlight`). The slice is ~727 inserted lines, over the 400-line planning heuristic because the shell's markup, script, styles and structural checks are one behavior and splitting them would have left an unbuildable intermediate; no semantic split was forced. No push, PR or merge was requested or performed.

**L6** — Verification evidence, observed on the final tree: `pnpm build` built 4 pages; `pnpm typecheck` reported 0 errors / 0 warnings / 0 hints; `pnpm verify` reported all 33 checks passed. The inline shell script was extracted from `dist/index.html` and passed `node --check`. The first verify run on T1 produced 9 RED failures; a verifier bug (`find(...endsWith('index.html'))` selecting `/about/index.html`) was corrected to select the root document before the GREEN run.

**Status: closed — verified.** No pending or skipped checks.
