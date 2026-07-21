-- =============================================================================
-- 媽媽的行事曆(/calendar)
-- 事件 + Web Push 訂閱。兩張表都只開 RLS 不加 policy:
-- 瀏覽器的 anon key 完全碰不到,一律走 API route(service role)+ 可選 PIN。
-- =============================================================================

create table if not exists public.calendar_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  event_date  date not null,
  event_time  time null,                -- null = 整天/未定時間
  remind_at   timestamptz null,         -- null = 不提醒
  reminded_at timestamptz null,         -- 已送出提醒的時間
  raw_input   text null,               -- 媽媽原本講的那句話(除錯用)
  created_at  timestamptz not null default now()
);

create index if not exists idx_calendar_events_date
  on public.calendar_events(event_date);
create index if not exists idx_calendar_events_due
  on public.calendar_events(remind_at)
  where reminded_at is null and remind_at is not null;

create table if not exists public.calendar_push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

alter table public.calendar_events enable row level security;
alter table public.calendar_push_subscriptions enable row level security;
