-- Drafts for works. Existing pieces stay published; a draft is visible only
-- to the signed-in admin and never appears on the public site.
alter table public.artworks
  add column if not exists status text not null default 'published'
  check (status in ('draft', 'published'));

drop policy if exists "Public read access on artworks" on public.artworks;
create policy "Public read published artworks"
  on public.artworks for select
  using (status = 'published' or auth.role() = 'authenticated');
