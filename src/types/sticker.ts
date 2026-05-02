// Palette tokens — the only color values the renderer and agent use
export type PaletteToken = 'ink' | 'paper' | 'paper-2' | 'coral' | 'acid' | 'plum' | 'sky'

export const PALETTE: Record<PaletteToken, string> = {
  'ink':     '#0E0E10',
  'paper':   '#F4F1EA',
  'paper-2': '#EAE5D9',
  'coral':   '#FF5A3D',
  'acid':    '#D4FF3D',
  'plum':    '#2B1B4A',
  'sky':     '#6FA8FF',
}

export type StickerShape =
  | 'circle' | 'rounded-square' | 'square'
  | 'hexagon' | 'diamond' | 'blob' | 'badge'

export interface Background {
  type: 'solid' | 'gradient' | 'noise'
  color?: PaletteToken
  from?: PaletteToken
  to?: PaletteToken
  direction?: 'diagonal' | 'vertical' | 'horizontal' | 'radial'
  intensity?: number
}

export interface Border {
  style: 'solid' | 'dashed' | 'double' | 'none'
  color: PaletteToken
  width: number
}

export interface TextElement {
  type: 'text'
  id: string
  content: string
  font: 'fraunces' | 'inter-tight' | 'jetbrains-mono'
  weight: 400 | 600 | 700 | 800
  italic: boolean
  size: number
  color: PaletteToken
  x: number
  y: number
  anchor: 'center' | 'left' | 'right'
  rotation: number
  tracking: number
  transform: 'none' | 'uppercase' | 'lowercase'
}

export interface ShapeElement {
  type: 'shape'
  id: string
  kind: 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'burst' | 'arrow' | 'line'
  x: number
  y: number
  width: number
  height: number
  color: PaletteToken
  stroke: PaletteToken | null
  strokeWidth: number
  rotation: number
  opacity: number
}

export interface DecorationElement {
  type: 'decoration'
  id: string
  motif: 'confetti' | 'sparkles' | 'stars' | 'dots' | 'stripes' | 'grain' | 'wave'
  color: PaletteToken
  density: number
  scale: number
  rotation: number
}

export type StickerElement = TextElement | ShapeElement | DecorationElement

export interface DesignJson {
  version: string
  id: string | null
  title: string
  shape: StickerShape
  size: { width: number; height: number }
  background: Background
  border: Border | null
  elements: StickerElement[]
  palette: PaletteToken[]
  tags: string[]
}

// DB row types
export interface Preset {
  id: string
  title: string
  category: 'greeting' | 'event' | 'memory' | 'gift' | 'encouragement'
  design_json: DesignJson
  preview_png_url: string | null
  is_active: boolean
  sort_order: number
}

export interface Sticker {
  id: string
  user_id: string
  title: string
  design_json: DesignJson
  preview_png_url: string | null
  print_pdf_url: string | null
  source_preset_id: string | null
  created_at: string
  updated_at: string
}
