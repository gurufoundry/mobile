# Preset Seed — How to Use

## What's here

`presets.seed.json` — 12 preset sticker designs spanning 5 categories:

| Category        | Count | Examples                                  |
|-----------------|-------|-------------------------------------------|
| `greeting`      | 2     | Hello Friend, Just Because                |
| `event`         | 2     | Big Day Energy, Save the Date             |
| `memory`        | 3     | Quiet Moment, Hold This, First Time       |
| `gift`          | 3     | From Me to You, Thank You Truly, Made With Love |
| `encouragement` | 2     | You Got This, Listen Up                   |

Each preset uses the schema defined in `sticker-schema.md`. They cover all 7 shapes (circle, rounded-square, square, hexagon, diamond, blob, badge), several decoration motifs (confetti, stars, dots, wave), and the full palette.

## How Claude Code should load it

In Phase 2 (Preset Gallery) of the build, generate a TypeScript seed script along these lines:

```ts
// scripts/seed-presets.ts
import { createClient } from '@supabase/supabase-js';
import presets from '../presets.seed.json';
import { renderToPng } from '../src/lib/sticker-renderer';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // service role only — never ship in client
);

async function seed() {
  for (const preset of presets) {
    // 1. Render preview PNG from design_json
    const pngBuffer = await renderToPng(preset.design_json, 512);

    // 2. Upload to Supabase storage
    const { data: upload } = await supabase.storage
      .from('preset-previews')
      .upload(`${preset.id}.png`, pngBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    const previewUrl = supabase.storage
      .from('preset-previews')
      .getPublicUrl(`${preset.id}.png`).data.publicUrl;

    // 3. Insert (or upsert) preset row
    await supabase.from('presets').upsert({
      id: preset.id,
      title: preset.title,
      category: preset.category,
      design_json: preset.design_json,
      preview_png_url: previewUrl,
      is_active: preset.is_active,
      sort_order: preset.sort_order
    });

    console.log(`✓ Seeded ${preset.title}`);
  }
}

seed();
```

Run with: `pnpm tsx scripts/seed-presets.ts`

## Why preview PNGs are pre-rendered

The library and gallery views need to load fast. Instead of rendering 12 SVGs in the browser on every gallery load, we render once at seed time and serve cached PNGs. The full SVG only renders when the user opens a preset detail or starts customizing.

## Adding more presets later

Edit `presets.seed.json`, add new entries with sequential `id` and `sort_order`, then re-run the seed script. The `upsert` makes it idempotent.

## Validation before seeding

Before inserting, validate each design against the schema rules in `sticker-schema.md` section "Validation rules". Use a small zod schema or hand-rolled validator. If a preset fails validation, abort the seed and log which one — don't silently skip.
