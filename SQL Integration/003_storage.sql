-- ============================================================================
-- Sonic Sticker — Migration 003: Storage Buckets
-- ============================================================================
-- Creates storage buckets and their access policies. Run after 002_rls.sql.
--
-- Buckets:
--   preset-previews   → public read, service-role write (seeded PNGs)
--   sticker-previews  → public read (anyone with URL), authenticated write (own only)
--   sticker-pdfs      → owner-only read/write (private print files)
--   audio-notes       → public read (anyone with URL), authenticated write (own only)
--
-- Why some assets are publicly readable: the /play/:id page is unauthenticated.
-- Anyone with the link to a sticker preview or audio file can view/play it.
-- This is intentional — the URL acts as the share key. URLs are uuid-based
-- and unguessable.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Bucket creation (idempotent)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('preset-previews', 'preset-previews', true, 2097152,
   array['image/png', 'image/jpeg', 'image/svg+xml']),
  ('sticker-previews', 'sticker-previews', true, 5242880,
   array['image/png', 'image/jpeg', 'image/svg+xml']),
  ('sticker-pdfs', 'sticker-pdfs', false, 10485760,
   array['application/pdf']),
  ('audio-notes', 'audio-notes', true, 2097152,
   array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'])
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- preset-previews: public read, service role only writes
-- ----------------------------------------------------------------------------
create policy "preset-previews: public read"
  on storage.objects for select
  using (bucket_id = 'preset-previews');

-- No insert/update/delete policies for clients.
-- Service role bypasses RLS for seeding.

-- ----------------------------------------------------------------------------
-- sticker-previews: public read, owner-only write
-- ----------------------------------------------------------------------------
-- Convention: file path is `{user_id}/{sticker_id}.png`
-- Owner check parses user_id from the path.
-- ----------------------------------------------------------------------------

create policy "sticker-previews: public read"
  on storage.objects for select
  using (bucket_id = 'sticker-previews');

create policy "sticker-previews: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'sticker-previews'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "sticker-previews: owner update"
  on storage.objects for update
  using (
    bucket_id = 'sticker-previews'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "sticker-previews: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'sticker-previews'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ----------------------------------------------------------------------------
-- sticker-pdfs: owner-only everything
-- ----------------------------------------------------------------------------
-- Print PDFs stay private. The user downloads via signed URLs created
-- server-side when they hit "Export PDF".
-- ----------------------------------------------------------------------------

create policy "sticker-pdfs: owner read"
  on storage.objects for select
  using (
    bucket_id = 'sticker-pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "sticker-pdfs: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'sticker-pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "sticker-pdfs: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'sticker-pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ----------------------------------------------------------------------------
-- audio-notes: public read, owner-only write
-- ----------------------------------------------------------------------------
-- Convention: file path is `{user_id}/{sticker_id}.webm`
-- Public read so /play/:id can stream without auth.
-- ----------------------------------------------------------------------------

create policy "audio-notes: public read"
  on storage.objects for select
  using (bucket_id = 'audio-notes');

create policy "audio-notes: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'audio-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "audio-notes: owner update"
  on storage.objects for update
  using (
    bucket_id = 'audio-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "audio-notes: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'audio-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
