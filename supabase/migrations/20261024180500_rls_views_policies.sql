alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.link_clicks enable row level security;
alter table public.email_subscribers enable row level security;
alter table public.connected_accounts enable row level security;

revoke all on table
  public.profiles,
  public.links,
  public.link_clicks,
  public.email_subscribers,
  public.connected_accounts
from anon, authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.links to authenticated;
grant insert on table public.link_clicks to anon, authenticated;
grant select on table public.link_clicks to authenticated;
grant insert on table public.email_subscribers to anon, authenticated;
grant select, update, delete on table public.email_subscribers to authenticated;
grant select, insert, update, delete on table public.connected_accounts to authenticated;

create or replace view public.public_profiles
  with (security_barrier = true, security_invoker = false)
as
select
  p.id,
  p.username,
  p.display_name,
  p.bio,
  p.avatar_url,
  p.theme
from public.profiles p;

create or replace view public.public_links
  with (security_barrier = true, security_invoker = false)
as
select
  l.id,
  l.profile_id,
  p.username,
  l.title,
  l.url,
  l.position
from public.links l
join public.profiles p on p.id = l.profile_id
where l.is_visible
  and (l.starts_at is null or l.starts_at <= now())
  and (l.ends_at is null or l.ends_at > now());

revoke all on public.public_profiles, public.public_links from public;
grant select on public.public_profiles, public.public_links to anon, authenticated;

create policy profiles_select_owner
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_insert_owner
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy profiles_update_owner
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy profiles_delete_owner
  on public.profiles for delete to authenticated
  using ((select auth.uid()) = id);

create policy links_owner_all
  on public.links for all to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_id
        and p.id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_id
        and p.id = (select auth.uid())
    )
  );

create policy link_clicks_insert_for_public_link
  on public.link_clicks for insert to anon, authenticated
  with check (
    exists (
      select 1
      from public.public_links pl
      where pl.id = link_id
    )
  );

create policy link_clicks_select_owner
  on public.link_clicks for select to authenticated
  using (
    exists (
      select 1
      from public.links l
      join public.profiles p on p.id = l.profile_id
      where l.id = link_id
        and p.id = (select auth.uid())
    )
  );

create policy email_subscribers_insert_for_profile
  on public.email_subscribers for insert to anon, authenticated
  with check (
    exists (
      select 1
      from public.public_profiles pp
      where pp.id = profile_id
    )
  );

create policy email_subscribers_select_owner
  on public.email_subscribers for select to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_id
        and p.id = (select auth.uid())
    )
  );

create policy email_subscribers_update_owner
  on public.email_subscribers for update to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_id
        and p.id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_id
        and p.id = (select auth.uid())
    )
  );

create policy email_subscribers_delete_owner
  on public.email_subscribers for delete to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_id
        and p.id = (select auth.uid())
    )
  );

create policy connected_accounts_owner_all
  on public.connected_accounts for all to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_id
        and p.id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_id
        and p.id = (select auth.uid())
    )
  );
