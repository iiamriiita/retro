-- =============================================================================
-- Team Retro — initial schema
-- Postgres + Row Level Security. Run in the Supabase SQL editor, or via the CLI:
--   supabase db push
--
-- Security model
--   * All privileged writes/reads go through Next.js server routes using the
--     SERVICE ROLE key, which bypasses RLS. Owner authentication (close session,
--     owner-only data) is verified there by matching `sessions.owner_token`
--     against the httpOnly owner cookie.
--   * The ANON role (browser client) is used only for reading closed-session
--     results and for Realtime on comments. It is NEVER granted access to the
--     `sessions` table, so `owner_token` can never leak to the client.
-- =============================================================================

create extension if not exists "pgcrypto";

-- --- Tables -------------------------------------------------------------------

create table if not exists public.sessions (
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

create table if not exists public.participants (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  display_name  text,                                -- null in anonymous mode
  created_at    timestamptz not null default now()
);

create table if not exists public.answers (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.sessions(id) on delete cascade,
  participant_id  uuid not null references public.participants(id) on delete cascade,
  question_key    text not null,
  content         text not null,
  created_at      timestamptz not null default now()
);

create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.sessions(id) on delete cascade,
  answer_id    uuid not null references public.answers(id) on delete cascade,
  quote        text not null,
  quote_start  int  not null,        -- char offsets within the answer, to restore highlight
  quote_end    int  not null,
  body         text not null,
  author_name  text,                 -- null in anonymous mode
  created_at   timestamptz not null default now()
);

create index if not exists idx_participants_session on public.participants(session_id);
create index if not exists idx_answers_session      on public.answers(session_id);
create index if not exists idx_comments_session     on public.comments(session_id);
create index if not exists idx_comments_answer      on public.comments(answer_id);

-- --- Row Level Security -------------------------------------------------------
-- Enabling RLS with no permissive policy = deny-all for anon/authenticated.
-- The service role (server routes) bypasses RLS entirely.

alter table public.sessions     enable row level security;
alter table public.participants enable row level security;
alter table public.answers      enable row level security;
alter table public.comments     enable row level security;

-- sessions: intentionally NO anon policy — the client never reads this table,
-- so owner_token stays server-side only.

-- A session is "viewable" once it is closed OR its deadline has passed.
create or replace function public.session_is_viewable(sid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sessions s
    where s.id = sid
      and (s.status = 'closed' or s.deadline < now())
  );
$$;

-- answers: anon may read once results are viewable (results page / client fetch).
create policy "answers readable when session viewable"
  on public.answers for select
  to anon, authenticated
  using (public.session_is_viewable(session_id));

-- comments: anon may read + insert once results are viewable (Realtime threads).
create policy "comments readable when session viewable"
  on public.comments for select
  to anon, authenticated
  using (public.session_is_viewable(session_id));

create policy "comments insertable when session viewable"
  on public.comments for insert
  to anon, authenticated
  with check (public.session_is_viewable(session_id));

-- --- Realtime -----------------------------------------------------------------
-- Publish comments so multiple viewers see new threads live (Phase 2).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;
end $$;
