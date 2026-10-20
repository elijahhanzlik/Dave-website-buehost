-- Retitles and publishes the existing Open Studios 2026 draft (from 004).
-- Dates and address are left as they are. Run in David's Supabase SQL editor.

update public.exhibits
   set title   = '2026 Boulder County Open Studios',
       content = 'Juried Studio Tour Artist',
       status  = 'published'
 where slug = 'boulder-county-open-studios-tour-2026';
