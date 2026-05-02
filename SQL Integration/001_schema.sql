-- ============================================================================
-- Sonic Sticker — Migration 001: Schema
-- ============================================================================
-- Creates the core tables. RLS policies and storage buckets are in subsequent
-- migrations. Run this first.
-- ============================================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- profiles: public-facing user data, mirrors auth.users
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data, one row per auth user.';

-- ----------------------------------------------------------------------------
-- presets: curated templates, publicly readable
-- ----------------------------------------------------------------------------
create table public.presets (
  id text primary key,                        -- e.g. 'preset-001' (matches seed file)
  title text not null,
  category text not null,
  design_json jsonb not null,
  preview_png_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint presets_category_check check (
    category in ('greeting', 'event', 'memory', 'gift', 'encouragement')
  )
);

create index presets_active_sort_idx on public.presets (is_active, sort_order);
create index presets_category_idx on public.presets (category) where is_active = true;

comment on table public.presets is 'Curated sticker templates seeded from presets.seed.json. Public read.';

-- ----------------------------------------------------------------------------
-- stickers: user-created sticker designs
-- ----------------------------------------------------------------------------
create table public.stickers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  design_json jsonb not null,
  preview_png_url text,
  print_pdf_url text,
  source_preset_id text references public.presets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stickers_user_idx on public.stickers (user_id, created_at desc);

comment on table public.stickers is 'User-owned sticker designs. RLS-protected.';

-- ----------------------------------------------------------------------------
-- audio_notes: voice notes attached to stickers (one-to-one)
-- ----------------------------------------------------------------------------
create table public.audio_notes (
  id uuid primary key default uuid_generate_v4(),
  sticker_id uuid not null unique references public.stickers(id) on delete cascade,
  audio_url text not null,
  duration_seconds integer not null,
  created_at timestamptz not null default now(),

  constraint audio_notes_duration_check check (duration_seconds > 0 and duration_seconds <= 60)
);

create index audio_notes_sticker_idx on public.audio_notes (sticker_id);

comment on table public.audio_notes is 'Voice recordings attached to stickers. Max 60 seconds.';

-- ----------------------------------------------------------------------------
-- chat_sessions: conversation history with the AI agent
-- ----------------------------------------------------------------------------
create table public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sticker_id uuid references public.stickers(id) on delete set null,
  messages jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chat_sessions_status_check check (
    status in ('active', 'completed', 'abandoned')
  )
);

create index chat_sessions_user_idx on public.chat_sessions (user_id, updated_at desc);
create index chat_sessions_sticker_idx on public.chat_sessions (sticker_id);

comment on table public.chat_sessions is 'AI agent conversation history. Linked to resulting sticker on completion.';

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger presets_updated_at before update on public.presets
  for each row execute function public.set_updated_at();

create trigger stickers_updated_at before update on public.stickers
  for each row execute function public.set_updated_at();

create trigger chat_sessions_updated_at before update on public.chat_sessions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- profile auto-creation on signup
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
