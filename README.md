# Advanced Linktree Clone

A self-hosted Linktree clone built on Cloudflare's ecosystem - 100% free and optimized for SEO.

## Stack

- **Framework**: Next.js 15 (App Router) with `@opennextjs/cloudflare`
- **Database**: Cloudflare D1 (SQLite)
- **Styling**: Tailwind CSS v4 with automatic dark mode
- **Icons**: Lucide React
- **Auth**: Cloudflare Access (Zero Trust) for `/admin`

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Cloudflare account (free tier works)

### Local Development

```bash
# Install dependencies
pnpm install

# Create local D1 database and run migrations
npx wrangler d1 execute linktree-db --local --file=./migrations/0001_initial.sql

# Start development server
pnpm dev
```

Visit http://localhost:3000

### Deployment

#### 1. Create D1 Database

```bash
# Login to Cloudflare
npx wrangler login

# Create the D1 database
npx wrangler d1 create linktree-db
```

Copy the `database_id` from the output and update `wrangler.jsonc`:

```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "linktree-db",
    "database_id": "YOUR_ACTUAL_DATABASE_ID"
  }
]
```

#### 2. Run Migrations on Production

```bash
npx wrangler d1 execute linktree-db --file=./migrations/0001_initial.sql
```

#### 3. Deploy to Cloudflare Pages

```bash
pnpm deploy
```

### Protecting the Admin Panel

To protect `/admin` with Cloudflare Access:

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com)
2. Navigate to **Access** → **Applications**
3. Create a new application:
   - Type: Self-hosted
   - Application domain: `yourdomain.com`
   - Path: `/admin*`
4. Configure identity providers (e.g., GitHub, Google, email OTP)
5. Set access policies (e.g., allow specific emails)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── sections/     # Sections CRUD API
│   │   └── links/        # Links CRUD API + click tracking
│   ├── admin/            # Admin dashboard (Client Components)
│   ├── [slug]/           # Dynamic section pages (SSR)
│   └── page.tsx          # Home page (SSR)
├── components/
│   └── icons.tsx         # Lucide icon components
└── lib/
    ├── auth.ts           # Cloudflare Access utilities
    ├── db.ts             # D1 database helpers
    └── types.ts          # TypeScript types
```

## Features

- ✅ SSR public pages with dynamic SEO metadata
- ✅ Admin dashboard with CRUD for sections and links
- ✅ Click tracking analytics (async, non-blocking)
- ✅ Automatic dark mode based on system preference
- ✅ Icon selector with 30+ Lucide icons
- ✅ Visibility toggles for sections and links
- ✅ Zero cold starts with Cloudflare Workers

## License

MIT
