-- =============================================================================
-- Team Retro — role grants
-- Some Supabase projects don't auto-apply default privileges to the API roles
-- for newly created tables, which surfaces as
--   "permission denied for table retro_sessions"
-- even with a valid service_role key. This migration grants the privileges the
-- app relies on. Safe to run multiple times.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Server routes use the service role for all privileged reads/writes.
grant all privileges on
  public.retro_sessions,
  public.retro_participants,
  public.retro_answers,
  public.retro_comments
  to service_role;

-- Browser (anon) reads closed-session results and adds comments; RLS still
-- gates *which* rows (see 0001_init.sql). These grants just allow the operation
-- at the table level.
grant select on public.retro_answers  to anon, authenticated;
grant select, insert on public.retro_comments to anon, authenticated;
