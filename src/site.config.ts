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
    /* Supplied twice by the owner as his public profile URL, and kept on his authority:
       he can see the page, this environment cannot.

       Verification attempted and abandoned, with the result recorded so it is not
       re-attempted. LinkedIn answers every non-browser request from this machine with
       a connection-level failure and no HTTP response at all — code 999, not a 404 —
       via curl with and without a browser User-Agent, and via a separate fetch path.
       The search index surfaces five other Costa Rica profiles under a similar name and
       none of them is this CV, so no URL was inferred from it: guessing here would put
       a stranger's profile in a job-hunting portfolio.

       The accent is NOT evidence of error. Accented LinkedIn slugs do exist — a live
       example is another Adrian in this same search — so the earlier assumption that
       LinkedIn normalises slugs to ASCII was wrong, and the slug stands. */
    { label: 'linkedin', href: 'https://www.linkedin.com/in/adrián-quirós' },
    { label: 'email', href: 'mailto:quirosadrian941@gmail.com' },
  ],
}
