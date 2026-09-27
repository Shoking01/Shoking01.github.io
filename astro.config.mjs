// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

import { shikiTheme } from './src/styles/shiki-theme.ts'
import { site } from './src/site.config.ts'

// https://astro.build/config
export default defineConfig({
  // Required by @astrojs/sitemap, and the same value Seo.astro resolves canonical URLs
  // against. One source, so the sitemap and the canonical links cannot disagree.
  site: site.url,

  integrations: [sitemap()],

  markdown: {
    shikiConfig: {
      // Built from the same `@catppuccin/palette` Mocha colors as the token layer, so a
      // code block cannot drift away from the page it sits on. Shiki's default is
      // `github-dark`, which would put a grey-blue block in the middle of a Mocha page.
      //
      // Shiki inlines `editor.background` onto every <pre> it renders, and Shiki 4.4.3 —
      // the version Astro 7 resolves — has no `defaultColor` option to suppress that.
      // So the theme sets it to `crust` and `editor.foreground` to `text`, which are
      // exactly `--surface-sunken` and `--c-text` in global.css. See `shiki-theme.ts`.
      theme: shikiTheme,
    },
  },
})
