-- Roadora v6.9.0 — accounts en cloudsynchronisatie
-- Uitvoeren in Supabase > SQL Editor.
-- Deze tabel gebruikt Row Level Security: iedere gebruiker ziet uitsluitend eigen roadtrips.

create table if not exists public.roadora_trips (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null default 'Roadtrip' check (char_length(name) between 1 and 160),
  route text not null default '' check (char_length(route) <= 300),
  days integer not null default 1 check (days between 1 and 31),
  snapshot jsonb not null default '{}'::jsonb,
  revision bigint not null default 1 check (revision > 0),
  client_hash text not null default '',
  client_updated_at timestamptz not null default now(),
  device_id text not null default '',
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists roadora_trips_user_updated_idx
  on public.roadora_trips (user_id, updated_at desc);

create or replace function public.roadora_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists roadora_trips_set_updated_at on public.roadora_trips;
create trigger roadora_trips_set_updated_at
before update on public.roadora_trips
for each row execute function public.roadora_set_updated_at();

alter table public.roadora_trips enable row level security;
alter table public.roadora_trips force row level security;

revoke all on table public.roadora_trips from anon;
grant select, insert, update on table public.roadora_trips to authenticated;

drop policy if exists "Roadora gebruikers lezen eigen roadtrips" on public.roadora_trips;
create policy "Roadora gebruikers lezen eigen roadtrips"
on public.roadora_trips
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Roadora gebruikers maken eigen roadtrips" on public.roadora_trips;
create policy "Roadora gebruikers maken eigen roadtrips"
on public.roadora_trips
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Roadora gebruikers wijzigen eigen roadtrips" on public.roadora_trips;
create policy "Roadora gebruikers wijzigen eigen roadtrips"
on public.roadora_trips
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

comment on table public.roadora_trips is
  'Roadora-roadtrips per ingelogde gebruiker. Toegang uitsluitend via Row Level Security.';
