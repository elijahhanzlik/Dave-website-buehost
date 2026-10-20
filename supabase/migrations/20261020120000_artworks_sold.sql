-- Sold status for the Gallery's All works / Available / Sold filters.
-- sold_price and sold_at are public (shown on the work's detail page).
-- sold_only = true hides a sold piece from "All works"; it shows under Sold only.
alter table public.artworks
  add column if not exists is_sold    boolean not null default false,
  add column if not exists sold_price numeric(10, 2) check (sold_price is null or sold_price >= 0),
  add column if not exists sold_at    date,
  add column if not exists sold_only  boolean not null default false;
