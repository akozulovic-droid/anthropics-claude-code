-- Phase 1: profiles + automatic Free-plan provisioning + Row Level Security.
-- Run this in the Supabase SQL editor (or via the Supabase CLI).

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id                            uuid primary key references auth.users (id) on delete cascade,
  email                         text,
  full_name                     text,
  plan                          text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id            text,
  stripe_subscription_id        text,
  subscription_status           text,
  monthly_image_limit           integer not null default 3,
  image_credits_used_this_month integer not null default 0,
  credits_reset_date            timestamptz not null
                                  default (date_trunc('month', now()) + interval '1 month'),
  ai_girl_created               boolean not null default false,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth user. Every new user starts on the Free plan.';

-- keep updated_at fresh -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create a Free profile when a user signs up -----------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, plan, monthly_image_limit)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    'free',
    3
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security ----------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT/DELETE policies: rows are created by the signup trigger
-- (SECURITY DEFINER) and removed via auth.users cascade only.
