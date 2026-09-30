import type { APIRoute } from 'astro'

import { site } from '../site.config'

/**
 * robots.txt, generated rather than shipped as a file.
 *
 * This used to live in `public/robots.txt` with the sitemap URL typed into it. Files in
 * `public/` are copied verbatim and never processed, so that hardcoded origin was the one
 * value on the site that could not follow `site.url` — moving the domain fixed the
 * canonical link, the Open Graph URL, the sitemap and robots.txt, and quietly left this
 * one still pointing at `example.com`. A search crawler would have been told the sitemap
 * lives at a domain that does not host it.
 *
 * As an endpoint it reads `site.url` like everything else, so there is now exactly one
 * place in the repository where the origin is written down.
 *
 * `sitemap-index.xml` rather than `sitemap-0.xml`: `@astrojs/sitemap` emits an index
 * alongside the chunk files, and the index is the stable name. Naming a numbered chunk
 * would break the day the site outgrows one chunk.
 */
export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap-index.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })