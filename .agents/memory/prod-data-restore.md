---
name: Production data restore path
description: How to restore lost production data when executeSql production is read-only
---
Production `executeSql` is read-only (SELECT only), so lost prod data cannot be re-inserted directly.
**Why:** Production products table was wiped once (July 2026); the only working restore path was replaying the public `POST /api/products` endpoint on the live site (agorarockdrill.shop) from the XML backup in `exports/agora-products.xml`.
**How to apply:** Keep periodic exports (XML/JSON) of prod data; to restore, POST through the live API with small concurrency and verify counts via read-only prod SQL. Note: the live product-create API is unauthenticated — a security risk worth flagging.
