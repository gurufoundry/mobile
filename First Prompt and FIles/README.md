# Sonic Sticker — Claude Code Kickoff

This folder contains everything you need to start building the MVP with Claude Code.

## Files

- **`SPEC.md`** — The project spec. Drop this in your repo root as `SPEC.md` so Claude Code can read it on every session.
- **`sonic-sticker-user-flow.html`** — Visual reference with screen mocks and design system. Open in a browser when you need a visual reminder.
- **`FIRST_PROMPT.md`** — The exact prompt to paste into Claude Code on session one.

---

## How to use this

### Step 1 — Install Claude Code

If you don't already have it:

```bash
npm install -g @anthropic-ai/claude-code
```

Latest install instructions: <https://docs.claude.com/en/docs/claude-code/overview>

### Step 2 — Create a project folder

```bash
mkdir sonic-sticker
cd sonic-sticker
```

Drop `SPEC.md` into the root of that folder.

### Step 3 — Set up the prerequisites Claude Code will ask for

Before starting the first session, have these ready (or be ready to skip and come back):

1. **Supabase project** — sign up at supabase.com, create a new project, grab the URL and anon key from project settings.
2. **Anthropic API key** — from console.anthropic.com. Don't commit it. You'll add it to Supabase Edge Functions as a secret.
3. **GitHub repo** (optional) — Claude Code can initialize one for you, or start local-only.
4. **Hosting account** — Cloudflare Pages, Vercel, or Netlify. Cloudflare is in the spec but any will work.

### Step 4 — Start the session

```bash
cd sonic-sticker
claude
```

Then paste the contents of `FIRST_PROMPT.md` as your first message.

### Step 5 — Work through the phases

The spec lays out 8 phases (Phase 0 through Phase 7). At the end of each phase, commit, push, and start a fresh session for the next phase to keep context clean. Always re-anchor by saying "read SPEC.md before we start."

---

## Tips

- **Commit often.** Claude Code is good but not infallible — you want to be able to roll back any phase that goes sideways.
- **Don't skip Phase 0.** The skeleton is what makes everything else possible. Resist the urge to jump to the chat creator.
- **The chat creator (Phase 3) will take 2 sessions.** That's expected. The first session designs the schema and prompt; the second wires it up end-to-end.
- **When Claude Code suggests scope creep, push back.** Point at the "out of scope" list in the spec.
- **Test on your phone every phase.** Mobile responsiveness is a requirement, not a polish step.

---

Good luck. Ping me whenever you want to iterate on the spec, redesign a screen, or talk through tradeoffs.
