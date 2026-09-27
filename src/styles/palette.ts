import { flavors, type ColorName } from '@catppuccin/palette'

/**
 * Catppuccin Mocha, resolved at build time.
 *
 * There is no Astro integration for Catppuccin — the only official one is
 * `@catppuccin/starlight`, which targets documentation sites. So the palette is
 * read here, in Node, and emitted as CSS custom properties that every stylesheet
 * and component can then reference. Nothing about the palette reaches the client
 * as JavaScript.
 *
 * Note the shape: `flavors.mocha` is a Flavor object
 * (`{ name, emoji, order, dark, colors }`), so the hex values live one level
 * deeper than a flat `flavors.mocha.rosewater` would suggest.
 */
export const mocha = flavors.mocha

/** All 26 Mocha colors as `#rrggbb` strings, keyed by Catppuccin color name. */
export const mochaHex = Object.fromEntries(
  (Object.entries(mocha.colors) as [ColorName, { hex: string }][]).map(([name, color]) => [
    name,
    color.hex,
  ]),
) as Record<ColorName, string>

/** The 26 Catppuccin color names, in Catppuccin's own order (accents, then monochromatic). */
export const colorNames = Object.keys(mochaHex) as ColorName[]

/**
 * The full elevation ramp, darkest to lightest.
 *
 * `crust` and `mantle` are *darker* than `base` in Catppuccin; they read as
 * recessed (code wells, terminal chrome) rather than elevated. `surface0`
 * through `surface2` read as raised. The project uses all six — collapsing to
 * `base` plus `text` is what makes a dark theme look flat instead of like a TUI.
 */
export const elevationRamp = ['crust', 'mantle', 'base', 'surface0', 'surface1', 'surface2'] as const

export type ElevationName = (typeof elevationRamp)[number]

/**
 * The raw palette as a `:root` rule of CSS custom properties.
 *
 * Rendered once per page as an inline `<style>` block. Custom properties resolve
 * at computed-value time, so the hand-written semantic layer in `tokens.css` can
 * alias these regardless of stylesheet order.
 */
export function paletteCss(): string {
  const declarations = colorNames.map((name) => `  --ctp-${name}: ${mochaHex[name]};`).join('\n')

  return [
    '/* Generated at build time from @catppuccin/palette. Do not edit by hand. */',
    ':root {',
    declarations,
    '}',
    '',
  ].join('\n')
}
