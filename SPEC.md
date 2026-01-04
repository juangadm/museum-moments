# Museum Moments — Product & Architecture Spec

## Intent
Museum Moments is a public, SEO-first inspiration archive inspired by desigeist.com,
with the visual tone of museumgarments.com.

It is not a generic gallery or AI-generated feed.
Each entry is treated like a museum exhibit with a placard.

Ethos:
Stop the slop. Build the beautiful.

## Core Principles
- Editorial, calm, archival
- Strong curator voice
- Performance over cleverness
- No gamification, no infinite AI feeds
- Manual curation with light automation

## Product Structure

### Homepage
- TRUE masonry grid (variable height)
- Newest moments first
- Category filtering
- Simple search
- Cards link to internal detail pages

### Detail Page (/m/[slug])
- Title
- Meta row: CATEGORY • CREATOR • DATE ADDED
- Hero image
- Curator description (written voice)
- Tags
- Actions: Share, Visit Original
- Prev/Next navigation
- Keyboard arrows (← →)
- Swipe navigation on mobile
- Related moments (shared tags, fallback category)

### Navigation & Pages
- /about — manifesto + curator context
- /submit — redirects to Google Form (suggestions only)
- /terms, /privacy — simple static pages

## Data Model (Moment)
- id
- slug (unique)
- title
- category
- creatorName (optional)
- creatorUrl (optional)
- sourceUrl
- imageUrl (optional)
- description (curator text)
- tags (array, AI-assisted)
- publishedAt
- createdAt
- updatedAt
- ogTitle (optional)
- ogSiteName (optional)

## Categories (initial)
- Web Design
- Illustration
- Typography
- Branding
- Animation
- 3D
- Product / UI
- Photography
- Posters
- Events
- Misc

## Admin / Curation
- No user accounts
- Admin-only ingestion via secret route
- Submissions via Google Form
- AI used only for tag suggestions, never for descriptions

## Tech Constraints
- Next.js App Router
- TypeScript
- Tailwind
- SQLite initially (tags stored as Json)
- No auth
- SEO and performance matter

## Design System

### Typography
- Inter (ALL CAPS) for:
  - Site name
  - Categories
  - Tags
  - Buttons
  - UI labels
- Liter for:
  - Body text
  - Curator descriptions
  - Longer titles

### Visual Tone
- Museum catalog / archive
- Hairline borders
- Generous whitespace
- No shadows
- Restrained palette
