-- One team profile per organizer (the logged-in owner). Used for the
-- onboarding popup, the nav dropdown label, and to compute participation
-- (submissions / expected members) on the Team Insights panel.

create table if not exists retro_teams (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  team_size int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table retro_teams enable row level security;

-- Only the service-role key (server routes / server components) touches this.
grant all on table retro_teams to service_role;
