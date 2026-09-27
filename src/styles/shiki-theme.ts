import { mochaHex } from './palette'

/**
 * A Shiki theme generated from the same Catppuccin Mocha palette as the site.
 *
 * Shiki's default is `github-dark`, which would drop a grey-blue background and a
 * GitHub-flavoured token palette into the middle of a Mocha page. Naming a built-in
 * `catppuccin-mocha` would fix the colour but leave two independent copies of the
 * palette in the project, free to drift apart.
 *
 * So the theme is built here from `mochaHex`. One source of truth: if the flavor
 * changes, the code blocks change with it.
 *
 * Deliberately NOT `as const`. Shiki types the theme as a mutable
 * `ThemeRegistrationRaw`, and a readonly `settings` tuple does not satisfy it.
 *
 * One deliberate departure from the official Catppuccin Shiki theme: comments are
 * `overlay2` rather than `overlay0`. `overlay0` on the code background measures
 * 6.64:1 for `overlay2` and 3.84:1 for `overlay0`, so `overlay0` would fail WCAG AA,
 * and a comment is text somebody has to read.
 */
const c = mochaHex

/**
 * The shape Shiki expects for a raw TextMate theme.
 *
 * Declared locally rather than imported from `shiki`, because Shiki is a transitive
 * dependency of Astro and importing its types would tie this file to a package the
 * project does not depend on. The annotation is what makes the object assignable:
 * without it TypeScript widens `type` to `string` and rejects the literal `'dark'`.
 */
interface RawTheme {
  name: string
  type: 'dark'
  colors: Record<string, string>
  settings: {
    scope?: string | string[]
    settings: {
      foreground?: string
      fontStyle?: string
    }
  }[]
}

export const shikiTheme: RawTheme = {
  name: 'catppuccin-mocha',
  type: 'dark',
  // Shiki writes these onto the <pre> as an inline style, and an inline style beats the
  // stylesheet — so the code surface is owned here, not in global.css. That is not a
  // choice, it is a constraint: Shiki 4.4.3 (the version Astro 7 resolves) has no
  // `defaultColor` option, and omitting `colors` entirely makes Shiki fall back to its
  // own `#1e1e1e`, which is not a Mocha color at all.
  //
  // So the values below are chosen to AGREE with the stylesheet rather than to compete
  // with it: `crust` is `--surface-sunken` and `text` is `--c-text`. global.css sets
  // the same two values on `pre` for hand-written code blocks. If you change one,
  // change both — or better, change `mochaHex`, which moves both.
  colors: {
    'editor.background': c.crust,
    'editor.foreground': c.text,
  },
  settings: [
    { settings: { foreground: c.text } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: c.overlay2, fontStyle: 'italic' },
    },
    {
      scope: ['string', 'string.quoted', 'string.template', 'punctuation.definition.string'],
      settings: { foreground: c.green },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character.escape'],
      settings: { foreground: c.peach },
    },
    {
      scope: ['keyword', 'keyword.control', 'keyword.operator.new', 'storage', 'storage.type'],
      settings: { foreground: c.mauve },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.function-call.generic',
        'variable.function',
      ],
      settings: { foreground: c.blue },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.type',
        'support.class',
        'entity.other.inherited-class',
      ],
      settings: { foreground: c.yellow },
    },
    {
      scope: ['variable', 'variable.other', 'variable.parameter', 'meta.definition.variable.name'],
      settings: { foreground: c.text },
    },
    {
      scope: ['keyword.operator', 'string.tag', 'entity.name.tag'],
      settings: { foreground: c.sky },
    },
    {
      scope: ['entity.other.attribute-name', 'meta.attribute'],
      settings: { foreground: c.maroon },
    },
    {
      scope: ['string.regexp', 'constant.character'],
      settings: { foreground: c.pink },
    },
    {
      scope: ['support.function.builtin', 'variable.language', 'constant.language.boolean'],
      settings: { foreground: c.red },
    },
    {
      scope: ['punctuation', 'meta.brace', 'punctuation.separator', 'punctuation.terminator'],
      settings: { foreground: c.subtext0 },
    },
    {
      scope: ['markup.heading', 'markup.quote', 'markup.list', 'markup.bold'],
      settings: { foreground: c.lavender, fontStyle: 'bold' },
    },
    {
      scope: ['markup.italic', 'markup.strikethrough', 'markup.link', 'markup.inline.raw'],
      settings: { foreground: c.teal },
    },
    {
      scope: ['markup.inserted'],
      settings: { foreground: c.green },
    },
    {
      scope: ['markup.deleted'],
      settings: { foreground: c.red },
    },
    {
      scope: ['invalid', 'invalid.illegal'],
      settings: { foreground: c.red },
    },
  ],
}
