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
Schema version. Currently `"1.1"`. Bump when making breaking changes.
(`1.1` adds the `illustration` element type, the `watercolor` background type, and
multi-stop gradient support. Backwards-compatible — renderers that don't recognize
an element type or background type should fall back gracefully rather than crash.)

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

Four background types. Mix-and-match is not supported — pick one `type`.

#### Solid

```json
{ "type": "solid", "color": "<palette-token>" }
```

#### Gradient — two-stop shorthand *(backwards-compatible)*

```json
{
  "type": "gradient",
  "from": "<palette-token>",
  "to": "<palette-token>",
  "direction": "diagonal" | "vertical" | "horizontal" | "radial"
}
```

#### Gradient — multi-stop *(3 or more colors)*

Use `stops` instead of `from`/`to`. Positions are 0.0–1.0 along the gradient axis.
Renderer uses this form when `stops` is present; `from`/`to` is ignored if both appear.

```json
{
  "type": "gradient",
  "stops": [
    { "color": "<palette-token>", "position": 0.0 },
    { "color": "<palette-token>", "position": 0.45 },
    { "color": "<palette-token>", "position": 1.0 }
  ],
  "direction": "diagonal" | "vertical" | "horizontal" | "radial"
}
```

#### Noise

```json
{ "type": "noise", "color": "<palette-token>", "intensity": 0.0–1.0 }
```

#### Watercolor *(new in v1.1)*

Simulates a soft watercolor wash using overlapping radial gradient blobs rendered
through an SVG `feGaussianBlur` filter. Each `wash` is an independent color pool
that bleeds into its neighbors. Use 2–5 washes for a natural result.

```json
{
  "type": "watercolor",
  "base": "<palette-token>",    // underlying paper tone — usually "paper" or "paper-2"
  "washes": [
    {
      "color": "<palette-token>",
      "cx": 0.0–1.0,            // normalized x-center of this blob (0 = left edge)
      "cy": 0.0–1.0,            // normalized y-center (0 = top edge)
      "r":  0.2–1.0,            // normalized radius relative to canvas width
      "opacity": 0.2–0.9        // per-wash opacity; keep ≤0.7 for soft bleed
    }
    // 2–5 wash objects
  ],
  "blur": 40–200                // feGaussianBlur sigma — higher = more bleed/spread
}
```

The renderer layers each wash as a `<rect>` filled with the blob's radial gradient
(color→transparent), applies the blur filter, then clips the whole stack to the
sticker shape. The blurred edges naturally create the irregular, pooled look of
real watercolor without any path complexity.

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

#### Illustration element *(hand-drawn SVG motif library)*

```json
{
  "type": "illustration",
  "id": "el-4",
  "motif": "sprig" | "single-stem" | "leaf-cluster" | "branch" | "bud" | "bloom"
        | "profile" | "embrace" | "hand" | "heart-line",
  "color": "<palette-token>",
  "x": 0–1000,           // center x of bounding box
  "y": 0–1000,           // center y of bounding box
  "width": 10–600,       // bounding box width in canvas units
  "height": 10–600,      // bounding box height in canvas units
  "rotation": 0–360,     // degrees, clockwise
  "stroke_width": 1–8,   // line weight; scales relative to rendered size
  "opacity": 0.0–1.0     // layering/wash effect
}
```

All illustration paths use `stroke-linecap: round` and `stroke-linejoin: round`. The `color`
token resolves to the stroke color. **There is no fill.** This ensures the motifs read as
illustration marks rather than solid shapes — consistent with the "hand-drawn ink line" aesthetic.

The renderer holds the canonical path data for each motif in a normalized 0 0 100 100 unit
space; the `width`/`height`/`x`/`y` params scale and position it on the 1000×1000 canvas.
`stroke_width` is applied after scaling, so a value of `3` always produces the same visual
weight regardless of the element's rendered size.

##### Botanical motifs

| Motif | Description |
|-------|-------------|
| `sprig` | Small leafy stem — a central gently-curved line with two pairs of side-branching leaves and a small tip leaf cluster |
| `single-stem` | One tall stem with a closed teardrop bud at the tip and two small sepals |
| `leaf-cluster` | Three overlapping elongated leaves fanning from a common base point |
| `branch` | Gently curved main stem with small leaves alternating on either side, plus a few drooping lower shoots |
| `bud` | A single closed flower bud — rounded teardrop petal-form held by a short stem with two small side sepals |
| `bloom` | A single open flower — six symmetrical petals radiating from a small open center circle |

##### Line-art motifs

| Motif | Description |
|-------|-------------|
| `profile` | A single continuous line tracing a face in left-facing side profile — forehead, nose, lips, chin |
| `embrace` | An abstract single-line sketch of two figures; bodies lean toward each other with arms implied by converging curves |
| `hand` | A continuous line sketch of an open hand — five fingers, loosely grouped, with a rounded palm base |
| `heart-line` | A heart drawn as one smooth, unbroken closed curve — entry and exit meet at the bottom point |

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
8. `illustration.motif` must be one of the 10 defined values; unknown motifs render as a simple cross/placeholder rather than crashing
9. `illustration.stroke_width` clamped to [1, 8]; renderer ignores out-of-range values rather than throwing

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
- `path` element type (fully custom user-supplied SVG paths — `illustration` covers the curated motif set)
- `animation` (animated stickers for digital use)
- `audio_visualizer` (waveform rendered into the sticker)
- `multi_layer_clip` (stickers within stickers)
- `path` element type (fully custom user-supplied SVG path data — for power users post-MVP)

---

*End of schema spec.*
