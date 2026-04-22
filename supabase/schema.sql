-- =============================================================
-- David Schaldach Portfolio — Supabase Schema
-- =============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ----- artworks -----
create table public.artworks (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  year        integer,
  description text,
  images      text[] not null default '{}',
  category    text,
  sort_order  integer not null default 0,
  is_featured boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.artworks enable row level security;

create policy "Public read access on artworks"
  on public.artworks for select
  using (true);

create policy "Authenticated admin insert on artworks"
  on public.artworks for insert
  to authenticated
  with check (true);

create policy "Authenticated admin update on artworks"
  on public.artworks for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admin delete on artworks"
  on public.artworks for delete
  to authenticated
  using (true);

-- ----- blog_posts -----
create table public.blog_posts (
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

alter table public.blog_posts enable row level security;

create policy "Public read published blog posts"
  on public.blog_posts for select
  using (status = 'published' or auth.role() = 'authenticated');

create policy "Authenticated admin insert on blog_posts"
  on public.blog_posts for insert
  to authenticated
  with check (true);

create policy "Authenticated admin update on blog_posts"
  on public.blog_posts for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admin delete on blog_posts"
  on public.blog_posts for delete
  to authenticated
  using (true);

-- ----- pages -----
create table public.pages (
  id              uuid primary key default uuid_generate_v4(),
  slug            text not null unique,
  title           text not null,
  content_blocks  jsonb not null default '[]'::jsonb,
  updated_at      timestamptz not null default now()
);

alter table public.pages enable row level security;

create policy "Public read access on pages"
  on public.pages for select
  using (true);

create policy "Authenticated admin insert on pages"
  on public.pages for insert
  to authenticated
  with check (true);

create policy "Authenticated admin update on pages"
  on public.pages for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admin delete on pages"
  on public.pages for delete
  to authenticated
  using (true);

-- ----- exhibits -----
create table public.exhibits (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  slug         text not null unique,
  content      text,
  content_blocks jsonb not null default '[]'::jsonb,
  cover_image  text,
  start_date   date,
  end_date     date,
  venue        text,
  link         text,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.exhibits enable row level security;

create policy "Public read published exhibits"
  on public.exhibits for select
  using (status = 'published' or auth.role() = 'authenticated');

create policy "Authenticated admin insert on exhibits"
  on public.exhibits for insert
  to authenticated
  with check (true);

create policy "Authenticated admin update on exhibits"
  on public.exhibits for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admin delete on exhibits"
  on public.exhibits for delete
  to authenticated
  using (true);

-- ----- inquiries -----
create table public.inquiries (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  email      text not null,
  message    text not null,
  status     text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.inquiries enable row level security;

create policy "Public insert on inquiries"
  on public.inquiries for insert
  with check (true);

create policy "Authenticated admin read on inquiries"
  on public.inquiries for select
  to authenticated
  using (true);

create policy "Authenticated admin update on inquiries"
  on public.inquiries for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admin delete on inquiries"
  on public.inquiries for delete
  to authenticated
  using (true);

-- ----- site_settings -----
create table public.site_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Public read access on site_settings"
  on public.site_settings for select
  using (true);

create policy "Authenticated admin insert on site_settings"
  on public.site_settings for insert
  to authenticated
  with check (true);

create policy "Authenticated admin update on site_settings"
  on public.site_settings for update
  to authenticated
  using (true)
  with check (true);

-- ----- Storage bucket -----
insert into storage.buckets (id, name, public)
  values ('artwork-images', 'artwork-images', true)
  on conflict do nothing;

create policy "Public read access on artwork-images"
  on storage.objects for select
  using (bucket_id = 'artwork-images');

create policy "Authenticated upload to artwork-images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'artwork-images');

create policy "Authenticated delete from artwork-images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'artwork-images');

-- =============================================================
-- Migrations (idempotent — safe to re-run on existing databases)
-- =============================================================

-- artworks: add optional year column
alter table public.artworks add column if not exists year integer;

-- exhibits: add date range, venue, and external link
alter table public.exhibits add column if not exists start_date date;
alter table public.exhibits add column if not exists end_date date;
alter table public.exhibits add column if not exists venue text;
alter table public.exhibits add column if not exists link text;
