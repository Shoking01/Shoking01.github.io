import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

/**
 * Project content.
 *
 * The point of this layer is that adding a project means creating exactly one markdown
 * file in `src/content/projects/` and changing nothing else. Everything below is
 * therefore either required-and-typed, or optional with a default that renders. A
 * field that a template has to remember to handle is a field that gets forgotten.
 *
 * The API here is the content-layer API: `src/content.config.ts` (not the legacy
 * `src/content/config.ts`), the `glob()` loader from `astro/loaders`, and Zod from
 * `astro/zod` rather than from `astro:content`. A missing or malformed frontmatter
 * field fails `astro build` with the Zod path and message, so content errors surface
 * at build time instead of rendering as `undefined` on a page.
 *
 * Note for Astro 6 and later: entries no longer have a `.render()` method. Import
 * `render` from `astro:content` and call `render(entry)`.
 */
const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    /** Project name. Used as the page title and the card heading. */
    title: z.string().min(1),

    /** One line for the project card. Keep it under the max or the build fails. */
    summary: z.string().min(1).max(180),

    /** One or two sentences. Used as the meta description and the OG description. */
    description: z.string().min(1).max(300),

    /** Your role on it, in your words. Not a job title. */
    role: z.string().min(1),

    /** ISO date. Coerced, so `2025-04` and `2025-04-18` both work. */
    date: z.coerce.date(),

    /**
     * Lifecycle state. This is rendered with a word and a glyph as well as a colour,
     * because state must never be carried by hue alone.
     */
    status: z.enum(['active', 'maintenance', 'archived']).default('active'),

    /** Featured projects lead the home page list. */
    featured: z.boolean().default(false),

    /** Ascending sort key for the project list. Ties fall back to the date. */
    order: z.number().int().default(100),

    /** Tools and technologies, as they should be displayed. */
    stack: z.array(z.string()).default([]),

    /** Outbound links. Rendered only when non-empty. */
    links: z
      .array(
        z.object({
          label: z.string().min(1),
          // `z.url()` rather than `z.string().url()`, which is deprecated in the Zod
          // version Astro 7 ships and warns under `astro check`.
          href: z.url(),
        }),
      )
      .default([]),
  }),
})

export const collections = { projects }
