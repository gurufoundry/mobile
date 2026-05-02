# Sonic Sticker — Project Spec

> **For Claude Code.** This is the single source of truth for the MVP build. Read this end-to-end before writing any code. When in doubt, ask before assuming.

---

## 1. The product in one paragraph

Sonic Sticker is a web app that turns a 2-minute conversation into a custom sticker design with an attached voice note. The user chats with an AI agent that asks 3–5 guided questions (purpose, vibe, color, message), generates a sticker design, lets them attach a short audio recording, and exports a print-ready file. The sticker is intended to be paired with an NFC tag — when scanned, it opens a playback page that auto-plays the audio. MVP is web-only, single-user (the founder is user zero), built to validate the loop before adding social, marketplace, or native mobile.

---

## 2. Tech stack (decided)

- **Frontend:** React (Vite, TypeScript)
- **Styling:** Tailwind CSS + custom CSS variables for the design tokens
- **Backend / DB / Auth / Storage:** Supabase
- **AI:** Anthropic Claude API (use the latest Sonnet model — check `https://docs.claude.com/en/docs/about-claude/models` at session start)
- **Hosting:** Cloudflare Pages (frontend) + Supabase (backend)
- **Package manager:** pnpm

**Don't substitute these without asking.** Specifically: don't swap Supabase for Firebase, don't swap Claude for OpenAI, don't add a separate Node backend (Supabase Edge Functions handle anything server-side we need).

---

## 3. MVP scope

### In scope (Phase 1)

1. Email + Apple/Google sign-in (Supabase Auth)
2. Preset template gallery (10–15 seeded designs, browsable + filterable)
3. Guided AI chat creator — full-screen modal, 3–5 questions, returns a sticker design
4. Sticker preview with quick edits (color swap, regenerate, send back to chat)
5. Export: PNG (transparent bg) + print-ready PDF with cut guides
6. Audio recording (up to 60s) + cloud storage in Supabase
7. Personal library of created stickers (with an indicator for ones with audio)
8. NFC playback page — public URL routed by sticker ID, auto-plays attached audio

### Out of scope (Phase 2+, do not build)

- Native iOS / Android (React Native comes later)
- Direct NFC writing from browser
- Physical sticker fulfillment / ordering
- Sharing / recipient flows for non-account users (beyond playback page)
- Public template marketplace
- Voice-to-sticker (audio-driven design)
- Sticker collections / albums / tags

---

## 4. Sticker generation approach

This is the trickiest part. Two options to discuss with the user before implementing — **do not pick one silently**:

**Option A — SVG-by-Claude:** The AI agent returns a structured JSON response describing the sticker (shape, colors, text, layout, motifs) and the frontend renders it as an SVG using a deterministic template engine. Pros: fast, cheap, infinitely editable, vector-native (scales to any print size). Cons: less visually surprising than image generation.

**Option B — Image generation via a separate API:** Claude conducts the conversation and produces a prompt; an image model (e.g., Replicate, fal.ai, or Anthropic's image-capable endpoints if available at session time) renders it. Pros: more visually rich. Cons: slower, costs more per generation, harder to edit, raster output needs upscaling for print.

**Recommendation:** Start with Option A for the MVP. It maps cleanly to the "guided chat → structured output" pattern, lets users edit colors and text instantly, and produces print-ready vector output. Layer Option B in later as a "premium" or "surprise me" path.

When implementing Option A, the Claude API call should use a system prompt that constrains output to a JSON schema — see `/docs/sticker-schema.md` (create this on first run).

---

## 5. Data model (Supabase)

```
profiles
  id (uuid, fk auth.users)
  display_name (text)
  created_at (timestamp)

stickers
  id (uuid, pk)
  user_id (uuid, fk profiles)
  title (text)
  design_json (jsonb)         -- the structured design from Claude
  preview_png_url (text)       -- rendered preview, in Supabase storage
  print_pdf_url (text, null)   -- generated on export
  created_at (timestamp)
  updated_at (timestamp)

audio_notes
  id (uuid, pk)
  sticker_id (uuid, fk stickers, unique)
  audio_url (text)             -- in Supabase storage
  duration_seconds (int)
  created_at (timestamp)

presets
  id (uuid, pk)
  title (text)
  category (text)              -- 'memory' | 'gift' | 'greeting' | 'event' | etc
  design_json (jsonb)
  preview_png_url (text)
  is_active (bool, default true)
  sort_order (int)

chat_sessions
  id (uuid, pk)
  user_id (uuid, fk profiles)
  sticker_id (uuid, fk stickers, null)
  messages (jsonb)             -- array of {role, content, timestamp}
  status (text)                -- 'active' | 'completed' | 'abandoned'
  created_at (timestamp)
```

RLS policies: users can only read/write their own rows in `stickers`, `audio_notes`, `chat_sessions`. `presets` are publicly readable. The NFC playback page uses a public read policy on a specific RPC that returns sticker + audio for a given ID — no auth required to play.

---

## 6. Routing (web app)

```
/                           Landing (preset gallery if logged in, marketing if not)
/auth                       Sign-in / sign-up
/create                     Full-screen guided chat modal (or full page on mobile)
/sticker/:id                Preview + edit + export
/sticker/:id/audio          Audio recording for that sticker
/library                    Personal library
/play/:id                   PUBLIC playback page (no auth) — auto-plays audio
/preset/:id                 Preset detail view
```

---

## 7. Design system

**Colors (CSS variables, exact hex):**
```css
--ink:    #0E0E10;
--paper:  #F4F1EA;
--paper-2:#EAE5D9;
--coral:  #FF5A3D;  /* primary CTA */
--acid:   #D4FF3D;  /* accent / success */
--plum:   #2B1B4A;  /* deep accent / audio */
--sky:    #6FA8FF;  /* tertiary */
```

**Type:**
- Display: **Fraunces** (Google Fonts, weights 400/600/800, opsz variable)
- UI/Body: **Inter Tight** (Google Fonts, weights 400/500/600/700)
- Mono: **JetBrains Mono** (labels, meta, timestamps)

**Vibe:** warm paper background (not white), confident editorial typography, high-energy accents, subtle grain texture overlay, soft shadows. Avoid generic SaaS/AI gradient aesthetics. Reference: see the user-flow doc that accompanies this spec.

---

## 8. Build order

Do these in order. **Do not skip ahead.** Stop and confirm with the user after each phase.

### Phase 0 — Skeleton (1 session)
- Vite + React + TS project, Tailwind + design tokens wired up
- Routing scaffolded (React Router)
- Supabase client initialized
- Empty pages for each route, layout shell with bottom-tab nav
- Deploy to Cloudflare Pages, confirm it loads

### Phase 1 — Auth + DB (1 session)
- Supabase project provisioned (the user does this manually; you provide the SQL)
- Schema migrations for the tables above + RLS policies
- Email + Google sign-in flows working
- Auth state available across the app

### Phase 2 — Preset gallery (1 session)
- Seed script for 10–15 presets (define the `design_json` structure here)
- Gallery page renders presets from DB
- Category chips filter
- Tap → preset detail view

### Phase 3 — Guided chat (the centerpiece) (2 sessions)
- Define the JSON schema for sticker designs
- Server-side endpoint (Supabase Edge Function) that calls Claude API with system prompt + conversation history, returns structured design JSON
- Full-screen chat UI with suggestion chips
- "Generating" loading state
- Save chat session + resulting sticker to DB

### Phase 4 — Preview + edit + export (1 session)
- SVG renderer for sticker design JSON
- Color swap, regenerate, "send back to chat" actions
- PNG export (canvas-based)
- PDF export with cut guides (use pdf-lib or similar)

### Phase 5 — Audio (1 session)
- Recording UI with waveform feedback (use MediaRecorder API)
- Upload to Supabase Storage
- Link to sticker via `audio_notes` table
- 60s cap enforced client + server side

### Phase 6 — Library + playback page (1 session)
- Library shows user's stickers, audio indicator
- Public `/play/:id` page — fetches sticker + audio via public RPC, auto-plays on load
- Minimal styling, one button to "create your own" (auth gate)

### Phase 7 — Polish (1 session)
- Onboarding carousel (3 frames)
- Empty states, error states, loading skeletons
- Mobile responsiveness pass
- Final design system audit

---

## 9. Things to confirm before starting

Ask the user these at the start of the first session:

1. Has the Supabase project been created? Do you have the URL + anon key?
2. Has the Anthropic API key been generated? (Set as a secret in Supabase Edge Functions, never in frontend code.)
3. Is there a Cloudflare account ready, or should we deploy to Vercel/Netlify instead?
4. **Sticker generation:** Option A (SVG-by-Claude) confirmed, or want to discuss Option B?
5. Any existing GitHub repo, or start fresh?

---

## 10. Constraints + non-negotiables

- **Never put the Anthropic API key in frontend code.** All Claude API calls go through Supabase Edge Functions.
- **Respect Supabase RLS.** Test that a user can't read another user's stickers.
- **Print-ready means vector or 300dpi.** Don't ship a 72dpi PNG and call it printable.
- **Don't add features not in the MVP scope** without explicit user approval, even if they seem small.
- **Don't auto-generate stickers** without the user clicking through the chat flow — the conversation IS the product.
- **Mobile responsiveness is required from day one** — Guru will test on iPhone alongside desktop.
- **Audio max 60s, max 2MB.** Enforce on both client and server.

---

## 11. Reference materials

- User-flow doc (accompanying HTML file with screen mocks and visual design system)
- Claude API docs map: https://docs.claude.com/en/docs_site_map.md
- Claude Code docs map: https://docs.anthropic.com/en/docs/claude-code/claude_code_docs_map.md
- Supabase docs: https://supabase.com/docs

---

*End of spec. Build well.*
