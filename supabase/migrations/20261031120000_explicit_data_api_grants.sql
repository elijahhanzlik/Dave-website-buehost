-- Idempotent. Run after every earlier migration (it needs all seven tables).

-- Data API grants. Supabase no longer grants Data API access to new public
-- tables automatically (new projects since 2026-05-30, existing projects
-- since 2026-10-30), so without these a fresh project answers every query
-- with "permission denied". Each grant mirrors the table's RLS policies, so
-- this adds no access the policies don't already allow. On a database that
-- already has the old automatic grants it changes nothing.

-- Visitors: read the site; send the contact form.
grant select on public.artworks, public.blog_posts, public.pages,
  public.exhibits, public.events, public.site_settings
  to anon, authenticated;
grant insert on public.inquiries to anon, authenticated;

-- Signed-in admin: the CMS edits allowed by the policies above.
grant insert, update, delete on public.artworks, public.blog_posts,
  public.pages, public.exhibits, public.events
  to authenticated;
grant select, update, delete on public.inquiries to authenticated;
grant insert, update on public.site_settings to authenticated;

-- Server (service role, lib/supabase/admin.ts): every table.
grant select, insert, update, delete on public.artworks, public.blog_posts,
  public.pages, public.exhibits, public.events, public.inquiries,
  public.site_settings
  to service_role;

notify pgrst, 'reload schema';
