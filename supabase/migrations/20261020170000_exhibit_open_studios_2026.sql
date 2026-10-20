-- Adds "2026 Boulder County Open Studios" as a published exhibit (no dates yet).
-- Idempotent; run in the Supabase SQL editor of David's project.

insert into public.exhibits (title, slug, content, status)
values (
  '2026 Boulder County Open Studios',
  '2026-boulder-county-open-studios',
  'Juried Studio Tour Artist',
  'published'
)
on conflict (slug) do update
   set title   = excluded.title,
       content = excluded.content,
       status  = excluded.status;
