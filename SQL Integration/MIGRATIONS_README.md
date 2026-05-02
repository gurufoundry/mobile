# Supabase Migrations — How to Apply

Three SQL files, applied in order. Run them in the Supabase SQL Editor (Dashboard → SQL Editor → New Query) or via the Supabase CLI.

## Order

1. **`001_schema.sql`** — Tables, indexes, foreign keys, triggers
2. **`002_rls.sql`** — Row Level Security policies + public playback RPC
3. **`003_storage.sql`** — Storage buckets + access policies

Run them as separate queries, in order. If any one fails halfway, fix the error and re-run that file (most statements are idempotent enough to retry, but check the error before blindly re-running).

## Option A — SQL Editor (manual, recommended for first project)

1. Supabase Dashboard → your project → SQL Editor → New Query
2. Paste the contents of `001_schema.sql`, click Run, confirm "Success. No rows returned"
3. Repeat for `002_rls.sql`, then `003_storage.sql`
4. Run the verification queries below

## Option B — Supabase CLI

If the project is linked locally:

```bash
supabase db push
# or apply individually:
psql "$SUPABASE_DB_URL" -f migrations/001_schema.sql
psql "$SUPABASE_DB_URL" -f migrations/002_rls.sql
psql "$SUPABASE_DB_URL" -f migrations/003_storage.sql
```

## Verification queries

After all three migrations apply, run these to sanity-check:

```sql
-- 1. All tables exist
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
-- Expected: audio_notes, chat_sessions, presets, profiles, stickers

-- 2. RLS is enabled everywhere
select tablename, rowsecurity
from pg_tables
where schemaname = 'public';
-- Expected: rowsecurity = true for all five tables

-- 3. Policies are in place
select tablename, policyname
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
-- Expected: ~17 policies total (1 profile select, 1 update, 1 preset select,
--           4 each on stickers/audio_notes/chat_sessions)

-- 4. Storage buckets exist
select id, public, file_size_limit
from storage.buckets
where id in ('preset-previews', 'sticker-previews', 'sticker-pdfs', 'audio-notes');
-- Expected: 4 rows

-- 5. Playback RPC is callable
select public.get_playback('00000000-0000-0000-0000-000000000000'::uuid);
-- Expected: 0 rows returned (no error). The function works, sticker just doesn't exist.
```

## Smoke test the security model

This is the test that matters. Don't skip it.

```sql
-- Sign up two test users via the Auth UI, note their user IDs.
-- Then, as user A (you can switch sessions in the SQL editor "Run as" dropdown):

-- Should succeed: insert your own sticker
insert into public.stickers (user_id, title, design_json)
values (auth.uid(), 'Test', '{"version":"1.0","title":"Test","shape":"circle"}'::jsonb);

-- Should return only your own stickers
select id, title from public.stickers;

-- Should fail or return 0 rows: try to read user B's stickers
-- (in the dashboard, switch "Run as" to user B, insert one of their stickers,
--  switch back to user A, and run:)
select id from public.stickers where user_id = '<user-b-id>';
-- Expected: 0 rows (RLS hides them)

-- Should fail: try to insert a sticker as user B while logged in as user A
insert into public.stickers (user_id, title, design_json)
values ('<user-b-id>', 'Hijack', '{}'::jsonb);
-- Expected: error or 0 rows (RLS check fails)
```

If any of those misbehave, **stop and debug before moving on**. RLS bugs are silent and dangerous.

## Common gotchas

- **`uuid-ossp` extension not enabled**: `001_schema.sql` enables it, but if your project predates this and has a different UUID extension, you may need to adjust.
- **Auth trigger doesn't fire**: the `on_auth_user_created` trigger needs the `service_role` to install. The SQL Editor in Supabase Dashboard runs as service role by default — if you're running via psql with a different role, you'll get a permissions error.
- **Storage bucket already exists**: the migration uses `on conflict do nothing`, so re-running is safe.
- **Public bucket policies look redundant**: they're not. Even on a "public" bucket, you still need an explicit SELECT policy on `storage.objects`.

## Rollback

If you need to start over (development only — never on data you care about):

```sql
-- Drop everything in reverse order
drop function if exists public.get_playback(uuid);
drop function if exists public.handle_new_user();
drop function if exists public.set_updated_at();
drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.chat_sessions;
drop table if exists public.audio_notes;
drop table if exists public.stickers;
drop table if exists public.presets;
drop table if exists public.profiles;

-- Storage buckets must be emptied before drop
delete from storage.objects where bucket_id in
  ('preset-previews', 'sticker-previews', 'sticker-pdfs', 'audio-notes');
delete from storage.buckets where id in
  ('preset-previews', 'sticker-previews', 'sticker-pdfs', 'audio-notes');
```
