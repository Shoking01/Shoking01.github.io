/**
 * Site identity.
 *
 * EVERY FIELD MARKED `TODO(you)` IS A PLACEHOLDER. Fill them in before deploying —
 * they are read by the nav, the footer, the page metadata and the sitemap, so a
 * leftover placeholder shows up in the rendered page, in the `<title>` and in social
 * cards, not just in this file.
 *
 * `url` is the canonical origin with no trailing slash. It is what makes the canonical
 * link, the Open Graph URL and `@astrojs/sitemap` agree with each other; if it is
 * wrong, all three are wrong in the same way.
 */

export interface SiteConfig {
  /** Display name. Used in the nav, the footer and the page titles. */
  name: string
  /** Short role line, e.g. "Backend & platform engineer". */
  role: string
  /** One-line summary. Used as the default meta description and the OG description. */
  tagline: string
  /** Canonical origin, no trailing slash. */
  url: string
  /** Locale for the generated sitemap and `hreflang`. The site is English-only. */
  locale: string
  /** Contact and profile links. Empty entries are not rendered. */
  links: {
    label: string
    href: string
  }[]
}

export const site: SiteConfig = {
  // TODO(you): your name as you want it shown.
  name: 'Your Name',
  // TODO(you): a short role line. Keep it to a few words; it sits in the hero.
  role: 'Software Engineer',
  // TODO(you): one sentence, under ~160 characters, describing what you work on.
  tagline: 'I build things that hold up in production.',
  // TODO(you): the production origin, with no trailing slash.
  url: 'https://example.com',
  locale: 'en',
  links: [
    // TODO(you): replace these, or delete the entries you do not want. A link with an
    // empty href is skipped rather than rendered as a dead anchor.
    { label: 'github', href: 'https://github.com/your-handle' },
    { label: 'linkedin', href: 'https://www.linkedin.com/in/your-handle' },
    { label: 'email', href: 'mailto:you@example.com' },
  ],
}
