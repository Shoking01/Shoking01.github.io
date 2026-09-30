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
  /* THE TAGLINE DOES DOUBLE DUTY, and that is why it is a sentence and not a fragment.
   * It is the line under the role, AND it is this page's `meta description` and OG
   * description. In those last two it is read alone, with no page around it and no
   * context, so a ticket-title fragment that lands well in the hero reads as a fragment
   * in a search result.

   * REPLACED because the previous one had started to contradict the intro. That line was
   * a debugging thesis; the approved intro is a performance thesis, and a reader
   * arriving at the top of the page was being pitched two different developers.

   * The content is the owner's. Asked what kind of problem he wants to solve, he
   * answered that the goal is to fix bad performance, to push speed and consumption to
   * their limit, and that this is why he went further into Rust and GPUI. The claim that
   * the stack follows from the problem is his own, and it is the one worth carrying here
   * because it is what the two projects then demonstrate. */
  tagline:
    'I optimise application performance in Rust and GPUI — speed and resource consumption, pushed as far as they go.',
  /* A GitHub Pages repository named `<user>.github.io` is served from the subdomain
     ROOT, so the origin is `https://shoking01.github.io` and `base` stays `/`. That is
     the one deployment shape where the site paths need no rewriting: a project site at
     `/repo/` would instead require Astro's `base` to become `/Portfolio/` and every
     internal link to be rebased under it.

     This value is not cosmetic. The same string is read by `astro.config.mjs` for the
     sitemap and by `Seo.astro` for the canonical link, the Open Graph URL and the
     Twitter card, and `public/robots.txt` hardcodes it as well, so a wrong value makes
     all four wrong together. Change it in one place and it moves everywhere. */
  url: 'https://shoking01.github.io',
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
