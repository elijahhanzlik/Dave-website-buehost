-- Which of the Gallery's three columns a piece sits in (0 = left). Set by the
-- admin's live gallery editor; null means "not placed yet" and the site puts
-- the piece in whichever column has the fewest pieces. Order within a column
-- follows sort_order.
alter table public.artworks
  add column if not exists gallery_column smallint
  check (gallery_column is null or gallery_column between 0 and 2);
