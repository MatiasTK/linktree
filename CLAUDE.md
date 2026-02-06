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
- `sections/` - Sections CRUD
- `links/` - Links CRUD + click tracking
- `settings/` - Global settings key-value store

### Database Schema

- **sections**: slug, title, order, visibility
- **links**: icon, URL, click count, group, order
- **settings**: key-value store
- **login_attempts**: rate limiting
