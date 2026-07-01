-- =============================================================================
-- Team Retro — initial schema
-- Postgres + Row Level Security. Run in the Supabase SQL editor, or via the CLI:
--   supabase db push
--
-- Tables are prefixed with `retro_` so this migration can share a Supabase
-- project with unrelated apps without any name collision.
--
-- Security model
--   * All privileged writes/reads go through Next.js server routes using the
--     SERVICE ROLE key, which bypasses RLS. Owner authentication (close session,
--     owner-only data) is verified there by matching `retro_sessions.owner_token`
--     against the httpOnly owner cookie.
--   * The ANON role (browser client) is used only for reading closed-session
--     results and for Realtime on comments. It is NEVER granted access to the
--     `retro_sessions` table, so `owner_token` can never leak to the client.
-- =============================================================================

create extension if not exists "pgcrypto";

-- --- Tables -------------------------------------------------------------------

create table if not exists public.retro_sessions (
  id           uuid primary key default gen_random_uuid(),
  owner_token  text        not null,                 -- matches the owner cookie
  template_id  text        not null,
  anonymity    text        not null default 'named'
                 check (anonymity in ('anonymous', 'named')),
  deadline     timestamptz not null,
  status       text        not null default 'open'
                 check (status in ('open', 'closed')),
  created_at   timestamptz not null default now()
);

create table if not exists public.retro_participants (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.retro_sessions(id) on delete cascade,
  display_name  text,                                -- null in anonymous mode
  created_at    timestamptz not null default now()
);

create table if not exists public.retro_answers (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.retro_sessions(id) on delete cascade,
  participant_id  uuid not null references public.retro_participants(id) on delete cascade,
  question_key    text not null,
  content         text not null,
  created_at      timestamptz not null default now()
);

create table if not exists public.retro_comments (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.retro_sessions(id) on delete cascade,
  answer_id    uuid not null references public.retro_answers(id) on delete cascade,
  quote        text not null,
  quote_start  int  not null,        -- char offsets within the answer, to restore highlight
  quote_end    int  not null,
  body         text not null,
  author_name  text,                 -- null in anonymous mode
  created_at   timestamptz not null default now()
);

create index if not exists idx_retro_participants_session on public.retro_participants(session_id);
create index if not exists idx_retro_answers_session      on public.retro_answers(session_id);
create index if not exists idx_retro_comments_session     on public.retro_comments(session_id);
create index if not exists idx_retro_comments_answer      on public.retro_comments(answer_id);

-- --- Row Level Security -------------------------------------------------------
-- Enabling RLS with no permissive policy = deny-all for anon/authenticated.
-- The service role (server routes) bypasses RLS entirely.

alter table public.retro_sessions     enable row level security;
alter table public.retro_participants enable row level security;
alter table public.retro_answers      enable row level security;
alter table public.retro_comments     enable row level security;

-- retro_sessions: intentionally NO anon policy — the client never reads this
-- table, so owner_token stays server-side only.

-- A session is "viewable" once it is closed OR its deadline has passed.
create or replace function public.retro_session_is_viewable(sid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.retro_sessions s
    where s.id = sid
      and (s.status = 'closed' or s.deadline < now())
  );
$$;

-- retro_answers: anon may read once results are viewable.
create policy "retro_answers readable when session viewable"
  on public.retro_answers for select
  to anon, authenticated
  using (public.retro_session_is_viewable(session_id));

-- retro_comments: anon may read + insert once results are viewable (Realtime).
create policy "retro_comments readable when session viewable"
  on public.retro_comments for select
  to anon, authenticated
  using (public.retro_session_is_viewable(session_id));

create policy "retro_comments insertable when session viewable"
  on public.retro_comments for insert
  to anon, authenticated
  with check (public.retro_session_is_viewable(session_id));

-- --- Realtime -----------------------------------------------------------------
-- Publish comments so multiple viewers see new threads live (Phase 2).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'retro_comments'
  ) then
    alter publication supabase_realtime add table public.retro_comments;
  end if;
end $$;
