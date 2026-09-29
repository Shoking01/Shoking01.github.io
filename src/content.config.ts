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

/**
 * Experience content.
 *
 * The same contract as `projects`: adding a job means creating exactly one markdown
 * file in `src/content/experience/` and changing nothing else. Entries here have no
 * route of their own, because a CV is a list and a list is a section on a page rather
 * than a page per row.
 *
 * The entries are frontmatter only. The body is never rendered, and nothing in the
 * schema would make it render, so a role is described entirely by the fields below and
 * an empty file is a complete entry. `projects` needs a body because a case study is
 * prose; a job is not.
 *
 * Three fields exist because chronology is the one thing a CV collection has to model
 * carefully, and all three are about not claiming more than the source states.
 *
 *   - `current` is an assertion, not an inference. An ongoing role sets it to `true` and
 *     omits `end`; the refinement below fails the build for a closed role with no `end`.
 *     The safe direction is deliberate: a forgotten `end` cannot quietly claim the owner
 *     still works somewhere, and a forgotten `current` fails loudly instead of rendering
 *     a role that closed years ago as still open.
 *   - `granularity` records whether the source dated the role by month or by year.
 *     `z.coerce.date()` cannot tell `2025` from `2025-01-01` — both arrive as the first
 *     of the month — so rendering "Jan 2025" for a year the owner only ever said "2025"
 *     would state a precision the content does not have. Month is the default because it
 *     is the finer of the two, and a wrong month is a smaller error than a wrong year.
 *   - `summary` is optional, unlike `projects.summary`. A CV states what was done rather
 *     than what the job was, so there is no honest one-liner to write for a role whose
 *     only source is its bullet points. The cap is still the same 180 characters, so the
 *     two collections agree on what "one line" means.
 *
 * Note for authors: quote the `highlights` strings. A bullet like
 * `Bug Triage: Isolated complex code defects` is a YAML mapping, not a string, the moment
 * it is unquoted, and the schema error then names the wrong field.
 */
/**
 * A role boundary from frontmatter, as a `Date`.
 *
 * `z.coerce.date()` on its own also accepts a NUMBER, and a bare year in YAML is a
 * number. `start: 2023` therefore arrives as the integer `2023`, `new Date(2023)` is 23
 * milliseconds after the Unix epoch, and the page renders "1970 - 1970" for a role that
 * ran from 2023 to 2025. The failure is silent and total — nothing is missing, the years
 * are simply wrong — so the number is rejected here and the author gets a message
 * instead. Quote the year (`start: "2023"`) or give it a month.
 *
 * Strings and `Date` are both accepted because both are what frontmatter can hold: the
 * YAML parser leaves `2023-01` and `2026-08-13` as strings, and only a bare integer comes
 * through as a number. `projects.date` still uses plain `z.coerce.date()` and carries the
 * same trap; it is a separate collection with its own contract and is not changed here.
 */
const roleDate = z
  .union([z.string(), z.date()])
  .transform((value) => new Date(value))
  .refine((date) => !Number.isNaN(date.valueOf()), { message: 'Not a parsable date' })

const experience = defineCollection({
  loader: glob({ base: './src/content/experience', pattern: '**/*.md' }),
  schema: z
    .object({
      /** Employer, as it should be displayed. */
      company: z.string().min(1),

      /** The job title. Rendered as the row heading, so it is the entry's subject. */
      role: z.string().min(1),

      /** City and country, or `Remote`. */
      location: z.string().min(1),

      /**
       * Whether the role was remote. Rendered as a word, never as a colour, because
       * "remote" is a fact about the job and a hue is not a fact.
       */
      remote: z.boolean().default(false),

      /** Start of the role. `2025-10` and `2025-10-06` both work. See `roleDate` above. */
      start: roleDate,

      /** End of the role. Omitted while the role is current. Checked below. */
      end: roleDate.optional(),

      /** Ongoing role. See the note above on why this is a flag and not an empty end. */
      current: z.boolean().default(false),

      /** How precisely the source dates this role. `year` suppresses the month. */
      granularity: z.enum(['month', 'year']).default('month'),

      /** One line for the row, when the source states one. See the note above. */
      summary: z.string().min(1).max(180).optional(),

      /** What was done, one bullet per string. At least one, or it is not a role yet. */
      highlights: z.array(z.string().min(1)).min(1),

      /** Tools and technologies, as they should be displayed. */
      stack: z.array(z.string()).default([]),
    })
    .superRefine((value, ctx) => {
      if (!value.current && !value.end) {
        ctx.addIssue({
          code: 'custom',
          path: ['end'],
          message: 'Required unless `current` is true. An ongoing role sets `current: true`.',
        })
      }
    }),
})

export const collections = { projects, experience }
