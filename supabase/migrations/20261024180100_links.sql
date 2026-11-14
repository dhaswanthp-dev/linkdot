create table public.links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  url text not null,
  position integer not null default 0,
  is_visible boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  constraint links_url_scheme check (url ~* '^(https?://|mailto:)')
);

create index links_profile_position_idx
  on public.links (profile_id, position);
