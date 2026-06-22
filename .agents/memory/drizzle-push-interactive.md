---
name: drizzle-kit push interactive prompt
description: Why adding a unique column to a populated table can't be done via `npm run db:push` with piped input, and what to do instead.
---

When adding a column with a `.unique()` constraint to a table that already has rows, `drizzle-kit push` shows an interactive TUI prompt ("add the constraint without truncating" vs "truncate"). This prompt requires a real TTY and does NOT accept piped stdin (`printf '\n' | npm run db:push` just hangs at the prompt).

**Why:** drizzle-kit's prompt is a TUI menu, not a line reader; piping closes/!TTY stdin so the selection never registers.

**How to apply:** For dev, add the column and backfill via raw SQL through the `executeSql` callback, in this order:
1. `ALTER TABLE <t> ADD COLUMN IF NOT EXISTS <col> text;`
2. Backfill values (compute in JS, `UPDATE ... WHERE id=...` per row), ensuring uniqueness.
3. `ALTER TABLE <t> ADD CONSTRAINT <t>_<col>_unique UNIQUE (<col>);`
The `shared/schema.ts` definition already matching means future `db:push` runs report no diff. For production, run the same SQL (column → backfill → constraint) via the database skill with `environment: "production"` after publish, because new rows get slugs automatically but pre-existing rows do not.
