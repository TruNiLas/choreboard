-- Choreboard schema.
-- Apply in Supabase: SQL Editor -> New query -> paste this file -> Run.
-- Safe to run again: it creates what is missing and replaces functions and policies.
--
-- Access model: a user belongs to exactly one flat. Everything a user can read is scoped
-- to their own flat through public.my_flat_id(). The anon role gets nothing.

-- Tables ------------------------------------------------------------------------------

create table if not exists public.flats (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our flat' check (char_length(btrim(name)) between 1 and 60),
  join_code text not null unique,
  forfeit text not null default 'Pay for a group dinner'
    check (char_length(btrim(forfeit)) between 1 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.flat_members (
  user_id uuid primary key references auth.users on delete cascade,
  flat_id uuid not null references public.flats on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  joined_at timestamptz not null default now()
);

create index if not exists flat_members_flat_id_idx on public.flat_members (flat_id);

-- The caller's flat. security definer so policies can use it without recursing into
-- flat_members' own policy.
create or replace function public.my_flat_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select flat_id from public.flat_members where user_id = (select auth.uid())
$$;

create table if not exists public.chores (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null default public.my_flat_id() references public.flats on delete cascade,
  -- who logged it
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  -- who gets the points; differs from user_id when someone thanks a flatmate
  done_by uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  points integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists chores_flat_created_idx on public.chores (flat_id, created_at desc);

-- Which keyword group the title matched (see chore_category), or null. Set by the trigger.
alter table public.chores add column if not exists category text;

create index if not exists chores_done_by_created_idx on public.chores (done_by, created_at desc);

-- Points --------------------------------------------------------------------------------
-- Keep chore_words() and chore_category() in sync with src/lib/points.ts, which mirrors
-- them for the points preview. The database is what actually awards points.

-- The title as plain words: lowercase, accents stripped, anything else a single space,
-- padded with a space on both sides so ' word' matches at the start of a word.
create or replace function public.chore_words(title text)
returns text
language sql
immutable
set search_path = ''
as $$
  select ' ' || btrim(regexp_replace(
    translate(lower(title), 'áàâäãåéèêëíìîïóòôöõúùûüñç', 'aaaaaaeeeeiiiiooooouuuunc'),
    '[^a-z0-9]+', ' ', 'g'
  )) || ' '
$$;

-- English and Spanish keywords, highest points first. '% word%' matches the start of a
-- word ("vacuumed"), '% word %' only the whole word.
create or replace function public.chore_category(title text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when w like any (array['% bathroom%', '% toilet%', '% loo %', '% wc %', '% bano%', '% aseo%',
                           '% inodoro%', '% vater%'])
      then 'bathroom'
    when w like any (array['% kitchen%', '% cocina %', '% hob%', '% oven%', '% stove%', '% fridge%',
                           '% freezer%', '% nevera%', '% horno%', '% vitro%'])
     and w like any (array['% clean%', '% scrub%', '% mop%', '% bleach%', '% disinfect%', '% degrease%',
                           '% limpi%', '% freg%', '% frieg%', '% desinfect%'])
      then 'kitchen'
    when w like any (array['% vacuum%', '% hoover%', '% mop%', '% sweep%', '% swept%', '% floor%',
                           '% aspira%', '% aspire%', '% barri %', '% barrer%', '% suelo%', '% fregona%'])
      then 'floors'
    when w like any (array['% cook %', '% cooked%', '% cooking%', '% cocine %', '% cocinar%', '% cocino %',
                           '% cocinamos%', '% made dinner%', '% made lunch%', '% hice la cena%',
                           '% hice la comida%', '% prepare la cena%', '% prepare la comida%'])
      then 'cooking'
    when w like any (array['% shop%', '% groceries%', '% grocery%', '% supermarket%', '% compra%',
                           '% compre %', '% mercadona%', '% super %'])
      then 'shopping'
  end
  from (select public.chore_words(title) as w) as t
$$;

create or replace function public.chore_points(title text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case public.chore_category(title)
    when 'bathroom' then 3
    when 'kitchen' then 3
    when 'floors' then 2
    when 'cooking' then 2
    when 'shopping' then 2
    else 1
  end
$$;

-- Points are always set here, never trusted from the browser.
-- Abuse brake: the same chore (same keyword group, or the same words if none matched)
-- counts once per person per day, Madrid time. A repeat still saves, for 0 points. It
-- applies to whoever gets the points, so trading kudos back and forth is capped too.
create or replace function public.set_chore_points()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.title := btrim(new.title);
  new.category := public.chore_category(new.title);

  if exists (
    select 1 from public.chores c
    where c.done_by = new.done_by
      and c.flat_id = new.flat_id
      and c.points > 0
      and c.created_at >= date_trunc('day', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid'
      and case
        when new.category is null
          then c.category is null and public.chore_words(c.title) = public.chore_words(new.title)
        else c.category = new.category
      end
  ) then
    new.points := 0;
  else
    new.points := public.chore_points(new.title);
  end if;

  return new;
end
$$;

drop trigger if exists chores_set_points on public.chores;
create trigger chores_set_points
  before insert on public.chores
  for each row execute function public.set_chore_points();

-- Flats: created at sign-up, joined by code ---------------------------------------------

-- 6 characters without look-alikes (no 0/O, 1/I/L).
create or replace function public.generate_join_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.flats where join_code = code);
  end loop;
  return code;
end
$$;

-- Every new user gets their own flat, so /app works right after sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_flat_id uuid;
begin
  insert into public.flats (join_code)
  values (public.generate_join_code())
  returning id into new_flat_id;

  -- A first guess at a name: the first word of the email's local part, letters only,
  -- capitalised ("maria.gonzalez.2023@..." -> "Maria"). Members can change it on /app.
  insert into public.flat_members (user_id, flat_id, display_name)
  values (
    new.id,
    new_flat_id,
    left(coalesce(
      nullif(initcap(split_part(btrim(regexp_replace(split_part(new.email, '@', 1), '[^A-Za-z]+', ' ', 'g')), ' ', 1)), ''),
      'Flatmate'
    ), 40)
  );

  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Moves the caller into the flat with this code. Their old flat and its chores stay.
create or replace function public.join_flat(code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.flats;
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in';
  end if;

  select * into target from public.flats where join_code = upper(btrim(code));
  if target.id is null then
    raise exception 'No flat has the code %', upper(btrim(code));
  end if;

  update public.flat_members
  set flat_id = target.id, joined_at = now()
  where user_id = (select auth.uid());

  return target.name;
end
$$;

-- Forfeit changes: every change is recorded with who made it, so it shows in the feed ----

create table if not exists public.forfeit_changes (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references public.flats on delete cascade,
  changed_by uuid references auth.users on delete set null,
  forfeit text not null,
  created_at timestamptz not null default now()
);

create index if not exists forfeit_changes_flat_created_idx
  on public.forfeit_changes (flat_id, created_at desc);

-- security definer because members have no insert grant on forfeit_changes: the only way
-- in is changing the forfeit itself.
create or replace function public.log_forfeit_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.forfeit_changes (flat_id, changed_by, forfeit)
  values (new.id, (select auth.uid()), new.forfeit);
  return new;
end
$$;

drop trigger if exists flats_log_forfeit_change on public.flats;
create trigger flats_log_forfeit_change
  after update of forfeit on public.flats
  for each row
  when (old.forfeit is distinct from new.forfeit)
  execute function public.log_forfeit_change();

-- Row Level Security ----------------------------------------------------------------------

alter table public.flats enable row level security;
alter table public.flat_members enable row level security;
alter table public.chores enable row level security;
alter table public.forfeit_changes enable row level security;

drop policy if exists "Members read their flat" on public.flats;
create policy "Members read their flat" on public.flats
  for select to authenticated
  using (id = (select public.my_flat_id()));

drop policy if exists "Members update their flat" on public.flats;
create policy "Members update their flat" on public.flats
  for update to authenticated
  using (id = (select public.my_flat_id()))
  with check (id = (select public.my_flat_id()));

drop policy if exists "Members read their flatmates" on public.flat_members;
create policy "Members read their flatmates" on public.flat_members
  for select to authenticated
  using (flat_id = (select public.my_flat_id()));

-- Only your own row, and the column grant below limits it to display_name, so nobody can
-- move themselves into another flat this way.
drop policy if exists "Members rename themselves" on public.flat_members;
create policy "Members rename themselves" on public.flat_members
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Members read their flat's chores" on public.chores;
create policy "Members read their flat's chores" on public.chores
  for select to authenticated
  using (flat_id = (select public.my_flat_id()));

drop policy if exists "Members log chores for their flat" on public.chores;
create policy "Members log chores for their flat" on public.chores
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and flat_id = (select public.my_flat_id())
    and exists (
      select 1 from public.flat_members m
      where m.user_id = done_by and m.flat_id = (select public.my_flat_id())
    )
  );

-- Whoever logged an entry can remove it for 24 hours (typos, double logs). Whoever got a
-- kudos can decline it at any time: that only ever lowers their own score.
drop policy if exists "Members remove their own entries or decline a kudos" on public.chores;
create policy "Members remove their own entries or decline a kudos" on public.chores
  for delete to authenticated
  using (
    flat_id = (select public.my_flat_id())
    and (
      (user_id = (select auth.uid()) and created_at > now() - interval '24 hours')
      or (done_by = (select auth.uid()) and user_id <> done_by)
    )
  );

drop policy if exists "Members read their flat's forfeit changes" on public.forfeit_changes;
create policy "Members read their flat's forfeit changes" on public.forfeit_changes
  for select to authenticated
  using (flat_id = (select public.my_flat_id()));

-- Grants ----------------------------------------------------------------------------------
-- "Automatically expose new tables" is off, so access is granted explicitly, column by
-- column where it matters: members can rename the flat and change the forfeit, but never
-- its join code, can change their own display name but not their flat, and can only
-- choose a chore's title and who did it. Forfeit changes are read-only; the trigger
-- writes them.

revoke all on public.flats, public.flat_members, public.chores, public.forfeit_changes
  from anon, authenticated;

grant select on public.flats, public.flat_members, public.chores, public.forfeit_changes
  to authenticated;
grant update (name, forfeit) on public.flats to authenticated;
grant update (display_name) on public.flat_members to authenticated;
grant insert (title, done_by) on public.chores to authenticated;
grant delete on public.chores to authenticated;

revoke execute on function
  public.my_flat_id(),
  public.chore_words(text),
  public.chore_category(text),
  public.chore_points(text),
  public.set_chore_points(),
  public.log_forfeit_change(),
  public.generate_join_code(),
  public.handle_new_user(),
  public.join_flat(text)
from public, anon;

-- The points trigger runs as the member logging the chore, so it needs the scoring
-- functions too.
grant execute on function
  public.my_flat_id(),
  public.chore_words(text),
  public.chore_category(text),
  public.chore_points(text),
  public.join_flat(text)
to authenticated;
