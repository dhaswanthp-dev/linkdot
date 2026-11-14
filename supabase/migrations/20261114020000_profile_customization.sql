alter table public.profiles
  add column design_settings jsonb not null default '{
    "theme": "professional",
    "accentColor": "#3265ee",
    "background": {
      "type": "solid",
      "color": "#edf2ff",
      "gradientStart": "#edf2ff",
      "gradientEnd": "#dfe8ff",
      "imageUrl": "",
      "videoUrl": "",
      "positionX": 50,
      "positionY": 50
    },
    "typography": {
      "fontFamily": "urbanist",
      "fontSize": "medium",
      "fontWeight": "600",
      "textColor": "#172448",
      "alignment": "center"
    },
    "buttons": {
      "shape": "rounded",
      "borderRadius": 16,
      "color": "#ffffff",
      "textColor": "#172448",
      "shadow": "soft",
      "size": "medium",
      "icon": "arrow",
      "showThumbnails": true,
      "thumbnailUrl": "",
      "hoverAnimation": "scale"
    },
    "animation": "fade"
  }'::jsonb,
  add column published_design jsonb,
  add column is_published boolean not null default false,
  add constraint profiles_design_settings_object
    check (jsonb_typeof(design_settings) = 'object'),
  add constraint profiles_published_design_object
    check (published_design is null or jsonb_typeof(published_design) = 'object'),
  add constraint profiles_published_design_required
    check (not is_published or published_design is not null);

update public.profiles p
set design_settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            p.design_settings,
            '{accentColor}',
            to_jsonb(p.accent_color)
          ),
          '{background,color}',
          to_jsonb(case p.template_key
            when 'premium-red' then '#fff1ef'
            when 'minimal-mono' then '#f4f4f2'
            when 'neon-lime' then '#f2f8df'
            when 'dark-fitness' then '#142018'
            when 'personal-portfolio' then '#f2efff'
            when 'lifestyle' then '#fbf0e9'
            else '#edf2ff'
          end)
        ),
        '{typography,textColor}',
        to_jsonb(case p.template_key
          when 'premium-red' then '#391d20'
          when 'minimal-mono' then '#171717'
          when 'neon-lime' then '#22300f'
          when 'dark-fitness' then '#f4f7ed'
          when 'personal-portfolio' then '#28213e'
          when 'lifestyle' then '#3b2822'
          else '#172448'
        end)
      ),
      '{buttons,shape}',
      to_jsonb(p.button_style)
    ),
    '{buttons,borderRadius}',
    to_jsonb(case p.button_style
      when 'pill' then 40
      when 'square' then 0
      else 16
    end)
  ),
  '{buttons,textColor}',
  to_jsonb(case p.template_key
    when 'premium-red' then '#391d20'
    when 'minimal-mono' then '#171717'
    when 'neon-lime' then '#22300f'
    when 'dark-fitness' then '#f4f7ed'
    when 'personal-portfolio' then '#28213e'
    when 'lifestyle' then '#3b2822'
    else '#172448'
  end)
);

update public.profiles
set published_design = design_settings,
    is_published = true;

alter table public.links
  add column thumbnail_url text,
  add constraint links_thumbnail_url_https
    check (thumbnail_url is null or thumbnail_url ~* '^https://');

update storage.buckets
set file_size_limit = 31457280,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm'
    ]
where id = 'linkdot-media';

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
  p.social_links,
  p.published_design
from public.profiles p
where p.is_published;

create or replace view public.public_links
  with (security_barrier = true, security_invoker = false)
as
select
  l.id,
  l.profile_id,
  p.username,
  l.title,
  l.url,
  l.position,
  l.thumbnail_url
from public.links l
join public.profiles p on p.id = l.profile_id
where p.is_published
  and l.is_visible
  and (l.starts_at is null or l.starts_at <= now())
  and (l.ends_at is null or l.ends_at > now());

revoke all on public.public_profiles, public.public_links from public;
grant select on public.public_profiles, public.public_links to anon, authenticated;

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
where p.is_published
  and b.is_visible;

revoke all on public.public_creator_blocks from public;
grant select on public.public_creator_blocks to anon, authenticated;
