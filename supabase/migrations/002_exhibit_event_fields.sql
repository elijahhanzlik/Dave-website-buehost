-- =============================================================
-- 002 — Exhibit event fields (2026-07)
-- Adds structured display fields to exhibits for the enriched
-- detail layout (dates / time / location). The feature photo reuses
-- the existing `cover_image` column, so no image column is added here.
-- All nullable & additive — existing rows keep the plain text view.
-- =============================================================

alter table public.exhibits add column if not exists event_dates text;
alter table public.exhibits add column if not exists event_time  text;
alter table public.exhibits add column if not exists address     text;
