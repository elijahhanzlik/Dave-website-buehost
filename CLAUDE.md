# David Schaldach Portfolio & Admin Portal

## About
Personal portfolio for David Schaldach — former certified arborist, now studio artist based in Boulder, CO. Tagline: "He was a certified arborist, now he's branching out."

## Stack
- **Framework**: Next.js 14 (App Router)
- **Database/Auth/Storage**: Supabase (Postgres + Auth + Storage)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Language**: TypeScript (strict mode)

## Project Structure
```
app/
├── (public)/           # Public-facing site (portfolio, about, blog, contact)
│   ├── layout.tsx
│   ├── page.tsx        # Homepage with hero
│   ├── works/          # Gallery grid + detail pages
│   ├── about/
│   ├── blog/
│   └── contact/
├── admin-panel/        # Admin CMS (protected route)
│   ├── layout.tsx      # Sidebar layout
│   ├── login/
│   ├── dashboard/
│   ├── works/          # CRUD + drag-reorder
│   ├── pages/          # Rich page editor
│   ├── blog/           # Blog post editor
│   ├── inquiries/      # Contact inbox
│   └── settings/       # Site settings
├── api/
│   ├── artworks/
│   ├── inquiries/
│   ├── settings/
│   ├── pages/
│   ├── blog/
│   └── upload/
components/
├── admin/
├── Navigation.tsx
├── ArtworkCard.tsx
└── ImageUploader.tsx
lib/
├── supabase/
├── validations.ts
└── formatters.ts
supabase/
└── schema.sql
```

## Design System
- **Palette**: Deep forest green (#2D5016 primary), warm cream/sage backgrounds (#F5F0E8, #E8EDE2), muted gold accents (#C4A265)
- **Typography**: Serif display font (e.g., Playfair Display or similar editorial serif) for headings. Clean sans-serif for body/nav (e.g., DM Sans)
- **Aesthetic**: Organic, warm, editorial. Glassmorphic cards with blurred nature backgrounds. The site should feel like walking through a forest — layered, textured, alive.
- **Nav**: Sticky top bar. "David Schaldach" left (serif, dark green). GALLERY | ABOUT | BLOG | CONTACT right (sans-serif, uppercase, letterspaced). Hamburger on mobile.

## Hero Image — Critical Requirement
The hero uses a full-bleed photo of David standing among mangrove/banyan tree roots. The tree canopy forms a natural HEART SHAPE when viewed from this angle. This heart silhouette MUST be visible on both desktop and mobile viewports. Use CSS `object-position` and responsive sizing to ensure the heart-shaped canopy is always in frame. On mobile, crop/position so the heart is centered in the upper portion. On desktop, the full scene is visible. Test both breakpoints.

## Key Patterns
- Server components fetch data → pass to `"use client"` components for interactivity
- API routes check auth + admin email for writes, allow public reads
- RLS policies in Supabase as second security layer
- Image uploads use signed URLs (client uploads directly to Supabase Storage)
- Middleware handles rate limiting + route protection for admin

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npx supabase start   # Local Supabase
```

## Conventions
- Use Zod for all input validation (lib/validations.ts)
- Server Actions for mutations where possible, API routes for complex flows
- All images served via Supabase Storage with Next.js Image optimization
- Admin route uses an obscured path (not /admin) — set via env var
- Commit messages: conventional commits (feat:, fix:, chore:)
