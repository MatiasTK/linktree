-- Short links: /l/<code> redirects to any URL and records who followed it
-- Run with: npx wrangler d1 execute linktree-db --local --file=./migrations/0009_short_links.sql

CREATE TABLE IF NOT EXISTS short_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  clicks INTEGER NOT NULL DEFAULT 0, -- all-time human clicks
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- One row per visit to /l/<code>. Bots (link previews, crawlers) are kept with
-- is_bot = 1 so they can be shown apart, and never count as clicks.
-- visitor is a salted hash of IP + user agent + day: it counts unique visitors
-- per day without storing the IP.
CREATE TABLE IF NOT EXISTS short_link_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_link_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL, -- unix epoch milliseconds
  source TEXT NOT NULL DEFAULT 'direct',
  referrer_host TEXT,
  campaign TEXT,
  country TEXT, -- ISO 3166-1 alpha-2
  region TEXT,
  city TEXT,
  device TEXT, -- mobile | tablet | desktop
  browser TEXT,
  os TEXT,
  language TEXT,
  visitor TEXT,
  is_bot INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (short_link_id) REFERENCES short_links(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_short_link_clicks_link ON short_link_clicks(short_link_id, created_at);
CREATE INDEX IF NOT EXISTS idx_short_link_clicks_created ON short_link_clicks(created_at);
