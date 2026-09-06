create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  captured_at timestamptz not null,
  status text not null default 'complete' check (status in ('processing', 'complete', 'failed')),
  quality jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  pose_results jsonb not null default '{}'::jsonb,
  view_image_paths jsonb not null default '{}'::jsonb,
  measurements jsonb not null default '[]'::jsonb,
  body_findings jsonb not null default '[]'::jsonb
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in_date date not null,
  discomfort integer not null check (discomfort between 0 and 10),
  posture_control integer not null check (posture_control between 0 and 10),
  energy integer not null check (energy between 0 and 10),
  red_flags boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, check_in_date)
);

create table if not exists public.workout_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  completion_date date not null,
  item_name text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, completion_date, item_name)
);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'free',
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  processing_started_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scans_user_captured_at_idx
on public.scans (user_id, captured_at desc);

create index if not exists check_ins_user_date_idx
on public.check_ins (user_id, check_in_date desc);

create index if not exists workout_completions_user_date_idx
on public.workout_completions (user_id, completion_date desc);

create index if not exists weekly_reviews_user_week_idx
on public.weekly_reviews (user_id, week_start desc);

create index if not exists stripe_webhook_events_status_idx
on public.stripe_webhook_events (status, processing_started_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
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

drop trigger if exists weekly_reviews_set_updated_at on public.weekly_reviews;
create trigger weekly_reviews_set_updated_at
before update on public.weekly_reviews
for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists stripe_webhook_events_set_updated_at on public.stripe_webhook_events;
create trigger stripe_webhook_events_set_updated_at
before update on public.stripe_webhook_events
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.scans enable row level security;
alter table public.check_ins enable row level security;
alter table public.workout_completions enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_webhook_events enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.scans from anon;
revoke all on table public.check_ins from anon;
revoke all on table public.workout_completions from anon;
revoke all on table public.weekly_reviews from anon;
revoke all on table public.subscriptions from anon;
revoke all on table public.stripe_webhook_events from anon;
revoke all on table public.stripe_webhook_events from authenticated;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.scans to authenticated;
grant select, insert, update, delete on public.check_ins to authenticated;
grant select, insert, update, delete on public.workout_completions to authenticated;
grant select, insert, update, delete on public.weekly_reviews to authenticated;
grant select on public.subscriptions to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can read their own scans" on public.scans;
create policy "Users can read their own scans"
on public.scans for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own scans" on public.scans;
create policy "Users can insert their own scans"
on public.scans for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own scans" on public.scans;
create policy "Users can update their own scans"
on public.scans for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own scans" on public.scans;
create policy "Users can delete their own scans"
on public.scans for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own check-ins" on public.check_ins;
create policy "Users can manage their own check-ins"
on public.check_ins for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own workout completions" on public.workout_completions;
create policy "Users can manage their own workout completions"
on public.workout_completions for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own weekly reviews" on public.weekly_reviews;
create policy "Users can manage their own weekly reviews"
on public.weekly_reviews for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own subscription" on public.subscriptions;
create policy "Users can read their own subscription"
on public.subscriptions for select
to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scan-images',
  'scan-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own scan images" on storage.objects;
create policy "Users can read their own scan images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'scan-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can upload their own scan images" on storage.objects;
create policy "Users can upload their own scan images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'scan-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update their own scan images" on storage.objects;
create policy "Users can update their own scan images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'scan-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'scan-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete their own scan images" on storage.objects;
create policy "Users can delete their own scan images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'scan-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
