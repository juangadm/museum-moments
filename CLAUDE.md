# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Museum Moments is a curated archive of design inspiration. It's a Next.js 16 application with a PostgreSQL database (via Prisma), showcasing design "moments" across categories like Branding, Interfaces, Typography, etc. The project emphasizes editorial restraint and museum-catalog aesthetics.

## Development Commands

### Core Commands
- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production (`prisma migrate deploy` then `next build`)
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Database Commands
- `npm run db:seed` - Seed database with moments (runs `prisma/seed.ts`)
- `npm run db:migrate` - Run Prisma migrations in dev mode
- `npm run db:studio` - Open Prisma Studio to inspect database
- `npm run postinstall` - Generate Prisma client (runs automatically after install)

### Database Setup
1. Copy `.env.example` to `.env`
2. Update `DATABASE_URL` with your PostgreSQL connection string
3. Run `npm run db:migrate` to create tables
4. Run `npm run db:seed` to populate with sample moments

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS v4
- **Fonts**: Azeret Mono (display), Lora (body), Gupter Bold (logo)
- **Features**: React Compiler enabled, Image optimization

### Project Structure
```
src/
├── app/
│   ├── page.tsx              # Home page with masonry grid
│   ├── m/[slug]/page.tsx     # Individual moment detail pages
│   ├── admin/page.tsx        # Password-protected admin for adding moments
│   ├── about/page.tsx        # About page with Substack CTA
│   ├── api/
│   │   ├── upload/route.ts   # Vercel Blob image upload
│   │   └── moments/route.ts  # Create moment API
│   └── layout.tsx            # Root layout with fonts & metadata
├── components/
│   ├── moment-card.tsx       # Card component for masonry grid
│   ├── category-filter.tsx   # Client component for filtering
│   ├── moment-navigation.tsx # Prev/Next navigation
│   └── related-moments.tsx   # Shows related moments by tags
└── lib/
    ├── db.ts                 # Prisma client singleton
    ├── moments.ts            # Data access layer for Moment model
    └── color-extractor.ts    # Extract dominant colors from images

prisma/
├── schema.prisma             # Database schema (single Moment model)
└── seed.ts                   # Database seeding script
```

### Key Concepts

**Data Model (Moment)**
The core entity is `Moment` (see `prisma/schema.prisma`). Fields include:
- `slug` - URL-friendly identifier (unique)
- `category` - One of: Branding, Images, Interfaces, Objects, Spaces, Typography
- `tags` - JSON array stored as string (parsed in `src/lib/moments.ts`)
- `dominantColor` - Hex color extracted from image (used for hover overlays)
- `imageUrl` - Optional image (Unsplash or other remote URLs)
- `creatorName/creatorUrl` - Attribution
- `description` - Rich editorial description

**Data Access Layer (`src/lib/moments.ts`)**
- `getMoments({ category?, search? })` - Fetches and filters moments. Search is client-side filtering after DB fetch.
- `getMomentBySlug(slug)` - Fetch single moment
- `getAdjacentMoments(publishedAt)` - Get prev/next moments for navigation
- `getRelatedMoments(currentId, tags, category, limit)` - Score moments by shared tags + same category
- All functions parse the `tags` JSON string into array before returning

**Color Extraction**
`src/lib/color-extractor.ts` uses `sharp` to analyze images and extract dominant colors. This is used during seeding and powers the hover overlay effect on moment cards.

**Routing & Filtering**
- Home page (`/`) uses URL search params: `?category=Branding&q=search`
- Category filter is a client component that updates URL params
- Moments grid re-fetches on param change (Next.js handles caching)
- Individual moments at `/m/[slug]`

**Styling System**
- Tailwind v4 with custom CSS variables in `src/app/globals.css`
- Design tokens: `--font-display`, `--font-body`, `--font-logo`, `--rounding-{sm,md,lg}`
- Light mode only (no dark mode)
- "Museum catalog" aesthetic: hairline borders, generous whitespace, serif body text, uppercase display text with tracking

**Typography**
- Display text: `.font-display` → Azeret Mono, all caps, 0.1em tracking
- Body text: `.font-body` → Lora serif
- Logo: `.font-logo` → Gupter Bold

**Image Handling**
- Next.js Image component with remote patterns for `images.unsplash.com` and `*.public.blob.vercel-storage.com`
- Admin uploads go to Vercel Blob (1GB free tier)
- Images are optional (moments can be text-only)

### Adding a New Moment

**Via Admin UI (Recommended):**
1. Go to `/admin` and enter your password
2. Fill in the form and upload an image
3. Click Save - moment appears immediately

**Via Seed Script (for bulk import):**
1. Add entry to `prisma/seed.ts` moments array
2. Run `npm run db:seed` to upsert the new moment
3. The seed script will automatically extract the dominant color if `imageUrl` is provided

### Category Guidelines

Current categories (hardcoded in `src/components/category-filter.tsx`):
- All, Branding, Images, Interfaces, Objects, Spaces, Typography

When adding moments, use these standardized categories. Adding new categories requires updating both the filter component and potentially the seed data.

### Path Alias

`@/*` resolves to `src/*` (configured in `tsconfig.json`)

### React Compiler

This project has React Compiler enabled (`reactCompiler: true` in `next.config.ts`). Be mindful of compiler rules when writing components.

---

## Adding Content (For Curator)

### How to Access Admin
Navigate directly to: `https://museum-moments.com/admin` (or `localhost:3001/admin` locally)

There are no links to this page on the public site - it's a secret URL only you know.

### Adding a New Moment
1. Go to `/admin` and enter your password
2. Fill in the form:
   - **Title** (required): Name of the piece
   - **Category** (required): Pick from Branding, Images, Interfaces, Objects, Spaces, Typography
   - **Creator**: Who made it (optional)
   - **Source URL**: Link to the work (optional)
   - **Image** (required): Upload a screenshot
   - **Description** (required): 2-4 sentences explaining why this is good
   - **Tags**: Click suggestions or add your own
3. Click Save
4. Moment appears on the site immediately

### Screenshot Guidelines

**Taking Screenshots (Mac):**
- `Cmd + Shift + 4` → select area
- `Cmd + Shift + 4 + Space` → capture window (cleaner)
- Center on the interesting part - the grid crops to 3:4

**Ideal dimensions:** ~1200x1600px (3:4 portrait)
On Retina: select ~600x800 points = 1200x1600 actual

**Tips:**
- Capture wider than needed, grid auto-crops to center
- Avoid browser chrome when possible
- Focus on the most visually striking element

**If site lacks a good hero image:**
- Screenshot a specific detail
- Capture the product itself
- Use their homepage hero section

### Category Definitions
- **Branding** - logos, identity systems, brand guidelines
- **Images** - photography, illustration, posters, visual art
- **Interfaces** - web design, apps, product UI, dashboards
- **Objects** - physical products, hardware, packaging
- **Spaces** - architecture, interiors, retail environments
- **Typography** - typefaces, lettering, type systems

### Image Hosting
Images are uploaded to Vercel Blob automatically when you use the admin form.
Storage limit: 1GB on free tier.

---

## Environment Variables

### Required Variables
| Variable | Purpose | Where to set |
|----------|---------|--------------|
| `DATABASE_URL` | PostgreSQL connection (Neon) | `.env.local`, Vercel |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob uploads | `.env.local`, Vercel |
| `ADMIN_PASSWORD` | Admin page authentication | `.env.local`, Vercel |

### Gotchas
- **Avoid `$` in env values**: Both Next.js and Vercel expand `$` as variable syntax. Use `!` or other characters instead.
- **Local escaping**: If you must use `$` locally, escape with backslash: `ADMIN_PASSWORD=pass\$word`
- **Vercel**: Set env vars before deploying. If added after, redeploy to pick them up.

---

## Deployment & Prisma Migrations

### How Migrations Run in Production

The build command is `prisma migrate deploy && next build`. This applies any pending Prisma migrations to the production database **before** building the Next.js app. This is critical — without it, new database tables/columns won't exist at runtime.

### When Adding New Prisma Models or Fields

1. Create the migration locally: `npm run db:migrate`
2. Commit **both** the `schema.prisma` changes and the generated `prisma/migrations/` folder
3. On next deploy, `prisma migrate deploy` automatically applies the migration

**Do NOT** rely on `prisma generate` alone — it only creates TypeScript types. The actual database table is only created by `prisma migrate deploy`.

### Common Pitfalls

- **`prisma generate` vs `prisma migrate deploy`**: `generate` creates the TypeScript client (types compile, app builds). `migrate deploy` creates the actual tables in PostgreSQL. If you only have `generate`, the app builds fine but crashes at runtime with "table does not exist."
- **`dotenv` must be in `dependencies` (not `devDependencies`)**: `prisma.config.ts` imports `dotenv/config`. Since `prisma migrate deploy` runs at build time, `dotenv` must be available as a production dependency.
- **Honeypot field naming**: Never use recognizable field names like "website", "email", "url" for honeypot inputs — browsers and password managers will autofill them, silently triggering the spam filter on real users. Use obscure names that aren't in any autofill dictionary.

---

## Design Principles

This project prioritizes:
- **Simplicity**: Minimal dependencies, straightforward patterns
- **Editorial restraint**: Museum-catalog aesthetic, no visual clutter
- **Performance**: Static generation where possible, optimized images
- **Maintainability**: Clear file structure, consistent naming
