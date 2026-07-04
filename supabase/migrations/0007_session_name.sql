-- Optional human name for a retro (defaults to "team name · date" in the
-- create wizard). Falls back to the template name when empty.
alter table retro_sessions add column if not exists name text;
