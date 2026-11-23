# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A self-hosted Linktree clone built on Cloudflare's edge infrastructure. Uses Next.js 15 App Router deployed via OpenNext Cloudflare adapter with Cloudflare D1 (SQLite) for the database.

## Commands

```bash
pnpm dev                    # Dev server with Turbopack (http://localhost:3000)
pnpm build                  # Production build
pnpm lint                   # ESLint
pnpm typecheck              # TypeScript type checking
pnpm cf-deploy              # Build and deploy to Cloudflare
pnpm preview                # Build and preview Cloudflare deployment locally
pnpm cf-typegen             # Generate Cloudflare types from wrangler.jsonc
```

### Database Migrations

```bash
# Local
npx wrangler d1 execute linktree-db --local --file=./migrations/0001_initial.sql

# Production
npx wrangler d1 execute linktree-db --file=./migrations/0001_initial.sql
```

## Architecture

### Runtime Environment

- **Edge-first**: Runs on Cloudflare Workers via `@opennextjs/cloudflare`
- **Database access**: Use `getDB()` from `src/lib/db.ts` which retrieves D1 from Cloudflare context
- **All public pages use `export const dynamic = 'force-dynamic'`** for SSR at request time

### Authentication

Custom session-based auth in `src/lib/auth.ts`:
- SHA-256 password hashing with salt
- HMAC-signed session tokens in cookies (7-day expiry)
- **Dev mode auto-authenticates** - no login required locally
- Rate limiting in `src/lib/rate-limit.ts` (5 attempts per 15 min, 30 min lockout)
- Protected routes: `/admin/*` and all mutating API endpoints

### Key Files

- `src/lib/db.ts` - D1 database helpers (`getDB()`, `query()`, `queryFirst()`, `execute()`)
- `src/lib/auth.ts` - Authentication utilities (`login()`, `getAuthUser()`, `requireAuth()`)
- `src/lib/types.ts` - TypeScript type definitions
- `wrangler.jsonc` - Cloudflare Workers config with D1 binding
- `migrations/` - SQL migration files (run manually with wrangler)

### Component Patterns

- Server components for data fetching, client components (`'use client'`) for interactivity
- `ToastProvider` and `ConfirmModalProvider` wrap the admin layout for notifications/dialogs
- `SortableList` component uses @dnd-kit for drag-and-drop reordering

### API Routes

RESTful design in `src/app/api/`:
- `auth/` - Login/logout
- `sections/` - Sections CRUD + `reorder`
- `links/` - Links CRUD + `reorder` + click tracking (`[id]/click` records a `click_events` row with its source)
- `settings/` - Global settings key-value store
- `projects/` - Portfolio projects CRUD + `reorder`
- `portfolio-profile/` - GET/PUT the /portfolio profile copy
- `favicon/[host]` - edge-cached favicon proxy, used when a link's icon is `auto`
- `short-links/` - short links CRUD (owner only)

`/l/[code]` (`src/app/l/[code]/route.ts`) is the short link redirect: 302 to the destination, the visit recorded with `waitUntil` (source from `?s=`/`utm_source` or the referrer, campaign from `?c=`/`utm_campaign`, geo from Cloudflare `cf`, device/browser/OS and bot detection from `src/lib/user-agent.ts`, a salted daily visitor hash). Paused or unknown codes go to `/`.

### Database Schema

- **sections**: slug, title, order, visibility
- **links**: icon (`auto` = the destination's favicon), URL, optional description, all-time click count, order
- **click_events**: one row per page click (link, section, source, epoch ms; plus country, city, device, browser, OS, language and daily visitor hash from `0010`) for the dashboard. Visit details come from `describeVisit()` in `src/lib/visit.ts`, shared with `/l/[code]`; bot beacons are dropped
- **settings**: key-value store
- **login_attempts**: rate limiting
- **short_links** / **short_link_clicks**: `/l/<code>` redirects and one row per visit, bots kept with `is_bot = 1` (`migrations/0009_short_links.sql`). `short_links.link_id` ties one to a page link (`0010_link_short_links.sql`): every http(s) link gets one by default (switch + code in the link editor), its destination and name follow the link via `shortLinksService.syncForLink`, and deleting the link leaves it standalone
- **projects**: portfolio projects (bilingual `_en`/`_es` text, stack, image/site/repo URLs, order, visibility)

### Admin

- Five areas: Dashboard (`/admin`, page clicks from `click_events` plus short link visits, merged in `stats.service.ts`), Links (sections and their links in one view), Short links (list + `/admin/short-links/[id]` stats), Portfolio, Settings
- `Workbench` without `previewPages` drops the phone preview and opens the editor as a sheet at every width
- Pages are server components that pass data to client workspaces in `src/components/admin/`
- `Workbench` lays out the list plus a right pane: a live phone preview (an iframe of the public page) that the editor panel replaces while open; docked from 1180px, a sheet below
- Styles live in `src/app/admin/admin.css`; the design direction is in `.impeccable/surfaces/src-app-admin-page-tsx.md`
- Public pages skip click tracking when framed (the preview)

### Portfolio

- `/portfolio` and `/portfolio/[slug]`: ES/EN via `?lang=` (falls back to Accept-Language)
- Projects live in D1 (`migrations/0007_portfolio.sql`); the profile (name, headline, spec sheet, experience, how I work, stack, education, credentials, contact text) is a JSON `portfolio_profile` row in `settings`, read through `portfolioProfileService` and sanitized by `src/lib/portfolio-profile.ts`. Both are edited in `/admin/portfolio`; `defaultProfile` in `src/content/portfolio.ts` is the fallback until the first save. UI chrome strings stay in `ui` there
- `portfolio` is a reserved slug (`RESERVED_SLUGS` in `src/lib/validation.ts`)
