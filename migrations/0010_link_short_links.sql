-- Every page link gets a short link by default, and page clicks record the same
-- visit details as short link visits (geo, device, browser, OS, language, visitor).
-- Run with: npx wrangler d1 execute linktree-db --local --file=./migrations/0010_link_short_links.sql
-- Needs 0009_short_links.sql first.

-- The page link a short link belongs to (NULL: a standalone short link).
-- Its destination and name follow the link; deleting the link leaves it standalone.
ALTER TABLE short_links ADD COLUMN link_id INTEGER DEFAULT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_short_links_link ON short_links(link_id) WHERE link_id IS NOT NULL;

-- Visit details for clicks on the public page
ALTER TABLE click_events ADD COLUMN country TEXT;
ALTER TABLE click_events ADD COLUMN region TEXT;
ALTER TABLE click_events ADD COLUMN city TEXT;
ALTER TABLE click_events ADD COLUMN device TEXT;
ALTER TABLE click_events ADD COLUMN browser TEXT;
ALTER TABLE click_events ADD COLUMN os TEXT;
ALTER TABLE click_events ADD COLUMN language TEXT;
ALTER TABLE click_events ADD COLUMN visitor TEXT;

-- A short link for every existing page link (6 random hex characters)
INSERT INTO short_links (code, url, label, link_id)
SELECT lower(hex(randomblob(3))), url, label, id
FROM links
WHERE (url LIKE 'http://%' OR url LIKE 'https://%')
  AND id NOT IN (SELECT link_id FROM short_links WHERE link_id IS NOT NULL);
