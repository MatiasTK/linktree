-- Migration: Add group_order for link group ordering
-- Run with: npx wrangler d1 execute linktree-db --local --file=./migrations/0003_group_order.sql

ALTER TABLE links ADD COLUMN group_order INTEGER DEFAULT 0;
