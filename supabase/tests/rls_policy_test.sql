\prompt 'Second user UUID: ' second_user_id
\prompt 'First user profile UUID: ' first_profile_id
\prompt 'First user link UUID: ' first_link_id
\prompt 'First user subscriber UUID: ' first_subscriber_id

begin;

set local role authenticated;

select set_config('request.jwt.claim.sub', :'second_user_id', true);

select count(*) as visible_foreign_profiles
from public.profiles
where id = :'first_profile_id'::uuid;
-- Expected: 0

select count(*) as visible_foreign_links
from public.links
where id = :'first_link_id'::uuid;
-- Expected: 0

select count(*) as visible_foreign_subscribers
from public.email_subscribers
where id = :'first_subscriber_id'::uuid;
-- Expected: 0

select count(*) as visible_foreign_creator_blocks
from public.creator_blocks
where profile_id = :'first_profile_id'::uuid;
-- Expected: 0

select count(*) as visible_foreign_profile_visits
from public.profile_visits
where profile_id = :'first_profile_id'::uuid;
-- Expected: 0

with changed as (
  update public.profiles
  set display_name = display_name
  where id = :'first_profile_id'::uuid
  returning id
)
select count(*) as changed_foreign_profiles from changed;
-- Expected: 0

with changed as (
  update public.links
  set title = title
  where id = :'first_link_id'::uuid
  returning id
)
select count(*) as changed_foreign_links from changed;
-- Expected: 0

with changed as (
  update public.email_subscribers
  set email = email
  where id = :'first_subscriber_id'::uuid
  returning id
)
select count(*) as changed_foreign_subscribers from changed;
-- Expected: 0

with changed as (
  update public.creator_blocks
  set title = title
  where profile_id = :'first_profile_id'::uuid
  returning id
)
select count(*) as changed_foreign_creator_blocks from changed;
-- Expected: 0

rollback;
