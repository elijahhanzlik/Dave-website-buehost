-- =============================================================
-- Migration: ensure public.inquiries RLS policies are correct
-- Safe to re-run (idempotent).
--
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- if the public contact form fails with:
--   "new row violates row-level security policy for table \"inquiries\""
--
-- Intent:
--   * anon (unauthenticated) visitors may INSERT a new inquiry
--   * only authenticated users may SELECT/UPDATE/DELETE inquiries
-- =============================================================

create extension if not exists "uuid-ossp";

create table if not exists public.inquiries (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  email      text not null,
  message    text not null,
  status     text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.inquiries enable row level security;

drop policy if exists "Public insert on inquiries" on public.inquiries;
create policy "Public insert on inquiries"
  on public.inquiries for insert
  with check (true);

drop policy if exists "Authenticated admin read on inquiries" on public.inquiries;
create policy "Authenticated admin read on inquiries"
  on public.inquiries for select
  to authenticated
  using (true);

drop policy if exists "Authenticated admin update on inquiries" on public.inquiries;
create policy "Authenticated admin update on inquiries"
  on public.inquiries for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated admin delete on inquiries" on public.inquiries;
create policy "Authenticated admin delete on inquiries"
  on public.inquiries for delete
  to authenticated
  using (true);

-- Tell PostgREST to reload its schema cache so the policy changes
-- take effect without a project restart.
notify pgrst, 'reload schema';
