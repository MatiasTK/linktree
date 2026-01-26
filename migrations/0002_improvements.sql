-- Migration: Add link groups and section profile fields
-- Run with: npx wrangler d1 execute linktree-db --local --file=./migrations/0002_improvements.sql

-- Add group_title to links for grouping within sections
ALTER TABLE links ADD COLUMN group_title TEXT DEFAULT NULL;

-- Add profile fields to sections
ALTER TABLE sections ADD COLUMN description TEXT DEFAULT NULL;
ALTER TABLE sections ADD COLUMN profile_initial TEXT DEFAULT NULL;
ALTER TABLE sections ADD COLUMN profile_image_url TEXT DEFAULT NULL;

-- Global settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('site_title', 'My Links'),
  ('site_description', 'All my important links in one place'),
  ('profile_initial', 'M'),
  ('profile_image_url', '');
