---
version: 1
slug: "src-app-admin-page-tsx"
primary_target: "src/app/admin/page.tsx"
related_targets: ["src/app/admin/layout.tsx","src/app/admin/links/page.tsx","src/app/admin/settings/page.tsx","src/app/admin/portfolio/page.tsx"]
---

# Admin (/admin): the owner's workbench

Mode: Operate. Audience: the single owner (MatiasTK), desktop and phone equally. Job: change sections, links, portfolio and settings in under a minute and see the public page react; read click traffic.
Inherits the Desk Keyboard world through tokens, type and detail only (owner choice: "Herramienta sobria + detalles"). Interface language: English.
Structure pinned by the owner in the interview: 4 areas (Dashboard, Links, Portfolio, Settings); sections and their links in one unified view; editing in a side panel; a live phone preview always on the right that the editor panel replaces while open; full-screen sheets on phone; bottom tab bar on phone, narrow rail on desktop. Dashboard with clicks per day (7/30/90), per section, link ranking with trend, and referrer source, recorded from a new click_events table (starts empty).
New data: optional link description; icon "auto" = the destination's favicon (default for new links).

## Direction contract

THESIS: The admin is the bench the keyboard sits on: one dense, quiet worklist of sections and their links beside a live phone showing the real public board. It refuses the SaaS dashboard of stat cards, a sidebar of ten items and modal-over-table editing.

OWN-WORLD: Case #ecebe7 ground, card #f7f6f3 rows on hairline #d3cfc7 borders, plate #d6d3cc wells. Charcoal modifier face #2b2b2e marks the current nav item (the held modifier). Orange #ff5a1f appears once per screen: the Save key in the editor, or the single primary action when no editor is open. Bricolage Grotesque for names and headings; JetBrains Mono 13px for every count, slug, domain, date and shortcut. Shortcuts render as small skirted keycaps. Night = same bench under .dark tokens.

STORY: The owner opens /admin/links, sees every section as a block with its links, clicks a link row, edits it in the panel, saves, and watches the phone preview reload with the change; drags to reorder; on the dashboard reads which links and sources are carrying traffic this week.

FIRST VIEWPORT: Desktop 1440: 76px rail at left (icon over mono label, current item on a charcoal cap); worklist column fluid with a 56px header (page title, New section, New link with N keycap); right pane 420px full height holding a phone frame (390 viewport scaled) with Home/section switcher. Phone 390: header, sections list full width, Preview button top right, 64px bottom tab bar.

FORM: seed: none (pinned) world: "Herramienta sobria + detalles" (inherit the site's colours, fonts and keycap detail); structure: "Vista unificada", "Panel lateral", "Preview fija, editor la reemplaza", "Navegación con 4 áreas". Signature interaction: saving presses the orange Save key (3px travel) and the preview frame reloads in place with a short plate-colored wipe. Motion grammar: 150–220ms ease-out state changes only; panel slides 24px; no load choreography; frozen under prefers-reduced-motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
