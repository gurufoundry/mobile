-- ============================================================================
-- Sonic Sticker — Migration 002: Row Level Security
-- ============================================================================
-- Locks down access. Run after 001_schema.sql.
--
-- Access model:
--   profiles      → user reads/updates own row
--   presets       → public read, no public write (seeded via service role)
--   stickers      → user reads/writes own only; public read via RPC for /play/:id
--   audio_notes   → user reads/writes own (via sticker ownership); public read via RPC
--   chat_sessions → user reads/writes own only
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enable RLS on all tables
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.presets enable row level security;
alter table public.stickers enable row level security;
alter table public.audio_notes enable row level security;
alter table public.chat_sessions enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create policy "profiles: users can view own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: users can update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert policy: profiles are auto-created by trigger.
-- No delete policy: deletion cascades from auth.users.

-- ----------------------------------------------------------------------------
-- presets (public read)
-- ----------------------------------------------------------------------------
create policy "presets: anyone can view active"
  on public.presets for select
  using (is_active = true);

-- No insert/update/delete policies for clients.
-- Seeding uses the service role key, which bypasses RLS.

-- ----------------------------------------------------------------------------
-- stickers (owner-only)
-- ----------------------------------------------------------------------------
create policy "stickers: users can view own"
  on public.stickers for select
  using (auth.uid() = user_id);

create policy "stickers: users can insert own"
  on public.stickers for insert
  with check (auth.uid() = user_id);

create policy "stickers: users can update own"
  on public.stickers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "stickers: users can delete own"
  on public.stickers for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- audio_notes (owner-only via sticker ownership)
-- ----------------------------------------------------------------------------
create policy "audio_notes: users can view own"
  on public.audio_notes for select
  using (
    exists (
      select 1 from public.stickers s
      where s.id = audio_notes.sticker_id and s.user_id = auth.uid()
    )
  );

create policy "audio_notes: users can insert own"
  on public.audio_notes for insert
  with check (
    exists (
      select 1 from public.stickers s
      where s.id = audio_notes.sticker_id and s.user_id = auth.uid()
    )
  );

create policy "audio_notes: users can update own"
  on public.audio_notes for update
  using (
    exists (
      select 1 from public.stickers s
      where s.id = audio_notes.sticker_id and s.user_id = auth.uid()
    )
  );

create policy "audio_notes: users can delete own"
  on public.audio_notes for delete
  using (
    exists (
      select 1 from public.stickers s
      where s.id = audio_notes.sticker_id and s.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- chat_sessions (owner-only)
-- ----------------------------------------------------------------------------
create policy "chat_sessions: users can view own"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "chat_sessions: users can insert own"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "chat_sessions: users can update own"
  on public.chat_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chat_sessions: users can delete own"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Public playback RPC
-- ----------------------------------------------------------------------------
-- The /play/:id page needs to fetch a sticker + its audio without auth, but
-- we don't want to open up SELECT on the whole stickers table to anon users.
-- Instead, expose a SECURITY DEFINER function that returns only what's needed
-- for playback (no user_id, no internal fields).
-- ----------------------------------------------------------------------------

create or replace function public.get_playback(sticker_id uuid)
returns table (
  id uuid,
  title text,
  design_json jsonb,
  preview_png_url text,
  audio_url text,
  duration_seconds integer,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    s.title,
    s.design_json,
    s.preview_png_url,
    a.audio_url,
    a.duration_seconds,
    s.created_at
  from public.stickers s
  left join public.audio_notes a on a.sticker_id = s.id
  where s.id = sticker_id;
$$;

-- Allow anon and authenticated roles to call it
grant execute on function public.get_playback(uuid) to anon, authenticated;

comment on function public.get_playback is 'Public read for /play/:id. Returns sticker + audio without exposing user_id or other private fields.';
