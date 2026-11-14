create table public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  constraint email_subscribers_profile_email_unique unique (profile_id, email),
  constraint email_subscribers_email_format
    check (
      char_length(email) <= 254
      and email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    )
);
