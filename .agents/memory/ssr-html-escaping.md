---
name: SSR HTML escaping in routes.ts
description: How DB-sourced fields must be escaped when injected into server-rendered HTML/meta/JSON-LD in server/routes.ts
---

The SSR routes in `server/routes.ts` (`generateProductHtml` and the `/spare-parts` route) inject DB-sourced product/category fields directly into raw HTML strings, meta tags, and JSON-LD `<script>` blocks. These are NOT React-rendered, so they have no automatic escaping.

**Rule:** Any DB/user-derived value placed into SSR HTML must be escaped at the point of use.
- HTML text and double-quoted attributes → wrap in `escapeHtml()` (escapes `& < > " '`).
- JSON-LD → keep RAW (unescaped) values inside the JS object; `JSON.stringify` handles JSON escaping. Serialize with `safeJsonLd()` which only neutralizes `<` → `\u003c` to prevent `</script>` breakout. Do NOT HTML-escape values destined for JSON-LD (corrupts structured data with `&amp;` etc.).
- `String.prototype.replace()` with a string replacement interprets `$&`, `$1`, etc. — when the replacement contains user content, use a FUNCTION replacer (`() => ...`) so `$` is literal. Use `(m) => \`${m}...\`` when you need the matched group.

**Why:** A prior code review flagged a CRITICAL XSS/HTML-injection vector — product names/descriptions interpolated unescaped into SSR output. Resolved by adding `escapeHtml`/`safeJsonLd` helpers (top of routes.ts) and escaped `e*`-prefixed variants.

**How to apply:** When adding/editing any SSR HTML template in routes.ts, escape every dynamic field; mirror the existing `eName`/`eCode`/`eDescription` pattern and `safeJsonLd` usage.
