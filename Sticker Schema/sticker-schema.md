# Sticker Design Schema

> The JSON contract between the AI agent (Claude API) and the SVG renderer. Every sticker — preset or AI-generated — conforms to this shape. Keep this file in sync with `presets.seed.json` and the Claude system prompt.

---

## Design goals

1. **Renderable to SVG with zero ambiguity.** Every field maps to a concrete SVG primitive.
2. **Editable post-generation.** Users can tap to swap colors, edit text, change shape — without re-running the agent.
3. **Print-safe.** All measurements in a normalized 1000×1000 unit canvas; renderer scales to any output size.
4. **Constrainable in a system prompt.** Small enough that Claude can return it reliably as JSON.

---

## Top-level shape

```json
{
  "version": "1.0",
  "id": "uuid-or-null-for-presets-pre-save",
  "title": "Happy 40, Bro",
  "shape": "rounded-square",
  "size": { "width": 1000, "height": 1000 },
  "background": { "type": "solid", "color": "coral" },
  "border": { "style": "solid", "color": "ink", "width": 12 },
  "elements": [ ... ],
  "palette": ["coral", "ink", "paper"],
  "tags": ["birthday", "playful", "bold"]
}
```

---

## Field reference

### `version` *(string, required)*
Schema version. Currently `"1.0"`. Bump when making breaking changes.

### `id` *(string | null)*
UUID once saved to DB. `null` when freshly generated and not yet persisted.

### `title` *(string, required, max 60 chars)*
Human-readable title. Used in the library and as the default filename on export.

### `shape` *(enum, required)*
The outer silhouette. One of:
- `"circle"` — round
- `"rounded-square"` — square with 80px corner radius
- `"square"` — sharp corners
- `"hexagon"` — six-sided
- `"diamond"` — square rotated 45°
- `"blob"` — organic, irregular (uses a preset blob path)
- `"badge"` — wavy edge, like a sheriff badge

Renderer maps each to an SVG `clip-path` or `<path>`.

### `size` *(object, required)*
Always `{ "width": 1000, "height": 1000 }` for MVP. Reserved for non-square stickers in Phase 2+.

### `background` *(object, required)*

```json
{
  "type": "solid" | "gradient" | "noise",
  "color": "<palette-token>",         // for solid
  "from": "<palette-token>",          // for gradient
  "to": "<palette-token>",            // for gradient
  "direction": "diagonal" | "vertical" | "horizontal" | "radial",  // for gradient
  "intensity": 0.0–1.0                // for noise overlay strength
}
```

### `border` *(object | null)*

```json
{
  "style": "solid" | "dashed" | "double" | "none",
  "color": "<palette-token>",
  "width": 1–24    // in canvas units
}
```

### `elements` *(array, required, max 8 items)*

The visual content. Order matters — earlier items render below later items. Each element is one of these shapes:

#### Text element

```json
{
  "type": "text",
  "id": "el-1",
  "content": "HAPPY",
  "font": "fraunces" | "inter-tight" | "jetbrains-mono",
  "weight": 400 | 600 | 700 | 800,
  "italic": false,
  "size": 12–240,                     // in canvas units
  "color": "<palette-token>",
  "x": 0–1000,                        // center x
  "y": 0–1000,                        // center y (baseline-adjusted by renderer)
  "anchor": "center" | "left" | "right",
  "rotation": -45 to 45,              // degrees
  "tracking": -50 to 200,             // letter-spacing in 1/1000 em
  "transform": "none" | "uppercase" | "lowercase"
}
```

#### Shape element

```json
{
  "type": "shape",
  "id": "el-2",
  "kind": "circle" | "square" | "triangle" | "star" | "heart" | "burst" | "arrow" | "line",
  "x": 0–1000,
  "y": 0–1000,
  "width": 1–1000,
  "height": 1–1000,
  "color": "<palette-token>",
  "stroke": "<palette-token> | null",
  "strokeWidth": 0–24,
  "rotation": 0–360,
  "opacity": 0.0–1.0
}
```

#### Decoration element *(curated motif library)*

```json
{
  "type": "decoration",
  "id": "el-3",
  "motif": "confetti" | "sparkles" | "stars" | "dots" | "stripes" | "grain" | "wave",
  "color": "<palette-token>",
  "density": 0.0–1.0,
  "scale": 0.5–2.0,
  "rotation": 0–360
}
```

Decorations render as patterns inside the sticker boundary. Useful for adding visual texture without the agent needing to position individual elements.

---

## Palette tokens

The agent does **not** return raw hex codes — it picks from named tokens, and the renderer resolves them. This keeps the system extensible and lets us swap palettes later.

| Token    | Hex       | Role                          |
|----------|-----------|-------------------------------|
| `ink`    | `#0E0E10` | Primary text, strokes         |
| `paper`  | `#F4F1EA` | Light backgrounds, text on dark |
| `paper-2`| `#EAE5D9` | Subtle elevation              |
| `coral`  | `#FF5A3D` | Warm accent                   |
| `acid`   | `#D4FF3D` | Bright accent, energy         |
| `plum`   | `#2B1B4A` | Deep accent                   |
| `sky`    | `#6FA8FF` | Cool accent                   |

The `palette` array on the top-level design is a hint to the editor about which tokens are "in play" — used to populate the quick-swap color picker in the preview screen.

---

## Validation rules (enforce in renderer + Edge Function)

1. `elements.length <= 8`
2. All `x`, `y` values within `[0, 1000]`
3. All `color` fields must be valid palette tokens (case-sensitive)
4. Text `content` must be ≤ 60 characters
5. `palette` array must contain at least 2 tokens, max 5
6. `tags` array must contain 1–6 lowercase tokens
7. Total file size of serialized JSON < 8KB

If validation fails, the renderer should fall back to a minimal "error sticker" with the title and a question mark, rather than crashing.

---

## Example: a complete birthday sticker

```json
{
  "version": "1.0",
  "id": null,
  "title": "Happy 40, Bro",
  "shape": "rounded-square",
  "size": { "width": 1000, "height": 1000 },
  "background": { "type": "solid", "color": "coral" },
  "border": { "style": "solid", "color": "ink", "width": 12 },
  "elements": [
    {
      "type": "decoration",
      "id": "el-bg",
      "motif": "confetti",
      "color": "paper",
      "density": 0.3,
      "scale": 1.0,
      "rotation": 0
    },
    {
      "type": "text",
      "id": "el-1",
      "content": "HAPPY",
      "font": "fraunces",
      "weight": 800,
      "italic": false,
      "size": 200,
      "color": "paper",
      "x": 500,
      "y": 350,
      "anchor": "center",
      "rotation": 0,
      "tracking": -20,
      "transform": "uppercase"
    },
    {
      "type": "text",
      "id": "el-2",
      "content": "40, BRO",
      "font": "fraunces",
      "weight": 800,
      "italic": true,
      "size": 180,
      "color": "acid",
      "x": 500,
      "y": 600,
      "anchor": "center",
      "rotation": -3,
      "tracking": -10,
      "transform": "uppercase"
    },
    {
      "type": "shape",
      "id": "el-3",
      "kind": "star",
      "x": 200,
      "y": 800,
      "width": 80,
      "height": 80,
      "color": "acid",
      "stroke": "ink",
      "strokeWidth": 6,
      "rotation": 15,
      "opacity": 1.0
    }
  ],
  "palette": ["coral", "ink", "paper", "acid"],
  "tags": ["birthday", "playful", "bold", "milestone"]
}
```

---

## Claude API system prompt (for the chat creator)

This goes into the Edge Function that wraps the Claude call.

```text
You are a sticker design agent for Sonic Sticker. Your job is to have a brief,
friendly conversation with the user (3–5 turns) to understand what kind of
sticker they want, then return a sticker design as a JSON object.

Conversation guidelines:
- Ask one question at a time, conversationally.
- Cover: purpose/occasion, vibe (playful/sentimental/bold/calm), and a key word
  or phrase for the sticker. Color and shape can be inferred from vibe.
- Offer 2–4 suggestion chips with each question to speed things up.
- Don't ask more than 5 questions. After enough info, generate the design.

Output rules:
- When ready to generate, respond with ONLY a JSON object matching the schema
  in the user message. No prose, no markdown fences, no commentary.
- Use only palette tokens: ink, paper, paper-2, coral, acid, plum, sky.
- Maximum 8 elements. Prefer fewer, well-composed elements.
- Text content must be punchy. Avoid generic phrases like "Have a nice day."
- All x/y values must be within 0–1000.

To indicate a turn is a question (not a generation), respond with:
{ "type": "question", "text": "...", "suggestions": ["...", "..."] }

To indicate a turn is the final design, respond with:
{ "type": "design", "design": { ...full design object... } }
```

---

## Future fields (do NOT implement in MVP)

Reserved for Phase 2+:
- `image` element type (raster image upload)
- `path` element type (custom SVG paths)
- `animation` (animated stickers for digital use)
- `audio_visualizer` (waveform rendered into the sticker)
- `multi_layer_clip` (stickers within stickers)

---

*End of schema spec.*
