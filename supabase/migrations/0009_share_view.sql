-- Shared-view mode for the results link: both | report | raw.
-- Replaces 0008's boolean (kept for backward compat; no longer written).
alter table public.retro_sessions
  add column if not exists share_view text not null default 'both'
  check (share_view in ('both', 'report', 'raw'));
