-- Let a sale date be just a month and year. sold_at becomes text holding
-- either 'YYYY-MM-DD' (exact day) or 'YYYY-MM' (month and year only).
alter table public.artworks
  alter column sold_at type text using to_char(sold_at, 'YYYY-MM-DD');

alter table public.artworks
  add constraint artworks_sold_at_format
  check (sold_at is null or sold_at ~ '^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$');
