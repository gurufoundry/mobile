-- ============================================================================
-- Sonic Sticker — Migration 005: Pack Schema
-- ============================================================================
-- Creates the packs table, extends presets with pack_id + season fields.
-- Run after 004_seed_presets.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- packs table
-- ----------------------------------------------------------------------------
create table if not exists public.packs (
  id          text primary key,
  title       text not null,
  tagline     text,
  is_seasonal boolean not null default false,
  season_start date,
  season_end   date,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.packs enable row level security;

create policy "packs: anyone can view active"
  on public.packs for select
  using (is_active = true);

create index packs_active_sort_idx on public.packs (is_active, sort_order);

comment on table public.packs is 'Theme packs that group related presets.';

-- ----------------------------------------------------------------------------
-- Extend presets with pack_id + season window
-- ----------------------------------------------------------------------------
alter table public.presets
  add column if not exists pack_id text references public.packs(id) on delete set null,
  add column if not exists season_start date,
  add column if not exists season_end   date;

create index if not exists presets_pack_idx on public.presets (pack_id, sort_order);

-- Update category constraint to include pack categories
alter table public.presets
  drop constraint if exists presets_category_check;

alter table public.presets
  add constraint presets_category_check check (
    category in ('greeting', 'event', 'memory', 'gift', 'encouragement', 'kids', 'seasonal')
  );
