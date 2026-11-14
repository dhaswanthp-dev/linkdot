create table public.link_clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links (id) on delete cascade,
  clicked_at timestamptz not null default now(),
  country text,
  referrer text,
  device text,
  constraint link_clicks_country_length
    check (country is null or char_length(country) = 2)
);

create index link_clicks_link_clicked_at_idx
  on public.link_clicks (link_id, clicked_at);
