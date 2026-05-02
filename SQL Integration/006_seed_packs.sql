-- ============================================================================
-- Sonic Sticker — Migration 006: Seed Packs
-- ============================================================================
-- Inserts Bonbon Drop + Bloom Lines packs and their 12 preset stickers.
-- Run after 005_pack_schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Pack metadata
-- ----------------------------------------------------------------------------
INSERT INTO public.packs (id, title, tagline, is_seasonal, season_start, season_end, sort_order, is_active)
VALUES
  ('pack-bonbon-drop',  'Bonbon Drop',  'kawaii vibes, candy colors',                    false, null,         null,         1, true),
  ('pack-bloom-lines',  'Bloom Lines',  'soft florals for the ones you cherish',          true,  '2026-04-25', '2026-05-14', 2, true)
ON CONFLICT (id) DO UPDATE SET
  title        = EXCLUDED.title,
  tagline      = EXCLUDED.tagline,
  is_seasonal  = EXCLUDED.is_seasonal,
  season_start = EXCLUDED.season_start,
  season_end   = EXCLUDED.season_end,
  sort_order   = EXCLUDED.sort_order,
  is_active    = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- Bonbon Drop — 6 stickers
-- pack_palette: primary=#FFB7CE, secondary=#B3E5FC, accent_a=#FFF59D,
--               accent_b=#CE93D8, ink=#0E0E10
-- ----------------------------------------------------------------------------
INSERT INTO public.presets (id, title, category, design_json, preview_png_url, is_active, sort_order, pack_id, season_start, season_end)
VALUES
  (
    'preset-bonbon-001', 'hi!', 'kids',
    '{"version":"1.0","id":"preset-bonbon-001","title":"hi!","shape":"circle","size":{"width":1000,"height":1000},"background":{"type":"solid","color":"primary"},"border":null,"elements":[{"type":"decoration","id":"d1","motif":"dots","color":"paper","density":0.35,"scale":0.9,"rotation":0},{"type":"text","id":"t1","content":"hi!","font":"fraunces","weight":800,"italic":false,"size":320,"color":"ink","x":500,"y":510,"anchor":"center","rotation":-3,"tracking":-10,"transform":"lowercase"}],"palette":["primary","ink","paper"],"tags":["kawaii","greeting","cute","bonbon"],"pack_palette":{"primary":"#FFB7CE","secondary":"#B3E5FC","accent_a":"#FFF59D","accent_b":"#CE93D8","ink":"#0E0E10"}}'::jsonb,
    null, true, 100, 'pack-bonbon-drop', null, null
  ),
  (
    'preset-bonbon-002', 'yumi yumi', 'kids',
    '{"version":"1.0","id":"preset-bonbon-002","title":"yumi yumi","shape":"rounded-square","size":{"width":1000,"height":1000},"background":{"type":"gradient","from":"primary","to":"secondary","direction":"diagonal"},"border":null,"elements":[{"type":"text","id":"t1","content":"yumi","font":"fraunces","weight":700,"italic":true,"size":200,"color":"ink","x":500,"y":400,"anchor":"center","rotation":-3,"tracking":-20,"transform":"lowercase"},{"type":"text","id":"t2","content":"yumi","font":"fraunces","weight":800,"italic":false,"size":200,"color":"paper","x":500,"y":610,"anchor":"center","rotation":3,"tracking":-20,"transform":"lowercase"},{"type":"shape","id":"s1","kind":"star","x":810,"y":190,"width":90,"height":90,"color":"accent_a","stroke":null,"strokeWidth":0,"rotation":20,"opacity":1.0}],"palette":["primary","secondary","ink","paper","accent_a"],"tags":["kawaii","food","cute","bonbon"],"pack_palette":{"primary":"#FFB7CE","secondary":"#B3E5FC","accent_a":"#FFF59D","accent_b":"#CE93D8","ink":"#0E0E10"}}'::jsonb,
    null, true, 101, 'pack-bonbon-drop', null, null
  ),
  (
    'preset-bonbon-003', 'bestie', 'kids',
    '{"version":"1.0","id":"preset-bonbon-003","title":"bestie","shape":"badge","size":{"width":1000,"height":1000},"background":{"type":"solid","color":"accent_a"},"border":{"style":"solid","color":"ink","width":12},"elements":[{"type":"text","id":"t1","content":"bestie","font":"fraunces","weight":800,"italic":false,"size":190,"color":"ink","x":500,"y":500,"anchor":"center","rotation":0,"tracking":20,"transform":"uppercase"}],"palette":["accent_a","ink"],"tags":["kawaii","friendship","bold","bonbon"],"pack_palette":{"primary":"#FFB7CE","secondary":"#B3E5FC","accent_a":"#FFF59D","accent_b":"#CE93D8","ink":"#0E0E10"}}'::jsonb,
    null, true, 102, 'pack-bonbon-drop', null, null
  ),
  (
    'preset-bonbon-004', 'kira kira', 'kids',
    '{"version":"1.0","id":"preset-bonbon-004","title":"kira kira","shape":"circle","size":{"width":1000,"height":1000},"background":{"type":"solid","color":"accent_b"},"border":null,"elements":[{"type":"decoration","id":"d1","motif":"sparkles","color":"paper","density":0.6,"scale":0.8,"rotation":0},{"type":"text","id":"t1","content":"kira","font":"fraunces","weight":700,"italic":true,"size":190,"color":"paper","x":500,"y":400,"anchor":"center","rotation":-4,"tracking":-15,"transform":"lowercase"},{"type":"text","id":"t2","content":"kira","font":"fraunces","weight":800,"italic":false,"size":190,"color":"accent_a","x":500,"y":620,"anchor":"center","rotation":4,"tracking":-15,"transform":"lowercase"}],"palette":["accent_b","paper","accent_a"],"tags":["kawaii","sparkle","cute","bonbon"],"pack_palette":{"primary":"#FFB7CE","secondary":"#B3E5FC","accent_a":"#FFF59D","accent_b":"#CE93D8","ink":"#0E0E10"}}'::jsonb,
    null, true, 103, 'pack-bonbon-drop', null, null
  ),
  (
    'preset-bonbon-005', 'happy day', 'kids',
    '{"version":"1.0","id":"preset-bonbon-005","title":"happy day","shape":"rounded-square","size":{"width":1000,"height":1000},"background":{"type":"gradient","from":"secondary","to":"primary","direction":"vertical"},"border":null,"elements":[{"type":"decoration","id":"d1","motif":"confetti","color":"accent_a","density":0.35,"scale":0.7,"rotation":0},{"type":"text","id":"t1","content":"happy","font":"fraunces","weight":700,"italic":false,"size":180,"color":"ink","x":500,"y":390,"anchor":"center","rotation":-2,"tracking":-10,"transform":"lowercase"},{"type":"text","id":"t2","content":"day!","font":"fraunces","weight":800,"italic":true,"size":220,"color":"paper","x":500,"y":625,"anchor":"center","rotation":3,"tracking":-20,"transform":"lowercase"}],"palette":["secondary","primary","accent_a","ink","paper"],"tags":["kawaii","celebration","fun","bonbon"],"pack_palette":{"primary":"#FFB7CE","secondary":"#B3E5FC","accent_a":"#FFF59D","accent_b":"#CE93D8","ink":"#0E0E10"}}'::jsonb,
    null, true, 104, 'pack-bonbon-drop', null, null
  ),
  (
    'preset-bonbon-006', 'so sweet', 'kids',
    '{"version":"1.0","id":"preset-bonbon-006","title":"so sweet","shape":"circle","size":{"width":1000,"height":1000},"background":{"type":"solid","color":"primary"},"border":{"style":"dashed","color":"secondary","width":10},"elements":[{"type":"shape","id":"s1","kind":"heart","x":500,"y":370,"width":240,"height":240,"color":"secondary","stroke":null,"strokeWidth":0,"rotation":0,"opacity":1.0},{"type":"text","id":"t1","content":"so sweet","font":"jetbrains-mono","weight":400,"italic":false,"size":82,"color":"ink","x":500,"y":685,"anchor":"center","rotation":0,"tracking":80,"transform":"uppercase"}],"palette":["primary","secondary","ink"],"tags":["kawaii","sweet","love","bonbon"],"pack_palette":{"primary":"#FFB7CE","secondary":"#B3E5FC","accent_a":"#FFF59D","accent_b":"#CE93D8","ink":"#0E0E10"}}'::jsonb,
    null, true, 105, 'pack-bonbon-drop', null, null
  ),

-- ----------------------------------------------------------------------------
-- Bloom Lines — 6 stickers (seasonal: Mother's Day window)
-- pack_palette: primary=#F4D5C8, secondary=#E8B4D2, accent_a=#A8C8A0,
--               accent_b=#E8DCC4, ink=#8B6F47
-- ----------------------------------------------------------------------------
  (
    'preset-bloom-001', 'love always', 'seasonal',
    '{"version":"1.0","id":"preset-bloom-001","title":"love always","shape":"circle","size":{"width":1000,"height":1000},"background":{"type":"solid","color":"primary"},"border":null,"elements":[{"type":"decoration","id":"d1","motif":"wave","color":"secondary","density":0.25,"scale":1.1,"rotation":0},{"type":"text","id":"t1","content":"love","font":"fraunces","weight":700,"italic":true,"size":240,"color":"ink","x":500,"y":410,"anchor":"center","rotation":-2,"tracking":-25,"transform":"lowercase"},{"type":"text","id":"t2","content":"always","font":"inter-tight","weight":400,"italic":false,"size":80,"color":"ink","x":500,"y":630,"anchor":"center","rotation":0,"tracking":180,"transform":"uppercase"}],"palette":["primary","secondary","ink"],"tags":["mothersday","love","botanical","bloom"],"pack_palette":{"primary":"#F4D5C8","secondary":"#E8B4D2","accent_a":"#A8C8A0","accent_b":"#E8DCC4","ink":"#8B6F47"}}'::jsonb,
    null, true, 200, 'pack-bloom-lines', '2026-04-25', '2026-05-14'
  ),
  (
    'preset-bloom-002', 'mama bloom', 'seasonal',
    '{"version":"1.0","id":"preset-bloom-002","title":"mama bloom","shape":"rounded-square","size":{"width":1000,"height":1000},"background":{"type":"solid","color":"accent_a"},"border":null,"elements":[{"type":"decoration","id":"d1","motif":"dots","color":"secondary","density":0.28,"scale":1.0,"rotation":0},{"type":"text","id":"t1","content":"mama","font":"fraunces","weight":700,"italic":false,"size":210,"color":"ink","x":500,"y":400,"anchor":"center","rotation":0,"tracking":-15,"transform":"lowercase"},{"type":"text","id":"t2","content":"bloom","font":"fraunces","weight":400,"italic":true,"size":160,"color":"secondary","x":500,"y":615,"anchor":"center","rotation":2,"tracking":-10,"transform":"lowercase"}],"palette":["accent_a","secondary","ink"],"tags":["mothersday","botanical","soft","bloom"],"pack_palette":{"primary":"#F4D5C8","secondary":"#E8B4D2","accent_a":"#A8C8A0","accent_b":"#E8DCC4","ink":"#8B6F47"}}'::jsonb,
    null, true, 201, 'pack-bloom-lines', '2026-04-25', '2026-05-14'
  ),
  (
    'preset-bloom-003', 'the first hello', 'seasonal',
    '{"version":"1.0","id":"preset-bloom-003","title":"the first hello","shape":"circle","size":{"width":1000,"height":1000},"background":{"type":"solid","color":"accent_b"},"border":{"style":"solid","color":"secondary","width":8},"elements":[{"type":"text","id":"t1","content":"the first","font":"inter-tight","weight":400,"italic":false,"size":90,"color":"ink","x":500,"y":370,"anchor":"center","rotation":0,"tracking":80,"transform":"uppercase"},{"type":"text","id":"t2","content":"hello","font":"fraunces","weight":800,"italic":false,"size":230,"color":"primary","x":500,"y":575,"anchor":"center","rotation":0,"tracking":-25,"transform":"lowercase"}],"palette":["accent_b","secondary","ink","primary"],"tags":["newborn","milestone","soft","bloom"],"pack_palette":{"primary":"#F4D5C8","secondary":"#E8B4D2","accent_a":"#A8C8A0","accent_b":"#E8DCC4","ink":"#8B6F47"}}'::jsonb,
    null, true, 202, 'pack-bloom-lines', '2026-04-25', '2026-05-14'
  ),
  (
    'preset-bloom-004', 'for you mom', 'seasonal',
    '{"version":"1.0","id":"preset-bloom-004","title":"for you mom","shape":"blob","size":{"width":1000,"height":1000},"background":{"type":"solid","color":"secondary"},"border":null,"elements":[{"type":"text","id":"t1","content":"for you,","font":"fraunces","weight":400,"italic":true,"size":140,"color":"ink","x":500,"y":380,"anchor":"center","rotation":-3,"tracking":-15,"transform":"lowercase"},{"type":"text","id":"t2","content":"mom","font":"fraunces","weight":800,"italic":false,"size":270,"color":"primary","x":500,"y":635,"anchor":"center","rotation":0,"tracking":-20,"transform":"lowercase"}],"palette":["secondary","primary","ink"],"tags":["mothersday","gift","warm","bloom"],"pack_palette":{"primary":"#F4D5C8","secondary":"#E8B4D2","accent_a":"#A8C8A0","accent_b":"#E8DCC4","ink":"#8B6F47"}}'::jsonb,
    null, true, 203, 'pack-bloom-lines', '2026-04-25', '2026-05-14'
  ),
  (
    'preset-bloom-005', 'softest landing', 'seasonal',
    '{"version":"1.0","id":"preset-bloom-005","title":"softest landing","shape":"rounded-square","size":{"width":1000,"height":1000},"background":{"type":"gradient","from":"primary","to":"secondary","direction":"diagonal"},"border":null,"elements":[{"type":"decoration","id":"d1","motif":"dots","color":"accent_a","density":0.2,"scale":1.2,"rotation":0},{"type":"text","id":"t1","content":"softest","font":"fraunces","weight":700,"italic":true,"size":170,"color":"ink","x":500,"y":390,"anchor":"center","rotation":-2,"tracking":-15,"transform":"lowercase"},{"type":"text","id":"t2","content":"landing","font":"fraunces","weight":800,"italic":false,"size":170,"color":"accent_b","x":500,"y":590,"anchor":"center","rotation":2,"tracking":-15,"transform":"lowercase"}],"palette":["primary","secondary","accent_a","accent_b","ink"],"tags":["newborn","gentle","soft","bloom"],"pack_palette":{"primary":"#F4D5C8","secondary":"#E8B4D2","accent_a":"#A8C8A0","accent_b":"#E8DCC4","ink":"#8B6F47"}}'::jsonb,
    null, true, 204, 'pack-bloom-lines', '2026-04-25', '2026-05-14'
  ),
  (
    'preset-bloom-006', 'thank you mama', 'seasonal',
    '{"version":"1.0","id":"preset-bloom-006","title":"thank you mama","shape":"circle","size":{"width":1000,"height":1000},"background":{"type":"solid","color":"accent_a"},"border":null,"elements":[{"type":"decoration","id":"d1","motif":"wave","color":"secondary","density":0.25,"scale":0.9,"rotation":0},{"type":"text","id":"t1","content":"thank you","font":"fraunces","weight":400,"italic":true,"size":120,"color":"ink","x":500,"y":370,"anchor":"center","rotation":0,"tracking":-10,"transform":"lowercase"},{"type":"text","id":"t2","content":"mama","font":"fraunces","weight":800,"italic":false,"size":230,"color":"secondary","x":500,"y":590,"anchor":"center","rotation":0,"tracking":-20,"transform":"lowercase"}],"palette":["accent_a","secondary","ink"],"tags":["mothersday","gratitude","floral","bloom"],"pack_palette":{"primary":"#F4D5C8","secondary":"#E8B4D2","accent_a":"#A8C8A0","accent_b":"#E8DCC4","ink":"#8B6F47"}}'::jsonb,
    null, true, 205, 'pack-bloom-lines', '2026-04-25', '2026-05-14'
  )
ON CONFLICT (id) DO UPDATE SET
  title        = EXCLUDED.title,
  category     = EXCLUDED.category,
  design_json  = EXCLUDED.design_json,
  is_active    = EXCLUDED.is_active,
  sort_order   = EXCLUDED.sort_order,
  pack_id      = EXCLUDED.pack_id,
  season_start = EXCLUDED.season_start,
  season_end   = EXCLUDED.season_end;
