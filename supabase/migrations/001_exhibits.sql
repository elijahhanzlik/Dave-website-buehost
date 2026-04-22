-- =============================================================
-- Migration: create public.exhibits + RLS policies
-- Safe to re-run (idempotent).
--
-- Run this in the Supabase SQL editor if you see:
--   "Could not find the table 'public.exhibits' in the schema cache"
-- =============================================================

create extension if not exists "uuid-ossp";

create table if not exists public.exhibits (
  id             uuid primary key default uuid_generate_v4(),
  title          text not null,
  slug           text not null unique,
  content        text,
  content_blocks jsonb not null default '[]'::jsonb,
  cover_image    text,
  status         text not null default 'draft' check (status in ('draft', 'published')),
  published_at   timestamptz,
  created_at     timestamptz not null default now()
);

alter table public.exhibits enable row level security;

drop policy if exists "Public read published exhibits" on public.exhibits;
create policy "Public read published exhibits"
  on public.exhibits for select
  using (status = 'published' or auth.role() = 'authenticated');

drop policy if exists "Authenticated admin insert on exhibits" on public.exhibits;
create policy "Authenticated admin insert on exhibits"
  on public.exhibits for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated admin update on exhibits" on public.exhibits;
create policy "Authenticated admin update on exhibits"
  on public.exhibits for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated admin delete on exhibits" on public.exhibits;
create policy "Authenticated admin delete on exhibits"
  on public.exhibits for delete
  to authenticated
  using (true);

-- Tell PostgREST to reload its schema cache so the new table
-- is visible without a project restart.
notify pgrst, 'reload schema';
