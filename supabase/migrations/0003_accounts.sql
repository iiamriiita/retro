-- =============================================================================
-- Team Retro — accounts (Phase 3a)
-- Move from an anonymous owner_token to real accounts (Supabase Auth), add the
-- discussion + AI-report flags, a participant roster, and per-session options.
-- Safe to run once on an existing project.
-- =============================================================================

-- retro_sessions ---------------------------------------------------------------
alter table public.retro_sessions
  add column if not exists owner_id uuid references auth.users(id) on delete cascade,
  add column if not exists allow_adhoc boolean not null default true,   -- may fillers add themselves off-roster?
  add column if not exists group_size int,                              -- hint only
  add column if not exists discussion_enabled boolean not null default false,
  add column if not exists ai_report text,                             -- persisted markdown report
  add column if not exists ai_report_at timestamptz;

-- owner_token is legacy now; new sessions authenticate the owner via owner_id.
alter table public.retro_sessions alter column owner_token drop not null;

create index if not exists idx_retro_sessions_owner on public.retro_sessions(owner_id);

-- retro_participants ------------------------------------------------------------
-- Named sessions pre-create a roster (display_name set, submitted_at null); the
-- filler picks who they are and submitting stamps submitted_at. Anonymous
-- sessions still create a participant row at submit time.
alter table public.retro_participants
  add column if not exists submitted_at timestamptz;

-- Ensure the service role keeps full access to the (unchanged-name) tables.
grant all privileges on
  public.retro_sessions,
  public.retro_participants,
  public.retro_answers,
  public.retro_comments
  to service_role;

-- The results/discussion page reads the roster (participant names) via the anon
-- client for named sessions once viewable, so allow that select.
grant select on public.retro_participants to anon, authenticated;

create policy "retro_participants readable when session viewable"
  on public.retro_participants for select
  to anon, authenticated
  using (public.retro_session_is_viewable(session_id));
