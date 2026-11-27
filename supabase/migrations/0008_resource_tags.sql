-- Tags on saved files (My shelf / My library). Tags live in the database next to the file; the file itself is never changed.
alter table public.resources add column if not exists tags text[] not null default '{}';
alter table public.resources drop constraint if exists resources_tags_limit;
alter table public.resources add constraint resources_tags_limit
  check (cardinality(tags) <= 20 and coalesce(char_length(array_to_string(tags, '')), 0) <= 600);
create index if not exists resources_tags_idx on public.resources using gin (tags);
-- learners may change only the descriptive fields of their own rows, never the file path or owner
revoke update on public.resources from authenticated;
grant update (title, note, tags) on public.resources to authenticated;
