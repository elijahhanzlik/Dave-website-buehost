-- =============================================================
-- David Schaldach Portfolio — Supabase Schema
-- =============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ----- artworks -----
create table public.artworks (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
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
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  slug         text not null unique,
  content      text,
  cover_image  text,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at   timestamptz not null default now()
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

-- ----- subscriptions -----
create table public.subscriptions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  service        text not null,
  category       text,
  monthly_cost   numeric(10,2) not null default 0,
  annual_cost    numeric(10,2) not null default 0,
  billing_cycle  text not null default 'monthly' check (billing_cycle in ('monthly', 'annual', 'weekly', 'quarterly')),
  next_renewal   date,
  status         text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users read own subscriptions"
  on public.subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own subscriptions"
  on public.subscriptions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own subscriptions"
  on public.subscriptions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own subscriptions"
  on public.subscriptions for delete
  to authenticated
  using (auth.uid() = user_id);

-- ----- notion_settings -----
create table public.notion_settings (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,
  access_token        text,
  database_id         text,
  workspace_name      text,
  sync_enabled        boolean not null default false,
  last_synced_at      timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.notion_settings enable row level security;

create policy "Users read own notion_settings"
  on public.notion_settings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own notion_settings"
  on public.notion_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own notion_settings"
  on public.notion_settings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own notion_settings"
  on public.notion_settings for delete
  to authenticated
  using (auth.uid() = user_id);

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
