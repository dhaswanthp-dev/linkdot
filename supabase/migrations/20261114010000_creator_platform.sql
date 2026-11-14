alter table public.profiles
  add column template_key text not null default 'modern-blue',
  add column accent_color text not null default '#ff7a00',
  add column button_style text not null default 'rounded',
  add column social_links jsonb not null default '{}'::jsonb,
  add constraint profiles_template_key_allowed
    check (template_key in (
      'modern-blue',
      'premium-red',
      'minimal-mono',
      'neon-lime',
      'dark-fitness',
      'personal-portfolio',
      'lifestyle'
    )),
  add constraint profiles_accent_color_format
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint profiles_button_style_allowed
    check (button_style in ('rounded', 'pill', 'square')),
  add constraint profiles_social_links_object
    check (jsonb_typeof(social_links) = 'object');

create table public.creator_blocks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  block_type text not null,
  title text not null,
  description text,
  href text,
  media_urls text[] not null default '{}',
  position integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_blocks_type_allowed check (block_type in (
    'video',
    'image',
    'gallery',
    'product',
    'service',
    'donation',
    'digital_download',
    'subscription',
    'contact',
    'newsletter'
  )),
  constraint creator_blocks_title_length
    check (char_length(title) between 1 and 100),
  constraint creator_blocks_description_length
    check (description is null or char_length(description) <= 500),
  constraint creator_blocks_href_scheme
    check (href is null or href ~* '^(https?://|mailto:)'),
  constraint creator_blocks_position_nonnegative check (position >= 0),
  constraint creator_blocks_media_limit check (cardinality(media_urls) <= 12)
);

create index creator_blocks_profile_position_idx
  on public.creator_blocks (profile_id, position);

create trigger creator_blocks_set_updated_at
  before update on public.creator_blocks
  for each row execute function public.set_updated_at();

create table public.profile_visits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  visitor_id uuid not null,
  source_domain text,
  visited_at timestamptz not null default now(),
  constraint profile_visits_source_length
    check (source_domain is null or char_length(source_domain) <= 120)
);

create index profile_visits_profile_visited_at_idx
  on public.profile_visits (profile_id, visited_at);

alter table public.creator_blocks enable row level security;
alter table public.profile_visits enable row level security;

revoke all on table public.creator_blocks, public.profile_visits
  from anon, authenticated;
grant select, insert, update, delete on table public.creator_blocks
  to authenticated;
grant insert on table public.profile_visits to anon, authenticated;
grant select on table public.profile_visits to authenticated;

create policy creator_blocks_owner_all
  on public.creator_blocks for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy profile_visits_insert_for_public_profile
  on public.profile_visits for insert to anon, authenticated
  with check (
    exists (
      select 1
      from public.public_profiles pp
      where pp.id = profile_id
    )
  );

create policy profile_visits_select_owner
  on public.profile_visits for select to authenticated
  using (profile_id = (select auth.uid()));

create or replace view public.public_profiles
  with (security_barrier = true, security_invoker = false)
as
select
  p.id,
  p.username,
  p.display_name,
  p.bio,
  p.avatar_url,
  p.theme,
  p.template_key,
  p.accent_color,
  p.button_style,
  p.social_links
from public.profiles p;

create or replace view public.public_creator_blocks
  with (security_barrier = true, security_invoker = false)
as
select
  b.id,
  b.profile_id,
  p.username,
  b.block_type,
  b.title,
  b.description,
  b.href,
  b.media_urls,
  b.position
from public.creator_blocks b
join public.profiles p on p.id = b.profile_id
where b.is_visible;

revoke all on public.public_creator_blocks from public;
grant select on public.public_creator_blocks to anon, authenticated;

create or replace function public.get_own_profile_analytics(p_since timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with own_profile as (
    select p.id
    from public.profiles p
    where p.id = (select auth.uid())
  ),
  own_visits as (
    select v.visitor_id, v.visited_at, v.source_domain
    from public.profile_visits v
    join own_profile p on p.id = v.profile_id
    where v.visited_at >= p_since
  ),
  own_clicks as (
    select c.link_id, c.clicked_at, l.title
    from public.link_clicks c
    join public.links l on l.id = c.link_id
    join own_profile p on p.id = l.profile_id
    where c.clicked_at >= p_since
  ),
  daily_visits as (
    select date_trunc('day', v.visited_at)::date as day, count(*) as visits
    from own_visits v
    group by 1
  ),
  daily_clicks as (
    select date_trunc('day', c.clicked_at)::date as day, count(*) as clicks
    from own_clicks c
    group by 1
  )
  select jsonb_build_object(
    'visits', (select count(*) from own_visits),
    'unique_visitors', (
      select count(distinct v.visitor_id) from own_visits v
    ),
    'clicks', (select count(*) from own_clicks),
    'daily', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'date', days.day::date,
          'visits', coalesce(dv.visits, 0),
          'clicks', coalesce(dc.clicks, 0)
        )
        order by days.day
      )
      from generate_series(
        date_trunc('day', greatest(p_since, now() - interval '30 days')),
        date_trunc('day', now()),
        interval '1 day'
      ) as days(day)
      left join daily_visits dv on dv.day = days.day::date
      left join daily_clicks dc on dc.day = days.day::date
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(
        jsonb_build_object('source', source, 'visits', total)
        order by total desc
      )
      from (
        select coalesce(nullif(v.source_domain, ''), 'Direct') as source,
          count(*) as total
        from own_visits v
        group by 1
        order by 2 desc
        limit 8
      ) source_totals
    ), '[]'::jsonb),
    'popular_links', coalesce((
      select jsonb_agg(
        jsonb_build_object('title', title, 'clicks', total)
        order by total desc
      )
      from (
        select c.title, count(*) as total
        from own_clicks c
        group by c.link_id, c.title
        order by 2 desc
        limit 5
      ) link_totals
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_own_profile_analytics(timestamptz)
  from public, anon;
grant execute on function public.get_own_profile_analytics(timestamptz)
  to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'linkdot-media',
  'linkdot-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy linkdot_media_public_read
  on storage.objects for select to public
  using (bucket_id = 'linkdot-media');

create policy linkdot_media_owner_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'linkdot-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy linkdot_media_owner_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'linkdot-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'linkdot-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy linkdot_media_owner_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'linkdot-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
