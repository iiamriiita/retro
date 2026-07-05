-- Owner-controlled shared-view setting: when false, people opening the shared
-- results link see only the AI report (raw answers stay owner-only).
alter table public.retro_sessions
  add column if not exists share_show_raw boolean not null default true;
