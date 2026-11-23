---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/[slug]/page.tsx","src/app/admin/layout.tsx","src/app/login/page.tsx"]
---

# Public link pages (home + /[slug]), extended to login and admin

Mode: Persuade (public pages); admin and login are Operate and inherit the world through tokens, type and detail only.
Audience: visitors from social bios on phones, in in-app webviews; the owner on /admin.
Job: recognise whose page it is, tap the right link in one or two taps. Owner edits in under a minute.
Constraints from the owner: modern, simple, techy, yet unique; signals an engineer's craft; not terminal/hacker, not SaaS dashboard; links never hard to find on a phone. Desktop matters as much as mobile.
Alternative kept for the future: docs/design-alternatives/pixel.html (the "Píxel" direction, not built).

## Direction contract

THESIS: Every section and every link is a physical keycap you actually press: by finger, pointer, or the number row. It refuses the centred avatar over a column of rounded pills.

OWN-WORLD: Warm gray case #ecebe7 / plate #d6d3cc, keycap face #f7f6f3 with a darker skirt below it, one charcoal modifier key #2b2b2e, one orange accent key #ff5a1f reserved for the primary/active key only. Bricolage Grotesque for names and key legends, JetBrains Mono for small labels, counts and hints. Controls are keycaps: sculpted face, 12px skirt that compresses on press, legend top-left number, arrow top-right. Dark theme = the same board at night: charcoal case, graphite caps, orange still the only warm light.

STORY: The visitor sees the owner's name huge, reads one line of bio, sees the keyboard of sections, presses one (or types 1–4); the section page is its own board whose keys are the links, each showing its destination domain; visited keys sit 1mm lower with a check.

FIRST VIEWPORT: Desktop 1440: name at left (~130px), bio under it, number-key hint at bottom-left; right half the board: a 2-column grid of large keys (one per section), primary in orange, a spacebar-wide footer key with the MatiasTK credit. Phone 390: name ~72px and bio in the top 35%, then full-width keys of ≥72px, first key above the fold.

FORM: Mechanical keyboard keycaps (owner-chosen grounded direction, round 4 hand, kept through round 5). seed:b2beeca6232216dc. Signature interaction: real key travel (skirt compresses, face drops 5px, 80ms) on pointer and on number-key press, then navigates. Motion grammar: short, precise, mechanical; one staggered key settle on load; frozen under prefers-reduced-motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
