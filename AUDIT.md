# Repository Audit — David Schaldach Portfolio & Admin Portal

Audit date: 2026-08-12 · Branch `main` @ `63e0b85` · 108 commits since 2026-04-12

Read-only audit. No application code was modified in producing this document.

---

## 1. Stack & versions

Everything below is read from `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`
and `postcss.config.mjs` — not inferred.

| Concern | Choice | Version / source |
|---|---|---|
| Framework | Next.js App Router, Turbopack | `next` **16.2.3** |
| UI runtime | React | `react` / `react-dom` **19.2.4** |
| Language | TypeScript, **`strict: true`** | `typescript` ^5, `tsconfig.json` |
| Styling | Tailwind CSS **v4** — *no `tailwind.config.*` file exists* | `tailwindcss` ^4 + `@tailwindcss/postcss` |
| Database / Auth / Storage | Supabase | `@supabase/supabase-js` ^2.103.0, `@supabase/ssr` ^0.10.2 |
| Validation | Zod | `zod` ^4.3.6 |
| Transactional email | Resend | `resend` ^4.0.0 |
| Rich text | Editor.js suite | `@editorjs/editorjs` ^2.31.6 + 7 plugins + `@calumk/editorjs-columns` |
| Icons | `lucide-react` ^1.8.0 | |
| Class utils | `clsx` ^2.1.1 + `tailwind-merge` ^3.5.0 | |
| HTML parsing | `html-react-parser` ^6.0.1 | |
| Hosting | Vercel (dashboard-configured — **no `vercel.json` / `vercel.ts`**) | |

**Module resolution:** `"moduleResolution": "bundler"`, `"target": "ES2017"`, `"isolatedModules": true`,
`"skipLibCheck": true`, `"incremental": true`.
**Path alias:** `"@/*": ["./*"]` — rooted at the repo root, *not* a `src/` directory.
`tsconfig.json` carries a stale self-referential `"exclude": ["node_modules", "Dave-website-buehost"]`.

**Tailwind v4 note:** because there is no config file, the entire design system lives in
`app/globals.css` under `@import "tailwindcss"` + an `@theme inline { … }` block. Adding a color or
font token means editing that CSS file, not a JS config.

---

## 2. Commands

Copied verbatim from `package.json` `scripts`, plus the typecheck command implied by
`tsconfig.json` and already allowlisted in `.claude/settings.local.json`.

| Purpose | Command | Where it comes from | Verified result (2026-08-12) |
|---|---|---|---|
| Dev server | `npm run dev` | `"dev": "next dev"` | not run during audit |
| Production build | `npm run build` | `"build": "next build"` | **passes** — 59 static pages generated |
| Lint | `npm run lint` | `"lint": "eslint"` (bare; flat config) | **exit 0 — 0 errors, 19 warnings** |
| Typecheck | `npx tsc --noEmit` | **No script exists.** `tsconfig.json` sets `"noEmit": true`; `.claude/settings.local.json` allowlists `Bash(npx tsc *)` | **exit 0, clean** |
| Start (prod) | `npm run start` | `"start": "next start"` | not run during audit |
| **Test** | **— none —** | No `test` script, no framework, no test files | see §7 |

**Lint baseline is 19 warnings, 0 errors.** ESLint exits 0 on warnings, so "exit 0" alone is not a
sufficient gate — the warning count must not grow. The 19 are: 16 × `@next/next/no-img-element`
(raw `<img>` in admin-only components, deliberate — see §8), 1 × unused `router` in
`admin/pages/[id]/page.tsx:57`, 1 × `react-hooks/exhaustive-deps` in `ImageUploader.tsx:91`,
1 × `@next/next/no-page-custom-font` in `app/layout.tsx:24`.

**Two build-time warnings worth knowing:**
1. `The "middleware" file convention is deprecated. Please use "proxy" instead.` — Next 16 is
   deprecating `middleware.ts`. Not yet actioned.
2. `Next.js inferred your workspace root … selected /Users/eli/package-lock.json` — a stray lockfile
   in the home directory outranks the repo's own. Fixable with `turbopack.root` in `next.config.ts`.

**CI: none.** There is no `.github/` directory — no workflows, no PR templates, no Dependabot.
PRs #29–#35 exist in history, so review happened on GitHub with zero automation.

---

## 3. Directory layout & where the complexity lives

79 `.ts`/`.tsx` files, ~11,225 lines across `app/`, `components/`, `lib/`, `types/`, `supabase/`.
Single app, no monorepo, no workspaces.

```
app/
├─ layout.tsx, globals.css          # root shell + the entire Tailwind v4 theme
├─ (public)/                        # 12 public routes, all `export const revalidate = 300`
├─ dave-admin-website-wonderland/   # obscured admin CMS
│  ├─ login/                        # client, signInWithPassword
│  └─ (authenticated)/              # ← the real auth gate lives in this layout.tsx
└─ api/                             # 15 route.ts files
components/       # 6 public + 7 admin (incl. blog-editor/ and blog-renderer/ subdirs)
lib/              # supabase/{client,server,middleware,admin,public}.ts + validations, formatters, email, image
supabase/         # schema.sql + 4 migrations + 1 seed
types/            # editorjs-modules.d.ts (module shims typed `unknown`)
```

### Largest files (real complexity)

| Lines | File |
|---|---|
| 546 | `app/dave-admin-website-wonderland/(authenticated)/pages/[id]/page.tsx` — Editor.js page builder |
| 462 | `app/(public)/HomeClient.tsx` — hero + heart canopy + featured grid |
| 452 | `app/dave-admin-website-wonderland/(authenticated)/settings/page.tsx` |
| 300 | `components/admin/ImagePositionPicker.tsx` |
| 282 | `app/(public)/works/[id]/page.tsx` |
| 265 | `components/admin/WorkForm.tsx` |
| 264 | `app/(public)/pages/[slug]/page.tsx` |
| 259 | `supabase/schema.sql` |
| 255 | `lib/formatters.ts` |
| 252 | `components/admin/ImageCropEditor.tsx` |
| 243 | `components/admin/blog-renderer/EditorJsRenderer.tsx` |
| 238 | `lib/supabase/public.ts` |

### Most-churned files (commit count, last 200 commits)

| Commits | File | What that tells you |
|---|---|---|
| 20 | `lib/validations.ts` | **the single hottest file** — every content-model change lands here |
| 16 | `app/(public)/HomeClient.tsx` | hero/homepage is iterated constantly |
| 15 | `app/(public)/about/page.tsx` | |
| 14 | `app/(public)/exhibits/page.tsx` | exhibits is the newest, least-settled feature |
| 12 | `app/(public)/works/page.tsx` | |
| 11 / 10 | `app/(public)/blog/[slug]/page.tsx`, `blog/page.tsx` | |
| 9 | `supabase/schema.sql`, `app/api/inquiries/route.ts`, admin exhibits pages | inquiries email delivery was fixed repeatedly |

Churn concentrates in **public page rendering** and **the content model (Zod + SQL) moving together**.

### Client vs server split

**54 `.tsx` component files: 29 `"use client"` / 25 server.** The entire authenticated admin tree is
client-rendered (18 pages + login); all public pages and all 5 `loading.tsx` skeletons are server
components. Sole server component in the admin tree: `(authenticated)/works/new/page.tsx`.

---

## 4. Data layer

No Supabase CLI project — there is no `supabase/config.toml` and no `functions/`. SQL is applied by
hand in the Supabase SQL editor or through the Supabase MCP `apply_migration` tool
(already allowlisted in `.claude/settings.local.json`).

### Tables (7, all with RLS enabled)

| Table | Purpose | Notable columns |
|---|---|---|
| `artworks` | Gallery pieces ("Works") | `images text[]`, `category`, `sort_order int`, `is_featured bool` |
| `blog_posts` | Blog, Editor.js content | `slug unique`, `content text`, `content_blocks jsonb`, `status draft\|published`, `published_at` |
| `pages` | CMS-editable static pages | `slug unique`, `content_blocks jsonb` |
| `exhibits` | Exhibits with enriched detail hero | `content_blocks jsonb` **(DEPRECATED 2026-05)**, `cover_image`, `sort_order`, freeform `event_dates`/`event_time`/`address`, structured `start_date`/`end_date` |
| `events` | "Events & Services" | `start_date`, `end_date` (public list orders by `end_date` desc) |
| `inquiries` | Contact-form inbox | `status new\|read\|replied\|archived` |
| `site_settings` | Key/value site config | `key text primary key`, `value text not null` |

### RLS pattern

Three shapes, applied consistently:

- **Fully public read** (`artworks`, `pages`, `site_settings`): `for select using (true)`
- **Draft-gated read** (`blog_posts`, `exhibits`, `events`):
  `using (status = 'published' or auth.role() = 'authenticated')`
- **Inverted** (`inquiries`): anon may `insert with check (true)`; `select`/`update`/`delete` are
  `to authenticated`. Anon can write but **not read back** — this is why `POST /api/inquiries`
  generates the row id client-side instead of using `.select()`.

All write policies are `to authenticated with check (true)`. **There is no per-user or per-email
check at the database layer** — admin identity is enforced only in application code (§6).
`site_settings` has insert + update policies but no delete policy.

### Storage

One bucket, created in `schema.sql`:

```sql
insert into storage.buckets (id, name, public)
  values ('artwork-images', 'artwork-images', true)
  on conflict do nothing;
```

Policies on `storage.objects` scoped to `bucket_id = 'artwork-images'`: public `select`,
authenticated `insert`, authenticated `delete`. **No `update` policy** — overwriting an existing
object path would fail. Referenced only in `app/api/upload/route.ts`.

### Migrations, in application order

`supabase/schema.sql` is a canonical *current-state* document, **not** idempotent (plain
`create table public.x`, would fail on re-run). The files in `supabase/migrations/` **are**
idempotent and were each written as a production hotfix.

| File | What it does |
|---|---|
| `001_exhibits.sql` | Creates `exhibits` + 4 RLS policies. Ends with `notify pgrst, 'reload schema';`. Written for the error `"Could not find the table 'public.exhibits' in the schema cache"`. Still contains the since-dropped `published_at`. |
| `002_exhibit_event_fields.sql` | `add column if not exists` for `event_dates`, `event_time`, `address` on `exhibits`. |
| `002_inquiries_policies.sql` | Re-creates `inquiries` if missing and re-asserts all 4 policies. Written for `"new row violates row-level security policy for table \"inquiries\""`. |
| `003_events_and_exhibit_dates.sql` | Creates `events` + policies; adds `start_date`/`end_date` to `events` and `exhibits`; **`drop column if exists published_at`** on both. |

`supabase/seed_logans_espresso.sql` seeds the "Logan's Espresso Cafe" exhibit plus four
`home_exhibit_*` settings rows; it hardcodes a project ref.

---

## 5. API surface

15 `route.ts` files under `app/api/`. **There are zero Server Actions** — `grep -rn "use server"`
returns nothing across `app/`, `components/`, `lib/`, despite `next.config.ts` configuring
`experimental.serverActions.bodySizeLimit: "10mb"` and CLAUDE.md claiming Server Actions are used.
Every admin mutation is a client-side `fetch()` to `/api/*`.

| Route | Methods | Auth | Validation | Revalidates |
|---|---|---|---|---|
| `api/artworks/route.ts` | GET, POST | GET public · POST `requireAdmin()` | `artworkSchema` | `artworks` |
| `api/artworks/[id]/route.ts` | GET, PUT, DELETE | GET public · writes admin | `artworkSchema.partial()` | `artworks` |
| `api/artworks/reorder/route.ts` | PUT | admin | inline `reorderSchema` | `artworks` |
| `api/blog/route.ts` | GET, POST | GET public (`?all=true` includes drafts) · POST admin | `blogPostSchema` | `blog_posts` |
| `api/blog/[id]/route.ts` | GET, PUT, DELETE | GET public · writes admin | `blogPostSchema.partial()` | `blog_posts` |
| `api/events/route.ts` | GET, POST | GET public (`?all=true`) · POST admin | `eventSchema` | `events` |
| `api/events/[id]/route.ts` | GET, PUT, DELETE | GET public · writes admin | `eventSchema.partial()` | `events` |
| `api/exhibits/route.ts` | GET, POST | GET public (`?all=true`) · POST admin | `exhibitSchema` | `exhibits` |
| `api/exhibits/[id]/route.ts` | GET, PUT, DELETE | GET public · writes admin | `exhibitSchema.partial()` | `exhibits` |
| `api/pages/route.ts` | GET, POST | GET public · POST admin | `pageSchema` | `pages` |
| `api/pages/[id]/route.ts` | GET, PUT, DELETE | GET public · writes admin | `pageSchema.partial()` | `pages` |
| `api/inquiries/route.ts` | GET, POST | GET admin · **POST intentionally public** | `inquirySchema` | — (never cached) |
| `api/inquiries/[id]/route.ts` | GET, PUT, DELETE | all admin | `inquiryStatusSchema` | — |
| `api/settings/route.ts` | GET, PUT | GET public · PUT admin | inline `bulkSettingsSchema`; `export const maxDuration = 30` | `site_settings` |
| `api/upload/route.ts` | POST | admin | **manual only — no Zod** | — |

### Response-shape conventions (uniform across all 13 CRUD routes)

```ts
// read
return NextResponse.json(data);
// create
return NextResponse.json(data, { status: 201 });
// delete / bulk
return NextResponse.json({ success: true });     // except POST /api/inquiries → { ok: true }
// validation failure — an OBJECT, not a string
return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
// db failure
return NextResponse.json({ error: error.message }, { status: 500 });
// unconfigured Supabase
return NextResponse.json([], { status: 200 });   // list GETs — graceful empty
return NextResponse.json({ error: "Database not configured" }, { status: 503 });  // detail GETs
```

`lib/formatters.ts` → `formatApiError()` exists specifically to render the
`{ formErrors, fieldErrors }` object client-side. The only deviation from the shape is
`api/settings/route.ts:42`, which returns `{ error: JSON.stringify(parsed.error.format?.() ?? parsed.error) }`.

**POST validates with the full schema; PUT uses `schema.partial()`.** Applied without exception.

---

## 6. Auth, email, and other sensitive subsystems

### Admin identity

Supabase email+password, a **single admin identified by the `ADMIN_EMAIL` env var**. No roles table,
no JWT claims, and **no service-role key anywhere in the codebase** — every write runs through the
signed-in user's RLS-scoped client.

The email is checked in exactly two places:

```ts
// lib/supabase/admin.ts:22 — gates every API write
const adminEmail = process.env.ADMIN_EMAIL;
if (adminEmail && user.email !== adminEmail) {
  return { authorized: false, status: 403, error: "Forbidden" };
}
```
```ts
// app/dave-admin-website-wonderland/(authenticated)/layout.tsx:24 — gates every admin page
const adminEmail = process.env.ADMIN_EMAIL;
if (adminEmail && user.email !== adminEmail) {
  redirect("/dave-admin-website-wonderland/login");
}
```

`requireAdmin()` returns a discriminated union and hands back the authenticated client for the
mutation: `503` unconfigured → `401` no user → `403` wrong email → `{ authorized: true, user, supabase }`.

### Middleware

`middleware.ts` does three things, and **route blocking is not one of them**:

1. **Rate limiting**, `/api/*` only — an in-memory `Map<ip, {count, timestamp}>`, 60 requests / 60 s
   per `x-forwarded-for` first hop → `429 { error: "Too many requests" }`. The code comments that it
   is per-process ("use Redis in production"); on Vercel each instance keeps its own map, so this is
   advisory at best. A missing header collapses all callers onto the shared key `"unknown"`.
2. **Session refresh** via `updateSession(request)` on essentially every matched path.
3. For `/${ADMIN_ROUTE}` it only refreshes and returns. The file says so:
   ```ts
   // For all other admin routes, check if user is authenticated
   // The session cookie is refreshed by updateSession; the actual
   // auth gate is enforced via the admin layout's server component.
   ```

Matcher: `"/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"`.

### Contact inquiries → Resend

`lib/email.ts` sends from a hardcoded verified domain,
`"Davidschaldach Inquiry <websiteinquiry@send.davidschaldach.com>"`, with `replyTo: inquiry.email`.
Plain text, no templates. Throws if `RESEND_API_KEY` or `ADMIN_EMAIL` is missing.

Two deliberate quirks in `POST /api/inquiries`, both the residue of bug-fix commits:

```ts
const inquiryId = crypto.randomUUID();
const { error } = await supabase
  .from("inquiries")
  .insert({ id: inquiryId, ...parsed.data });   // no .select() — anon has no SELECT policy
```
```ts
try {
  await sendInquiryNotification(parsed.data);
} catch (err) {
  console.error("[inquiries] failed to send notification email", { inquiryId, ... });
}
return NextResponse.json({ ok: true }, { status: 201 });   // visitor still sees success
```

### Uploads

`POST /api/upload` mints a Supabase Storage signed upload URL and returns
`{ signedUrl, token, path, publicUrl }`. The client (`components/ImageUploader.tsx`) PUTs directly to
Supabase, and **falls back to inlining a base64 data URL** if that fails.

### Billing

None. There is no payment provider, no Stripe, no subscription logic anywhere in the repo.

### Environment variables (exhaustive)

| Variable | Read at |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/{client,server,middleware,public}.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase/{client,server,middleware,public}.ts` |
| `ADMIN_EMAIL` | `lib/supabase/admin.ts`, `(authenticated)/layout.tsx`, `lib/email.ts` |
| `ADMIN_ROUTE` | `middleware.ts` **only** |
| `RESEND_API_KEY` | `lib/email.ts` only |
| `NEXT_PUBLIC_SITE_URL` | **declared in `.env.example` and `.env.local`, read nowhere** |

---

## 7. Test setup

**There is none.** Stated plainly because it changes how every change to this repo must be verified:

- No `*.test.*`, `*.spec.*`, `__tests__/`, `e2e/`, or `*.stories.*` files anywhere outside `node_modules`.
- No `jest.config`, `vitest.config`, `playwright.config`, or `cypress.config`.
- No test dependency in `package.json` — no jest, vitest, playwright, cypress, testing-library.
- No `test` script.
- No CI to run anything even if tests existed.
- The `# testing` → `/coverage` stanza in `.gitignore` is inherited `create-next-app` boilerplate,
  not evidence of a removed suite.

**Coverage gap, therefore, is total.** The only automated signals available are
`npx tsc --noEmit`, `npm run lint`, and `npm run build`. Highest-value untested surfaces, by risk:
the `requireAdmin` gate, the RLS policies, `formatters.blocksToPreview` / entity decoding,
`formatApiError` shape handling, and the inquiry → email → inbox path (which has already broken
in production three times: commits `b8bcdee`, `c535ecc`, PR #32).

---

## 8. Conventions in force

**Graceful degradation is repo-wide.** Every Supabase client factory returns `null` rather than
throwing when env vars are missing, and every caller handles the null:

```ts
const supabase = await createClient();
if (!supabase) {
  return NextResponse.json([], { status: 200 });
}
```

Cached public readers swallow errors and return an empty list:

```ts
export const getArtworks = unstable_cache(
  async (): Promise<PublicArtwork[]> => {
    try {
      const supabase = createPublicClient();
      if (!supabase) return [];
      const { data } = await supabase.from("artworks").select("*").order("sort_order", { ascending: true });
      return data ?? [];
    } catch {
      return [];
    }
  },
  ["public:artworks"],
  { revalidate: PUBLIC_REVALIDATE, tags: ["artworks"] },
);
```

`lib/email.ts` is the only module that throws — and its single caller catches.

**Public reads never touch cookies.** `lib/supabase/public.ts` documents why:

> Unlike `lib/supabase/server.ts` (which reads `cookies()` and therefore forces every consuming
> route into dynamic rendering), this client uses only the public anon key with no request cookies.
> That keeps public pages statically prerenderable.

**Cache tags are symmetric and there are exactly six**: `artworks`, `blog_posts`, `exhibits`,
`events`, `pages`, `site_settings` — each declared in an `unstable_cache({ tags })` and invalidated
by a matching `revalidateTag(tag, { expire: 0 })` in every write handler. Every public page sets
`export const revalidate = 300`; five detail routes add `generateStaticParams()`.

**Slug validation is copy-pasted 4×**, identically:
`.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")`.

**Editor.js round-tripping** relies on `.passthrough()`:
```ts
// passthrough() preserves Editor.js block metadata (id, tunes) on round-trip.
export const contentBlockSchema = z.object({ type: z.string(), data: z.record(z.string(), z.unknown()) }).passthrough();
```

**Migrations are idempotent by construction** — `create table if not exists`,
`add column if not exists`, and `drop policy if exists` before every `create policy`, so a file can
be pasted into the SQL editor twice without damage.

**Public pages carry `PLACEHOLDER_*` demo data** (e.g. six artworks in `app/(public)/works/page.tsx`)
used when Supabase returns nothing, which is why `picsum.photos` is in `next.config.ts` remotePatterns.

**Raw `<img>` is used deliberately in admin components** (crop editors, position pickers, upload
previews) where `next/image` cannot help — these produce 16 of the 19 lint warnings. Public-facing
images go through `next/image` with `placeholder="blur"` and the shared `BLUR_DATA_URL`.

**Commit style:** conventional commits (`feat(exhibits):`, `fix(inquiries):`, `chore:`).

---

## 9. Rendering profile (from a real `npm run build`)

All 12 public routes prerender. Nothing on the public site is dynamic:

```
┌ ○ /                      5m   1y        ● /blog/[slug]      5m  1y
├ ○ /about                 5m   1y        ● /exhibits/[slug]  5m  1y
├ ○ /blog                  5m   1y        ● /events/[slug]
├ ○ /contact               5m   1y        ● /pages/[slug]     5m  1y
├ ○ /events /exhibits /works  5m 1y       ● /works/[id]       5m  1y
```

`ƒ` (dynamic) is limited to the 15 API routes and the admin tree — which is correct, since admin
pages read cookies. `○ /dave-admin-website-wonderland/login` is static.
**A public route flipping from `○`/`●` to `ƒ` is a regression**, and the build output is the check.

---

## 10. `.claude/` contents

Before this audit, `.claude/` contained exactly one file and no agents or commands.

`.claude/settings.local.json` — a permissions allowlist only:
`Bash(npx tsc *)`, `Bash(npm run *)`, `Bash(npx eslint *)`,
`Bash(git add|commit|push|checkout|stash|pull *)`, and three Supabase MCP tools
(`list_projects`, `apply_migration`, `list_tables`).

`CLAUDE.md` at the repo root holds the project spec. Its conventions section is still accurate
(Zod everywhere, obscured admin route, RLS as a second layer, conventional commits) and it carries a
hard product requirement worth preserving: the heart-shaped tree canopy in the hero **must** be
visible on both desktop and mobile.

---

## 11. Drift, risks, and rough edges

Recorded, not fixed. Nothing here was acted on during this audit.

**Security**
1. Both admin checks are `if (adminEmail && …)`. If `ADMIN_EMAIL` is unset in an environment the
   check silently no-ops, and any authenticated Supabase user becomes a full admin — RLS will not
   stop them either, since every write policy is `to authenticated with check (true)`.
2. `GET /api/blog`, `/api/events`, `/api/exhibits` accept `?all=true` and return `draft` rows with
   no auth check. Draft confidentiality rests entirely on RLS.
3. `POST /api/upload` validates only `if (!filename || !contentType)` — no Zod, no MIME or extension
   allowlist — then mints a signed upload URL into a **public** bucket.
4. The in-memory rate limiter does not survive serverless instance boundaries.

**Correctness / drift**
5. `artworkSchema.image_crops` (a `Record<string, {x, y, zoom}>`) has **no corresponding column** in
   `supabase/schema.sql`.
6. Two migrations share the `002` prefix (`002_exhibit_event_fields.sql`, `002_inquiries_policies.sql`),
   so ordering between them is ambiguous.
7. `supabase/seed_logans_espresso.sql` still writes `published_at`, which migration `003` drops —
   running it post-003 errors.
8. `exhibits.content_blocks` is marked `DEPRECATED 2026-05` but still exists and still ships.
9. `ADMIN_ROUTE` is honored only in `middleware.ts`; the directory name, all three `redirect()`
   targets in the authenticated layout, the login page's push target, and `ADMIN_BASE` in
   `AdminNav.tsx:24` hardcode `dave-admin-website-wonderland`. Changing the env var breaks the app
   rather than moving the panel.
10. `NEXT_PUBLIC_SITE_URL` is declared in both env files and read nowhere — there is no
    `metadataBase`, no `sitemap.ts`, no `robots.ts`, and no `not-found.tsx` / `error.tsx` anywhere.
11. `.env.local` has no `RESEND_API_KEY`, so locally the contact form succeeds while silently
    logging `[email] RESEND_API_KEY is not set`.

**Documentation**
12. `CLAUDE.md` says "Next.js 14 (App Router)" (actual: 16.2.3), claims "Server Actions for
    mutations where possible" (actual: zero), and its directory tree omits `exhibits/` and `events/`.
13. `README.md` is untouched `create-next-app` boilerplate.

**Hygiene**
14. A **236 MB** `Screen Recording 2026-06-04 at 00.00.43.mov` sits at the repo root. The single
    uncommitted working-tree change is the `*.mov` line added to `.gitignore` to cover it.
15. `tsconfig.tsbuildinfo` (159 KB) is present at the root despite `*.tsbuildinfo` being ignored.
16. A stray `/Users/eli/package-lock.json` outranks the repo lockfile for Turbopack's root inference.

---

## 12. Agent roster derived from this audit

Six agents were created in `.claude/agents/`, one per lane of recurring work identified above.

| Agent | Lane | Anchored in |
|---|---|---|
| `public-site-ui` | Public markup, layout, styling, responsiveness | §3 churn (HomeClient 16, about 15, exhibits 14, works 12), CLAUDE.md hero rule |
| `admin-cms-ui` | Admin screens, Editor.js, crop/position, drag-reorder | §3 largest files (546/452/300/265 lines) |
| `content-api` | Route handlers, Zod contracts, Resend | §5; `lib/validations.ts` is the hottest file at 20 commits |
| `supabase-schema` | Tables, columns, RLS, storage policies, migrations | §4; drift items 5–8 |
| `render-caching` | Cache tags, static rendering, `next/image` | §9; the three most recent commits (#33–#35) are all this |
| `auth-and-middleware` | Admin gate, session, rate limiting, env wiring | §6; security items 1–4 |

Areas **no** agent covers, deliberately: testing (nothing exists to anchor to), CI/CD and Vercel
deploy config, SEO/metadata, dependency upgrades, repo hygiene, and the git/PR ship workflow.
