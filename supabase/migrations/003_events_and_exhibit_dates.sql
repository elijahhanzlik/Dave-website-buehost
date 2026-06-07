-- =============================================================
-- Migration: Events & Services table + exhibit run dates.
-- Safe to re-run (idempotent).
--
-- Intent:
--   * create public.events (Events & Services), mirroring exhibits
--   * give exhibits + events start_date / end_date (when they actually
--     ran) and drop the old published_at timestamp; the public lists are
--     ordered by end_date descending (most recently ended first)
-- =============================================================

create extension if not exists "uuid-ossp";

-- ----- events & services -----
create table if not exists public.events (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  slug         text not null unique,
  content      text,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  start_date   date,
  end_date     date,
  created_at   timestamptz not null default now()
);

-- Bring an already-existing events table up to the current shape.
alter table public.events add column if not exists start_date date;
alter table public.events add column if not exists end_date date;
alter table public.events drop column if exists published_at;

alter table public.events enable row level security;

drop policy if exists "Public read published events" on public.events;
create policy "Public read published events"
  on public.events for select
  using (status = 'published' or auth.role() = 'authenticated');

drop policy if exists "Authenticated admin insert on events" on public.events;
create policy "Authenticated admin insert on events"
  on public.events for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated admin update on events" on public.events;
create policy "Authenticated admin update on events"
  on public.events for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated admin delete on events" on public.events;
create policy "Authenticated admin delete on events"
  on public.events for delete
  to authenticated
  using (true);

-- ----- exhibits: run dates instead of a publish timestamp -----
alter table public.exhibits add column if not exists start_date date;
alter table public.exhibits add column if not exists end_date date;
alter table public.exhibits drop column if exists published_at;

-- Tell PostgREST to reload its schema cache so the new columns are
-- visible without a project restart.
notify pgrst, 'reload schema';
