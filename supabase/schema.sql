-- EventsMeet — Supabase schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
-- Safe to re-run (idempotent).

-- ============================================================
-- Tables
-- ============================================================

-- Public directory info shown to other users in "also going" lists.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

-- Contact info (Instagram/WhatsApp/etc). Kept separate from profiles so RLS
-- can reveal it ONLY to users you matched with (mutual wave).
create table if not exists public.contacts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  contact text not null default ''
);

-- Secret token for the personal webcal:// calendar feed. Own-row access only;
-- the feed API route reads it with the service-role key.
create table if not exists public.calendar_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token uuid not null unique default gen_random_uuid()
);

-- A user's saved (liked) events — the server-side source of truth once
-- signed in, and what the calendar feed serves.
create table if not exists public.saved_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_key text not null,
  title text not null,
  category text not null,
  date_text text not null default '',
  start_at timestamptz,
  venue text not null default '',
  price text not null default '',
  description text not null default '',
  url text not null default '',
  emoji text not null default '🎉',
  image text,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);
create index if not exists saved_events_event_key_idx on public.saved_events (event_key);

-- A "wave" 👋 from one user to another about a specific event.
-- Waves in both directions for the same event = a match.
create table if not exists public.waves (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_key, from_user, to_user),
  check (from_user <> to_user)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.calendar_tokens enable row level security;
alter table public.saved_events enable row level security;
alter table public.waves enable row level security;

-- profiles: everyone signed in can read the directory; you manage your own row.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles
  for select to authenticated using (true);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- contacts: you manage your own; matched users (mutual wave) can read yours.
drop policy if exists "contacts own" on public.contacts;
create policy "contacts own" on public.contacts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "contacts matched read" on public.contacts;
create policy "contacts matched read" on public.contacts
  for select to authenticated using (
    exists (
      select 1
      from public.waves w1
      join public.waves w2
        on w2.event_key = w1.event_key
       and w2.from_user = w1.to_user
       and w2.to_user   = w1.from_user
      where w1.from_user = auth.uid()
        and w1.to_user   = contacts.user_id
    )
  );

-- calendar_tokens: strictly own-row (the feed route uses the service role).
drop policy if exists "calendar tokens own" on public.calendar_tokens;
create policy "calendar tokens own" on public.calendar_tokens
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- saved_events: own rows fully; other people's rows are visible only for
-- events you also saved (to power "also going"). The helper runs as
-- security definer to avoid RLS self-recursion.
create or replace function public.my_event_keys()
returns setof text
language sql
security definer
set search_path = public
stable
as $$
  select event_key from public.saved_events where user_id = auth.uid()
$$;

drop policy if exists "saved own" on public.saved_events;
create policy "saved own" on public.saved_events
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "saved co-goers read" on public.saved_events;
create policy "saved co-goers read" on public.saved_events
  for select to authenticated using (event_key in (select public.my_event_keys()));

-- waves: you can send waves as yourself and see waves you sent or received.
drop policy if exists "waves send" on public.waves;
create policy "waves send" on public.waves
  for insert to authenticated with check (auth.uid() = from_user);
drop policy if exists "waves read own" on public.waves;
create policy "waves read own" on public.waves
  for select to authenticated using (auth.uid() = from_user or auth.uid() = to_user);
