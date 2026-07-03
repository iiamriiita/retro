-- Per-owner cache for the AI "Team Insights" panel on the dashboard.
-- Real stat cards + the sentiment chart are computed live; only the AI
-- narrative/themes/sentiment are generated on demand and cached here.

create table if not exists retro_team_insights (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  generated_at timestamptz not null default now()
);

alter table retro_team_insights enable row level security;

-- Only the service-role key (server routes / server components) ever touches
-- this table, so no anon/authenticated policies are needed.
grant all on table retro_team_insights to service_role;
