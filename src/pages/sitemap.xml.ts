import type { APIRoute } from 'astro';
import { getAllGames } from '../utils/games.js';

export const GET: APIRoute = () => {
  const rawSiteUrl = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || '';
  const siteUrl = rawSiteUrl.trim().replace(/\/$/, '');
  const hasValidSiteUrl = siteUrl.startsWith('http://') || siteUrl.startsWith('https://');

  if (!hasValidSiteUrl) {
    return new Response(
      '<!-- Sitemap requires PUBLIC_SITE_URL environment variable to generate valid absolute URLs. -->',
      {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }

  const games = getAllGames();
  const pages = [
    { loc: `${siteUrl}/`, priority: '1.0', changefreq: 'daily' },
    ...games.map((g) => ({
      loc: `${siteUrl}/games/${g.slug}`,
      priority: '0.9',
      changefreq: 'daily',
      lastmod: g.lastUpdated,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${p.loc}</loc>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`.trim();

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
