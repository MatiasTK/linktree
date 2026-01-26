-- Linktree Clone Database Schema
-- Cloudflare D1 (SQLite)

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  show_in_main INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sections_slug ON sections(slug);
CREATE INDEX IF NOT EXISTS idx_sections_display_order ON sections(display_order);

-- Links table
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_type TEXT DEFAULT 'link',
  is_visible INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_links_section ON links(section_id);
CREATE INDEX IF NOT EXISTS idx_links_display_order ON links(display_order);

-- Insert sample data for development
INSERT INTO sections (title, slug, show_in_main, display_order) VALUES
  ('Social Media', 'social', 1, 1),
  ('Projects', 'projects', 1, 2),
  ('Contact', 'contact', 0, 3);

INSERT INTO links (section_id, label, url, icon_type, is_visible, display_order) VALUES
  (1, 'GitHub', 'https://github.com', 'github', 1, 1),
  (1, 'Twitter / X', 'https://x.com', 'twitter', 1, 2),
  (1, 'Instagram', 'https://instagram.com', 'instagram', 1, 3),
  (2, 'Portfolio', 'https://example.com', 'globe', 1, 1),
  (2, 'Blog', 'https://blog.example.com', 'book-open', 1, 2),
  (3, 'Email', 'mailto:hello@example.com', 'mail', 1, 1);
