/**
 * Site identity.
 *
 * One field is still a placeholder and MUST be filled in before deploying:
 *
 *   - `url` — the canonical origin. It is what makes the canonical link, the
 *             Open Graph URL, `@astrojs/sitemap` and `robots.txt` agree with each
 *             other; if it is wrong, all four are wrong the same way.
 *
 * Positioning: the site reads as a DEVELOPER portfolio. The support and RCA
 * experience is kept, because it is the differentiator, but it is framed as
 * something a developer brings rather than as the headline role.
 *
 * Every value here is read by the nav, the footer, the page metadata and the
 * sitemap, so a wrong one shows up in the rendered page, in the `<title>` and in
 * social cards, not just in this file.
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
  name: 'Adrián Quirós',
  role: 'Full-Stack Developer',
  // TODO(you): this line was drafted from the CV, not written by you. It is the
  // one string on the site a reader decides on, so replace it with your own words.
  tagline:
    'I build web applications, and then I find out why they break. Support work taught me to debug systems most developers only ever see from the outside.',
  // TODO(you): the production origin, with no trailing slash. Nothing deploys correctly without it.
  url: 'https://example.com',
  locale: 'en',
  links: [
    { label: 'github', href: 'https://github.com/Shoking01' },
    // UNVERIFIED. The CV renders this slug with accents; LinkedIn normalises
    // slugs to ASCII in practice, so confirm it from the browser address bar.
    // A live probe from this machine returned a connection-level block (no HTTP
    // response at all, for every variant tried), so it could not be checked here.
    { label: 'linkedin', href: 'https://www.linkedin.com/in/adrián-quirós' },
    { label: 'email', href: 'mailto:quirosadrian941@gmail.com' },
  ],
}
