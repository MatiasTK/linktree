-- Migration: Remove group_order and group_title columns from links table
-- Run with: npx wrangler d1 execute linktree-db --local --file=./migrations/0005_remove_groups.sql

-- SQLite doesn't support DROP COLUMN directly in older versions
-- But D1 uses a modern SQLite version that supports it
ALTER TABLE links DROP COLUMN group_title;
ALTER TABLE links DROP COLUMN group_order;
