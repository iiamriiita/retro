-- =============================================================================
-- Team Retro — threaded discussion (Figma-style)
-- A top-level comment anchors to a quote; replies belong to it via parent_id
-- and have no anchor. Run once.
-- =============================================================================

alter table public.retro_comments
  add column if not exists parent_id uuid references public.retro_comments(id) on delete cascade;

-- Replies have no quote anchor, so the anchor columns become nullable.
alter table public.retro_comments alter column quote drop not null;
alter table public.retro_comments alter column quote_start drop not null;
alter table public.retro_comments alter column quote_end drop not null;

create index if not exists idx_retro_comments_parent on public.retro_comments(parent_id);
