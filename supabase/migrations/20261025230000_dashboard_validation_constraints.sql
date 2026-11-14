alter table public.profiles
  add constraint profiles_display_name_length
    check (char_length(display_name) between 1 and 60),
  add constraint profiles_theme_allowed
    check (theme in ('light', 'dark', 'pastel', 'forest'));

alter table public.links
  add constraint links_title_length
    check (char_length(title) between 1 and 100);
