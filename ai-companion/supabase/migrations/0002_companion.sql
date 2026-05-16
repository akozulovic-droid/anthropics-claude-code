-- Phase 2: companion, images, chat, subscriptions + Storage + atomic
-- one-time creation. Run AFTER 0001_profiles.sql in the Supabase SQL editor.

-- ai_girls: exactly one per user (UNIQUE user_id), permanent ------------------
create table if not exists public.ai_girls (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users (id) on delete cascade,
  name                text not null,
  age                 integer not null check (age >= 18),
  personality         text not null,
  style               text not null,
  hair_color          text not null,
  eye_color           text not null,
  body_type           text,
  clothing_style      text not null,
  background_style    text not null,
  conversation_style  text not null,
  generated_prompt    text not null,
  main_image_url      text not null,
  created_at          timestamptz not null default now()
);

comment on table public.ai_girls is
  'One permanent AI companion per user. Never updated or deleted by users.';

-- images: main + gallery -----------------------------------------------------
create table if not exists public.images (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  ai_girl_id  uuid not null references public.ai_girls (id) on delete cascade,
  image_url   text not null,
  prompt      text,
  image_type  text not null default 'gallery' check (image_type in ('main', 'gallery')),
  created_at  timestamptz not null default now()
);

create index if not exists images_user_created_idx
  on public.images (user_id, created_at desc);

-- chat_messages: used in Phase 3 (schema created now) ------------------------
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  ai_girl_id  uuid not null references public.ai_girls (id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at);

-- subscriptions / billing events: used in Phase 5 (schema created now) -------
create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users (id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  status                  text,
  plan                    text,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Row Level Security: owner-only --------------------------------------------
alter table public.ai_girls       enable row level security;
alter table public.images         enable row level security;
alter table public.chat_messages  enable row level security;
alter table public.subscriptions  enable row level security;

drop policy if exists "ai_girls_select_own" on public.ai_girls;
create policy "ai_girls_select_own" on public.ai_girls
  for select using (auth.uid() = user_id);

drop policy if exists "images_select_own" on public.images;
create policy "images_select_own" on public.images
  for select using (auth.uid() = user_id);

drop policy if exists "images_insert_own" on public.images;
create policy "images_insert_own" on public.images
  for insert with check (auth.uid() = user_id);

drop policy if exists "chat_select_own" on public.chat_messages;
create policy "chat_select_own" on public.chat_messages
  for select using (auth.uid() = user_id);

drop policy if exists "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ai_girls has no INSERT/UPDATE/DELETE policy: rows are created only through
-- the create_ai_girl() function below and are permanent thereafter.

-- Atomic one-time creation ---------------------------------------------------
create or replace function public.create_ai_girl(
  p_name               text,
  p_age                integer,
  p_personality        text,
  p_style              text,
  p_hair_color         text,
  p_eye_color          text,
  p_body_type          text,
  p_clothing_style     text,
  p_background_style   text,
  p_conversation_style text,
  p_generated_prompt   text,
  p_main_image_url     text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if exists (
    select 1 from public.profiles
    where id = v_uid and ai_girl_created = true
  ) or exists (
    select 1 from public.ai_girls where user_id = v_uid
  ) then
    raise exception 'AI companion already created' using errcode = 'P0001';
  end if;

  insert into public.ai_girls (
    user_id, name, age, personality, style, hair_color, eye_color,
    body_type, clothing_style, background_style, conversation_style,
    generated_prompt, main_image_url
  ) values (
    v_uid, p_name, p_age, p_personality, p_style, p_hair_color, p_eye_color,
    p_body_type, p_clothing_style, p_background_style, p_conversation_style,
    p_generated_prompt, p_main_image_url
  )
  returning id into v_id;

  insert into public.images (user_id, ai_girl_id, image_url, prompt, image_type)
  values (v_uid, v_id, p_main_image_url, p_generated_prompt, 'main');

  update public.profiles set ai_girl_created = true where id = v_uid;

  return v_id;
exception
  when unique_violation then
    raise exception 'AI companion already created' using errcode = 'P0001';
end;
$$;

revoke all on function public.create_ai_girl(
  text, integer, text, text, text, text, text, text, text, text, text, text
) from public;
grant execute on function public.create_ai_girl(
  text, integer, text, text, text, text, text, text, text, text, text, text
) to authenticated;

-- Storage: private bucket, owner-scoped by first path segment (= user id) ----
insert into storage.buckets (id, name, public)
values ('companion-images', 'companion-images', false)
on conflict (id) do nothing;

drop policy if exists "companion_images_select_own" on storage.objects;
create policy "companion_images_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'companion-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "companion_images_insert_own" on storage.objects;
create policy "companion_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'companion-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
