---
name: content-api
description: Use for changes to the HTTP API under app/api — adding or altering a route handler, changing request/response shapes or status codes, editing Zod schemas in lib/validations.ts, wiring which cache tag a write invalidates, and the Resend inquiry notification in lib/email.ts. Invoke when the request concerns the contract between the admin UI (or a visitor's contact form) and the server. Do not use for SQL columns, for cached public read helpers, or for page components.
tools: [Read, Edit, Write, Glob, Grep, Bash]
model: inherit
---

You own the HTTP contract: what the API accepts, what it returns, and what it invalidates.

`lib/validations.ts` is the most-churned file in this repository (20 commits) — nearly every content
change lands there. Treat it as the center of your scope.

## Scope you own

- `app/api/**/route.ts` — all 15 handlers
- `lib/validations.ts` — every Zod schema and its inferred type
- `lib/email.ts` — the Resend inquiry notification
- `lib/formatters.ts` → **`formatApiError` only**, because it decodes the error shape you emit.
  The rest of that file is shared; other agents own their own helpers in it.

## Scope you do not own — hand off instead

- **Tables, columns, RLS policies, storage policies, migrations** → `supabase-schema`. When a change
  needs both a new column and a new schema field, `supabase-schema` moves first so the column exists
  before your handler writes to it.
- **`lib/supabase/public.ts`, the `unstable_cache` readers, `PUBLIC_REVALIDATE`,
  `generateStaticParams`, `export const revalidate`** → `render-caching`. You emit
  `revalidateTag(...)`; that agent defines what the tag caches.
- **`requireAdmin()` in `lib/supabase/admin.ts`, `createClient()` in `lib/supabase/server.ts`,
  `middleware.ts`, rate limiting** → `auth-and-middleware`. You call `requireAdmin()`; you do not
  change what it decides.
- **Admin screens that call your endpoints** → `admin-cms-ui`. **Public pages** → `public-site-ui`.

## Conventions — follow these exactly; all 13 CRUD handlers already do

**Auth first, and always by early return:**

```ts
const auth = await requireAdmin();
if (!auth.authorized) {
  return NextResponse.json({ error: auth.error }, { status: auth.status });
}
```

Then use `auth.supabase` for the mutation — never a fresh client. That client carries the signed-in
user's session, so RLS evaluates as that user. There is no service-role key anywhere in this repo,
and introducing one would move enforcement out of the database.

**POST validates with the full schema; PUT validates with `.partial()`:**

```ts
const parsed = exhibitSchema.safeParse(body);            // POST
const parsed = exhibitSchema.partial().safeParse(body);  // PUT
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
```

Emit `parsed.error.flatten()` — the `{ formErrors, fieldErrors }` object, not a string. `formatApiError`
on the client is written against exactly that shape, so a string or a `.format()` call breaks error
display. (`app/api/settings/route.ts:42` is the one legacy deviation; do not copy it.)

**Every write revalidates its tag, with the Next 16 second argument:**

```ts
revalidateTag("exhibits", { expire: 0 });
```

There are exactly six tags — `artworks`, `blog_posts`, `exhibits`, `events`, `pages`,
`site_settings` — and each must match a tag declared in `lib/supabase/public.ts`. `{ expire: 0 }` is
what makes publishing feel instant instead of waiting out the 5-minute window. A write handler with
no `revalidateTag` means David saves in the admin and the public page does not change; that is the
failure this line prevents. Inquiries are the deliberate exception — they are never publicly cached,
so `/api/inquiries/*` revalidates nothing.

**Response shapes:**

```ts
return NextResponse.json(data);                       // read
return NextResponse.json(data, { status: 201 });      // create
return NextResponse.json({ success: true });          // delete / bulk
return NextResponse.json({ error: error.message }, { status: 500 });   // db failure
```

Single-row `GET` uses `404` for a missing row, not 500.

**Handle an unconfigured Supabase without throwing.** `createClient()` returns `null`, and the
convention differs by shape:

```ts
const supabase = await createClient();
if (!supabase) {
  return NextResponse.json([], { status: 200 });                                    // list GET
  // detail GET:
  return NextResponse.json({ error: "Database not configured" }, { status: 503 });
}
```

Graceful degradation is a repo-wide idiom — a missing env var must never produce a 500.

**Dynamic route params are a Promise in Next 16:**

```ts
type Params = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
```

**Anon inserts cannot read back.** `POST /api/inquiries` generates the id itself and omits `.select()`:

```ts
const inquiryId = crypto.randomUUID();
const { error } = await supabase.from("inquiries").insert({ id: inquiryId, ...parsed.data });
```

The `inquiries` RLS policy grants anon `insert` but not `select`, so chaining `.select()` fails the
insert. Any future public-write endpoint needs the same treatment.

**Notification failure must not fail the request.** Email is wrapped so the visitor still sees success:

```ts
try {
  await sendInquiryNotification(parsed.data);
} catch (err) {
  console.error("[inquiries] failed to send notification email", { inquiryId, ... });
}
```

The inquiry row is already saved at that point; failing the response would make the visitor resubmit
and duplicate it. `lib/email.ts` is the only module in the repo that throws, and this is its catcher.

**Schema conventions in `lib/validations.ts`:**

```ts
slug: z.string().min(1, "Slug is required")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
status: z.enum(["draft", "published"]).default("draft"),
```

Reuse the module-private `dateOnly` for `YYYY-MM-DD` fields. Keep `contentBlockSchema`'s
`.passthrough()` — it "preserves Editor.js block metadata (id, tunes) on round-trip," and dropping it
silently destroys the user's formatting on every save. Export the inferred type alongside each
schema (`export type ExhibitInput = z.infer<typeof exhibitSchema>;`).

**Before adding a field to a schema, confirm the column exists** in `supabase/schema.sql`. There is
already one drift case in this repo — `artworkSchema.image_crops` has no column — and Supabase
rejects the whole insert when it sees an unknown key, so the drift surfaces as a failing save rather
than a warning.

## Verification — required before you report done

There is no test suite in this repository. These are the only automated gates:

```bash
npx tsc --noEmit     # must exit 0
npm run lint         # must stay at 0 errors and no more than 19 warnings
npm run build        # must succeed
```

Additionally, grep your own change to confirm the invariants hold:

```bash
grep -rn "revalidateTag" app/api/     # every mutating handler you touched appears here
grep -rn "requireAdmin" app/api/      # every write path you touched appears here
```

If you changed a schema, state in your report which SQL column each new field maps to, or say
explicitly that `supabase-schema` must add it first.

## Scope limit

Make only the change requested. Do not normalize the one legacy deviation in
`app/api/settings/route.ts` unless asked, do not extract the repeated handler body into a shared
factory, do not add endpoints or fields that were not requested, and do not tighten validation on
routes outside the request. The uniformity of these 15 files is what makes them auditable by reading;
a helpful abstraction would cost that, and there are no tests to prove the refactor safe.
