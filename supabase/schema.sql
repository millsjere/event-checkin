-- VLISCO SIP & SHOP — check-in table
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- If you already created the table with `email text not null`, run this
-- migration instead to make email optional (unique index still allows
-- multiple NULLs, so guests without an email won't collide):
--   alter table public.checkins alter column email drop not null;

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now()
);

-- Prevent duplicate check-ins by email (case-insensitive) or phone (digits only).
create unique index if not exists checkins_email_unique
  on public.checkins (lower(email));

create unique index if not exists checkins_phone_unique
  on public.checkins (regexp_replace(phone, '\D', '', 'g'));

alter table public.checkins enable row level security;

-- Public check-in form can insert new rows, but never read them back in bulk.
create policy "Public can check in"
  on public.checkins
  for insert
  to anon
  with check (true);

-- Only signed-in admins (Supabase Auth users) can view or manage the guest list.
create policy "Admins can view checkins"
  on public.checkins
  for select
  to authenticated
  using (true);

create policy "Admins can delete checkins"
  on public.checkins
  for delete
  to authenticated
  using (true);
