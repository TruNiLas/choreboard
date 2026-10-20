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

-- Points --------------------------------------------------------------------------------

-- Keep in sync with src/lib/presets.ts. Anything not listed is worth 1 point.
create or replace function public.chore_points(title text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case lower(btrim(title))
    when 'did the dishes' then 1
    when 'wiped the table' then 1
    when 'took out the bins' then 1
    when 'emptied the dishwasher' then 1
    when 'cooked for the flat' then 2
    when 'did a shopping run' then 2
    when 'vacuumed' then 2
    when 'cleaned the bathroom' then 3
    when 'cleaned the kitchen' then 3
    else 1
  end
$$;

-- Points are always set here, never trusted from the browser.
create or replace function public.set_chore_points()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.title := btrim(new.title);
  new.points := public.chore_points(new.title);
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

  insert into public.flat_members (user_id, flat_id, display_name)
  values (
    new.id,
    new_flat_id,
    left(coalesce(nullif(split_part(new.email, '@', 1), ''), 'Flatmate'), 40)
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

-- Row Level Security ----------------------------------------------------------------------

alter table public.flats enable row level security;
alter table public.flat_members enable row level security;
alter table public.chores enable row level security;

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

-- Grants ----------------------------------------------------------------------------------
-- "Automatically expose new tables" is off, so access is granted explicitly, column by
-- column where it matters: members can rename the flat and change the forfeit, but never
-- its join code, and can only choose a chore's title and who did it.

revoke all on public.flats, public.flat_members, public.chores from anon, authenticated;

grant select on public.flats, public.flat_members, public.chores to authenticated;
grant update (name, forfeit) on public.flats to authenticated;
grant insert (title, done_by) on public.chores to authenticated;

revoke execute on function
  public.my_flat_id(),
  public.chore_points(text),
  public.set_chore_points(),
  public.generate_join_code(),
  public.handle_new_user(),
  public.join_flat(text)
from public, anon;

grant execute on function
  public.my_flat_id(),
  public.chore_points(text),
  public.join_flat(text)
to authenticated;
