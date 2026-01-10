# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Museum Moments is a curated archive of design inspiration. It's a Next.js 16 application with a PostgreSQL database (via Prisma), showcasing design "moments" across categories like Branding, Interfaces, Typography, etc. The project emphasizes editorial restraint and museum-catalog aesthetics.

## Development Commands

### Core Commands
- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production (runs Prisma migrations first)
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
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page with masonry grid
│   ├── m/[slug]/page.tsx  # Individual moment detail pages
│   ├── layout.tsx         # Root layout with fonts & metadata
│   └── [about|terms|privacy|submit]/ # Static pages
├── components/            # React components
│   ├── moment-card.tsx   # Card component for masonry grid
│   ├── category-filter.tsx # Client component for filtering
│   ├── moment-navigation.tsx # Prev/Next navigation
│   └── related-moments.tsx # Shows related moments by tags
└── lib/
    ├── db.ts             # Prisma client singleton
    ├── moments.ts        # Data access layer for Moment model
    └── color-extractor.ts # Extract dominant colors from images

prisma/
├── schema.prisma         # Database schema (single Moment model)
└── seed.ts              # Database seeding script
```

### Key Concepts

**Data Model (Moment)**
The core entity is `Moment` (see `prisma/schema.prisma`). Fields include:
- `slug` - URL-friendly identifier (unique)
- `category` - One of: Branding, Images, Interfaces, Objects, Spaces, Typography, Events, Illustration, Photography, Posters, Product/UI, Web Design, Misc
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
- Next.js Image component with remote patterns configured for `images.unsplash.com`
- Images are optional (moments can be text-only)

### Adding a New Moment

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
