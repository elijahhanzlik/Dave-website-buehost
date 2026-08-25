-- ============================================================
-- Migration: exhibit run dates + two new exhibit entries.
-- Safe to re-run (idempotent).
--
-- Part 1 fills in run dates for three exhibits that had a null
-- event_dates, so the public pages showed no dates at all. It sets
-- the freeform display string (what app/(public)/exhibits renders)
-- and corrects the structured start_date/end_date to match.
--
-- Part 2 adds Open Wall at BMoCA (published). It goes in `exhibits`,
-- not `events`: public.events has only title/slug/content/status/
-- start_date/end_date, so it cannot store the street address, and
-- the exhibits detail layout turns `address` into a Get Directions
-- button. Neither table has a website column, so the bmoca.org URL
-- lives in `content` (rendered as plain text, not a live link).
--
-- Part 3 stages Boulder County Open Studios Tour 2026 as a DRAFT.
-- Draft rows are excluded by getPublishedExhibits (.eq status
-- 'published') and by the public-read RLS policy, so it stays
-- invisible on the site until someone flips it to published.
--
-- address on both new rows uses the "street · city" convention that
-- app/(public)/exhibits/[slug] splits on to render the venue block.
-- ============================================================

-- ---------- Part 1: run dates ----------

update public.exhibits
   set event_dates = 'Jan 30 – Feb 28, 2025',
       start_date  = '2025-01-30',
       end_date    = '2025-02-28'
 where slug = 'a-different-kind-of-valentine';

update public.exhibits
   set event_dates = 'Mar 1 – Jun 4, 2025',
       start_date  = '2025-03-01',
       end_date    = '2025-06-04'
 where slug = 'inkberry-books';

update public.exhibits
   set event_dates = 'Feb 6 – Mar 6, 2020',
       start_date  = '2020-02-06',
       end_date    = '2020-03-06'
 where slug = 'love-is-all-there-is';

-- ---------- Part 2: Open Wall at BMoCA (published) ----------

insert into public.exhibits
  (title, slug, content, status, event_dates, address, start_date, end_date)
values
  (
    'Open Wall at Boulder Museum of Contemporary Art',
    'open-wall-bmoca',
    E'Open Wall at the Boulder Museum of Contemporary Art.\n\nMore info: https://www.bmoca.org/',
    'published',
    'Mar 14, 2025',
    '1750 13th St. · Boulder, CO 80302',
    '2025-03-14',
    '2025-03-14'
  )
on conflict (slug) do update
   set title       = excluded.title,
       content     = excluded.content,
       status      = excluded.status,
       event_dates = excluded.event_dates,
       address     = excluded.address,
       start_date  = excluded.start_date,
       end_date    = excluded.end_date;

-- ---------- Part 3: Boulder County Open Studios Tour 2026 (DRAFT) ----------
-- Two consecutive days, so event_dates reads "Oct 3 & 4" rather than a range.

insert into public.exhibits
  (title, slug, content, status, event_dates, address, start_date, end_date)
values
  (
    'Boulder County Open Studios Tour, 2026',
    'boulder-county-open-studios-tour-2026',
    null,
    'draft',
    'Oct 3 & 4, 2026',
    '727 Quince Cr. · Boulder, CO 80304',
    '2026-10-03',
    '2026-10-04'
  )
on conflict (slug) do update
   set title       = excluded.title,
       content     = excluded.content,
       status      = excluded.status,
       event_dates = excluded.event_dates,
       address     = excluded.address,
       start_date  = excluded.start_date,
       end_date    = excluded.end_date;
