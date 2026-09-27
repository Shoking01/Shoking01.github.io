// @ts-check
import { defineConfig } from 'astro/config'

import { shikiTheme } from './src/styles/shiki-theme.ts'

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      // Built from the same `@catppuccin/palette` Mocha colors as the token layer, so a
      // code block cannot drift away from the page it sits on. Shiki's default is
      // `github-dark`, which would put a grey-blue block in the middle of a Mocha page.
      //
      // The theme deliberately declares no `colors` block — see `shiki-theme.ts`. Shiki
      // 4.4.3, which Astro 7 resolves, has no `defaultColor` option, so the only way to
      // keep the inline background out of the <pre> is not to give Shiki one.
      theme: shikiTheme,
    },
  },
})
