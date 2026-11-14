create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  bio text,
  avatar_url text,
  theme text not null default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,30}$'),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 80)
);
