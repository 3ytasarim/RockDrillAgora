// Single source of truth for the static (non-product) pages of the site. Both
// the sitemap route (server/routes.ts) and the site navigation (header + footer
// under client/src/components) import from here, so the menus, the footer links
// and /sitemap-static.xml can never silently drift out of step with each other.
// The test that verifies the sitemap (tests/sitemap-coverage.test.ts) also
// imports this list, keeping it under test coverage too.
export interface StaticSitemapPage {
  url: string;
  priority: string;
  changefreq: string;
}

// A navigable page that appears in the header and/or footer navigation. These
// are the pages a visitor can click to from the chrome of the site, and they
// also feed straight into the sitemap (see STATIC_SITEMAP_PAGES below).
export interface NavPage extends StaticSitemapPage {
  // Display label used in the header/footer menus.
  label: string;
  // Whether this page appears in the header (desktop + mobile) navigation.
  inHeader: boolean;
  // Whether this page appears in the footer "Quick Links" navigation.
  inFooter: boolean;
}

export const NAV_PAGES: NavPage[] = [
  { url: "/", label: "Home", inHeader: true, inFooter: true, priority: "1.0", changefreq: "daily" },
  { url: "/spare-parts", label: "Spare Parts", inHeader: true, inFooter: true, priority: "0.9", changefreq: "daily" },
  { url: "/about", label: "About Us", inHeader: true, inFooter: true, priority: "0.8", changefreq: "monthly" },
  { url: "/contact", label: "Contact Us", inHeader: true, inFooter: true, priority: "0.8", changefreq: "monthly" },
  { url: "/privacy", label: "Privacy Policy", inHeader: false, inFooter: true, priority: "0.5", changefreq: "yearly" },
  { url: "/terms", label: "Terms & Conditions", inHeader: false, inFooter: true, priority: "0.5", changefreq: "yearly" },
];

// Convenience views over NAV_PAGES so the header and footer never re-declare
// their own page lists.
export const HEADER_PAGES: NavPage[] = NAV_PAGES.filter((p) => p.inHeader);
export const FOOTER_PAGES: NavPage[] = NAV_PAGES.filter((p) => p.inFooter);

// Brand-filter landing pages. These are indexable for SEO but are not menu
// items, so they live in the sitemap only (reached via the header's "By Brand"
// dropdown, not as standalone nav entries).
const BRAND_SITEMAP_PAGES: StaticSitemapPage[] = [
  { url: "/spare-parts?brand=Atlas%20Copco%20-%20Epiroc", priority: "0.85", changefreq: "daily" },
  { url: "/spare-parts?brand=Sandvik", priority: "0.85", changefreq: "daily" },
  { url: "/spare-parts?brand=Furukawa", priority: "0.85", changefreq: "daily" },
];

// The full list of static URLs exposed in /sitemap-static.xml: every navigable
// page (derived from NAV_PAGES so navigation and sitemap stay in lockstep) plus
// the brand-filter landing pages.
export const STATIC_SITEMAP_PAGES: StaticSitemapPage[] = [
  ...NAV_PAGES.map(({ url, priority, changefreq }) => ({ url, priority, changefreq })),
  ...BRAND_SITEMAP_PAGES,
];
