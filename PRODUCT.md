# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Owner (single admin):** Matías (MatiasTK), the only person who deploys and administers this instance. Uses `/admin` to create sections, add and reorder links, toggle visibility, read click counts, and edit global settings (title, description, profile initial/image). It is not a multi-tenant product and has no sign-up.
- **Visitors:** people who arrive from a social bio, a message, or a shared URL, usually on a phone. Their job takes seconds: recognise whose page it is, find the right link, and tap it. Some arrive straight on a section page (for example `/projects` or `/contact`) instead of the home page.

## Product Purpose

A self-hosted replacement for Linktree. One home page lists the owner's visible sections, each section has its own shareable page of links, and an admin panel keeps the content up to date without redeploying. It succeeds when a visitor reaches the intended destination in a tap or two, and when the owner can change the content in under a minute.

## Positioning

- **The owner keeps the data and the hosting.** It runs on the owner's own Cloudflare account (Workers + D1) with no third-party platform, no tracking vendor and no subscription.
- **Each section is a page you can share.** Each one has its own `/slug` URL with its own title, description and profile initial/image. A section can be hidden from the home page (`show_in_main = 0`) and still be reachable by its direct link, so the owner can hand out a focused page (for example "contact") on its own.
- **It doubles as a portfolio piece.** The page demonstrates the owner's engineering and design craft, and the footer credits MatiasTK. Quality of execution is part of what it communicates.

## Operating Context

- Visitors: mobile browsers opened from in-app webviews (Instagram, X, etc.) and from direct links. Pages are server-rendered at request time (`force-dynamic`) at the edge.
- Owner: desktop or mobile browser on `/admin`. Login is a password with HMAC-signed session cookies. Dev mode skips authentication.
- Content changes happen in the admin UI and are stored in D1. Schema migrations are applied by hand with wrangler.

## Capabilities and Constraints

- **Built:** sections CRUD with drag-and-drop order and home-page visibility; links CRUD with icon (from a Lucide-based icon set), visibility, order and click counting (recorded via `waitUntil`); a stats overview with the top links; a global settings key-value store; a light/dark theme toggle that follows the system preference and is saved in localStorage; rate-limited login (5 attempts per 15 min, 30 min lockout).
- **Stack (existing):** Next.js 15 App Router, React 19, Tailwind CSS 4, TypeScript, deployed through `@opennextjs/cloudflare` with Cloudflare D1. Everything must run in the Workers runtime.
- **Language:** the goal is a bilingual (English/Spanish) UI through i18n. **Not built yet:** today the UI is English only and the repo docs are in Spanish. How the language is picked (browser detection, a toggle, per-section) is undecided.
- **Planned, from `FIXES.MD`:** a per-section option to show or hide the profile image and the "back to home" link; using the link's favicon as its default icon; an optional short description per link; tests and CI (marked top priority).
- **Terms:** *section* (a group of links with its own slug page), *link*, *show in main* (whether a section appears on the home page), *display order*, *clicks*, *settings*.

## Brand Commitments

- Owner identity: MatiasTK, with a credit link to `https://github.com/MatiasTK` in the public footer.
- Light and dark modes are both first-class (the README lists them as a feature).

## Evidence on Hand

- Real content lives in the owner's D1 database. The seed data in `migrations/0001_initial.sql` is placeholder only (example.com URLs) and must not be presented as real content.
- `public/favicon.svg` and `src/app/favicon.ico` exist. There is no logo, photography or other brand asset in the repo.
- There are no testimonials, metrics or user counts. Do not invent any.

## Product Principles

1. **One tap to the destination.** The visitor's path from arrival to a link beats any decoration on the page.
2. **Every section stands on its own.** A section page must make sense to someone who never saw the home page.
3. **The owner stays in control.** Self-hosted, no third-party dependencies at runtime, and content edits without a redeploy.
4. **Craft is the message.** Since this is a portfolio piece, rough edges in performance, accessibility or polish count against the owner.
5. **Edge-friendly by default.** Features must work inside Cloudflare Workers and D1 limits.

## Accessibility & Inclusion

- Mobile-first, and usable inside in-app browser webviews.
- Both themes must stay readable. Interactive targets must be comfortable to tap on a phone.
- The future bilingual UI should set the correct `lang` attribute for each language (today it is fixed to `en`).
