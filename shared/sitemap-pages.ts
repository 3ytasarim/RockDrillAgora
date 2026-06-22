// Single source of truth for the static (non-product) pages listed in
// /sitemap-static.xml. Both the route that builds the sitemap (server/routes.ts)
// and the test that verifies it (tests/sitemap-coverage.test.ts) import this
// list, so adding or removing a static page can never silently drift out of
// test coverage.
export interface StaticSitemapPage {
  url: string;
  priority: string;
  changefreq: string;
}

export const STATIC_SITEMAP_PAGES: StaticSitemapPage[] = [
  { url: "/", priority: "1.0", changefreq: "daily" },
  { url: "/spare-parts", priority: "0.9", changefreq: "daily" },
  { url: "/about", priority: "0.8", changefreq: "monthly" },
  { url: "/contact", priority: "0.8", changefreq: "monthly" },
  { url: "/privacy", priority: "0.5", changefreq: "yearly" },
  { url: "/terms", priority: "0.5", changefreq: "yearly" },
  { url: "/spare-parts?brand=Atlas%20Copco%20-%20Epiroc", priority: "0.85", changefreq: "daily" },
  { url: "/spare-parts?brand=Sandvik", priority: "0.85", changefreq: "daily" },
  { url: "/spare-parts?brand=Furukawa", priority: "0.85", changefreq: "daily" },
];
