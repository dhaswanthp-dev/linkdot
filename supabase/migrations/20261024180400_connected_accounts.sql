create table public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  external_id text not null,
  created_at timestamptz not null default now(),
  constraint connected_accounts_platform
    check (platform in ('instagram', 'tiktok', 'youtube', 'facebook')),
  constraint connected_accounts_profile_platform_unique
    unique (profile_id, platform)
);
