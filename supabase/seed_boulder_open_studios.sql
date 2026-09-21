-- =============================================================
-- Boulder Open Studios Tour — homepage badge seed (2026-10)
-- Replaces the Logan's Espresso Cafe card on the home hero.
-- Run once in the Supabase SQL editor (or via CLI) against the
-- project in .env.local. Idempotent — safe to re-run.
--
-- Data only: touches the four home_exhibit_* rows in site_settings
-- and nothing else. The same values can be entered by hand under
-- Admin → Settings → "The card on your homepage".
-- =============================================================

insert into public.site_settings (key, value) values
  ('home_exhibit_title',   'Boulder Open Studios Tour'),
  ('home_exhibit_dates',   'Oct 3 – 4, 2026'),
  ('home_exhibit_time',    'Noon – 5pm'),
  ('home_exhibit_address', 'Studio #35 · 727 Quince Cir. · Boulder, CO 80304')
on conflict (key) do update set value = excluded.value, updated_at = now();
