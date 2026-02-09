import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/settings', '/admin-login', '/reports', '/api/'],
      },
    ],
    sitemap: 'https://scraperagent.eu/sitemap.xml',
  };
}
