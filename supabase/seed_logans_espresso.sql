-- =============================================================
-- Logan's Espresso Cafe — schema + seed (2026-07)
-- Self-contained: run once in the Supabase SQL editor (or via CLI)
-- against the project in .env.local (ref: sunmmedebvbnvsjmquie).
-- Idempotent — safe to re-run.
-- =============================================================

-- 1) Schema: event fields on exhibits (same as migration 002) ----
-- The feature photo reuses the existing `cover_image` column.
alter table public.exhibits add column if not exists event_dates text;
alter table public.exhibits add column if not exists event_time  text;
alter table public.exhibits add column if not exists address     text;

-- 2) Seed: the Logan's Espresso Cafe exhibit -------------------
insert into public.exhibits
  (title, slug, status, published_at, content,
   event_dates, event_time, address, cover_image)
values
  (
    'Logan''s Espresso Cafe',
    'logans-espresso-cafe',
    'published',
    now(),
    null,
    'Aug 1 – 31, 2026',
    '6–9:30 p.m.',
    '4790 Broadway, Unit 101 · Boulder, CO 80304',
    '/exhibits/logans-espresso-driftwood.png'
  )
on conflict (slug) do update set
  title        = excluded.title,
  status       = excluded.status,
  published_at = excluded.published_at,
  event_dates  = excluded.event_dates,
  event_time   = excluded.event_time,
  address      = excluded.address,
  cover_image  = excluded.cover_image;

-- 3) Seed: home hero "NEW EXHIBIT" badge (standalone settings) --
insert into public.site_settings (key, value) values
  ('home_exhibit_title',   'Logan''s Espresso Cafe'),
  ('home_exhibit_dates',   'Aug 1 – 31, 2026'),
  ('home_exhibit_time',    '6–9:30 p.m.'),
  ('home_exhibit_address', '4790 Broadway, Unit 101 · Boulder, CO 80304')
on conflict (key) do update set value = excluded.value, updated_at = now();
