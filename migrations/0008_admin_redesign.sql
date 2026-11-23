-- Admin redesign: link descriptions and per-click events for the dashboard
-- Run with: npx wrangler d1 execute linktree-db --local --file=./migrations/0008_admin_redesign.sql

-- Optional one-line description shown on the link's key
ALTER TABLE links ADD COLUMN description TEXT DEFAULT NULL;

-- One row per tracked click. links.clicks stays the all-time counter;
-- these rows power the dashboard (per day, per section, per source).
-- section_id is copied at click time so history survives a link moving sections.
CREATE TABLE IF NOT EXISTS click_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id INTEGER NOT NULL,
  section_id INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'direct',
  created_at INTEGER NOT NULL -- unix epoch milliseconds
);

CREATE INDEX IF NOT EXISTS idx_click_events_created ON click_events(created_at);
CREATE INDEX IF NOT EXISTS idx_click_events_link ON click_events(link_id, created_at);
