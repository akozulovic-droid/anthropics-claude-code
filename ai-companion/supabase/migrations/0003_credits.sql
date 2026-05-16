-- Phase 4: server-side image credit accounting with automatic monthly reset.
-- Run AFTER 0002_companion.sql. All functions are keyed to auth.uid() and
-- are the single source of truth — the frontend count is display-only.

-- Resets the monthly window if it has elapsed and keeps the limit in sync
-- with the current plan (Free = 3, Pro = 20). Returns the live credit state.
create or replace function public.sync_image_credits()
returns table (
  plan                           text,
  monthly_image_limit            integer,
  image_credits_used_this_month  integer,
  credits_reset_date             timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  update public.profiles p
  set
    image_credits_used_this_month =
      case when now() >= p.credits_reset_date
           then 0 else p.image_credits_used_this_month end,
    credits_reset_date =
      case when now() >= p.credits_reset_date
           then date_trunc('month', now()) + interval '1 month'
           else p.credits_reset_date end,
    monthly_image_limit =
      case when p.plan = 'pro' then 20 else 3 end
  where p.id = v_uid;

  return query
    select p.plan, p.monthly_image_limit,
           p.image_credits_used_this_month, p.credits_reset_date
    from public.profiles p
    where p.id = v_uid;
end;
$$;

-- Atomically reserves one credit (after applying any due reset).
create or replace function public.consume_image_credit()
returns table (
  success                        boolean,
  monthly_image_limit            integer,
  image_credits_used_this_month  integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_limit integer;
  v_used  integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- Lock the row to serialise concurrent generation requests.
  select
    case when now() >= p.credits_reset_date then 0
         else p.image_credits_used_this_month end,
    case when p.plan = 'pro' then 20 else 3 end
  into v_used, v_limit
  from public.profiles p
  where p.id = v_uid
  for update;

  if v_used >= v_limit then
    update public.profiles p set
      image_credits_used_this_month = v_used,
      monthly_image_limit = v_limit,
      credits_reset_date =
        case when now() >= p.credits_reset_date
             then date_trunc('month', now()) + interval '1 month'
             else p.credits_reset_date end
    where p.id = v_uid;
    return query select false, v_limit, v_used;
    return;
  end if;

  update public.profiles p set
    image_credits_used_this_month = v_used + 1,
    monthly_image_limit = v_limit,
    credits_reset_date =
      case when now() >= p.credits_reset_date
           then date_trunc('month', now()) + interval '1 month'
           else p.credits_reset_date end
  where p.id = v_uid;

  return query select true, v_limit, v_used + 1;
end;
$$;

-- Returns a reserved credit (e.g. when image generation fails downstream).
create or replace function public.refund_image_credit()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  update public.profiles
  set image_credits_used_this_month =
        greatest(image_credits_used_this_month - 1, 0)
  where id = v_uid;
end;
$$;

revoke all on function public.sync_image_credits() from public;
revoke all on function public.consume_image_credit() from public;
revoke all on function public.refund_image_credit() from public;
grant execute on function public.sync_image_credits() to authenticated;
grant execute on function public.consume_image_credit() to authenticated;
grant execute on function public.refund_image_credit() to authenticated;
