create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.is_reserved_username(candidate text)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select pg_catalog.lower(candidate) = any (
    array[
      'admin',
      'login',
      'signup',
      'api',
      'www',
      'support',
      'settings'
    ]::text[]
  );
$$;

create or replace function public.reject_reserved_username()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_reserved_username(new.username) then
    raise exception using
      errcode = '23514',
      message = 'Username is reserved';
  end if;

  return new;
end;
$$;

create trigger profiles_reject_reserved_username
before insert or update of username on public.profiles
for each row
execute function public.reject_reserved_username();
