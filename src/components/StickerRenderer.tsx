import {
  DesignJson, PALETTE, PaletteToken,
  TextElement, ShapeElement, DecorationElement,
} from '../types/sticker'

const CANVAS = 1000

type HexFn = (token: string) => string

function makeHex(packPalette?: Record<string, string>): HexFn {
  return (token: string): string => {
    if (packPalette && token in packPalette) return packPalette[token]
    if (token in PALETTE) return PALETTE[token as PaletteToken]
    return PALETTE['ink']
  }
}

function fontFamily(font: TextElement['font']): string {
  if (font === 'fraunces') return 'Fraunces, Georgia, serif'
  if (font === 'jetbrains-mono') return '"JetBrains Mono", monospace'
  return '"Inter Tight", ui-sans-serif, sans-serif'
}

// Returns the SVG path / element for the sticker outline shape
function ShapeClip({ shape, id }: { shape: DesignJson['shape']; id: string }) {
  const C = CANVAS
  const R = 80 // corner radius for rounded-square

  switch (shape) {
    case 'circle':
      return <clipPath id={id}><circle cx={C / 2} cy={C / 2} r={C / 2} /></clipPath>
    case 'square':
      return <clipPath id={id}><rect x={0} y={0} width={C} height={C} /></clipPath>
    case 'rounded-square':
      return <clipPath id={id}><rect x={0} y={0} width={C} height={C} rx={R} ry={R} /></clipPath>
    case 'hexagon': {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6
        return `${C / 2 + (C / 2) * Math.cos(a)},${C / 2 + (C / 2) * Math.sin(a)}`
      }).join(' ')
      return <clipPath id={id}><polygon points={pts} /></clipPath>
    }
    case 'diamond':
      return (
        <clipPath id={id}>
          <polygon points={`${C / 2},0 ${C},${C / 2} ${C / 2},${C} 0,${C / 2}`} />
        </clipPath>
      )
    case 'blob':
      return (
        <clipPath id={id}>
          <path d="M500,30 C720,10 970,200 960,460 C950,720 780,990 540,970 C300,950 30,760 40,500 C50,240 280,50 500,30 Z" />
        </clipPath>
      )
    case 'badge': {
      // Wavy badge edge — 12-point starburst
      const pts = Array.from({ length: 24 }, (_, i) => {
        const a = (Math.PI / 12) * i
        const r = i % 2 === 0 ? C / 2 : C / 2 - 40
        return `${C / 2 + r * Math.cos(a - Math.PI / 2)},${C / 2 + r * Math.sin(a - Math.PI / 2)}`
      }).join(' ')
      return <clipPath id={id}><polygon points={pts} /></clipPath>
    }
    default:
      return <clipPath id={id}><rect x={0} y={0} width={C} height={C} rx={R} ry={R} /></clipPath>
  }
}

// The same outline as a visible stroke element
function ShapeOutline({ shape, border, hex }: { shape: DesignJson['shape']; border: DesignJson['border']; hex: HexFn }) {
  if (!border || border.style === 'none') return null
  const C = CANVAS
  const R = 80
  const stroke = hex(border.color)
  const sw = border.width
  const strokeDasharray = border.style === 'dashed' ? `${sw * 3} ${sw * 2}` : undefined
  const common = { fill: 'none', stroke, strokeWidth: sw, strokeDasharray }

  switch (shape) {
    case 'circle':
      return <circle cx={C / 2} cy={C / 2} r={C / 2 - sw / 2} {...common} />
    case 'square':
      return <rect x={sw / 2} y={sw / 2} width={C - sw} height={C - sw} {...common} />
    case 'rounded-square':
      return <rect x={sw / 2} y={sw / 2} width={C - sw} height={C - sw} rx={R} ry={R} {...common} />
    case 'hexagon': {
      const r = C / 2 - sw / 2
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6
        return `${C / 2 + r * Math.cos(a)},${C / 2 + r * Math.sin(a)}`
      }).join(' ')
      return <polygon points={pts} {...common} />
    }
    case 'diamond':
      return <polygon points={`${C / 2},${sw} ${C - sw},${C / 2} ${C / 2},${C - sw} ${sw},${C / 2}`} {...common} />
    default:
      return null
  }
}

function Background({ bg, clipId, hex }: { bg: DesignJson['background']; clipId: string; hex: HexFn }) {
  const C = CANVAS
  if (bg.type === 'gradient' && bg.from && bg.to) {
    const gradId = `${clipId}-grad`
    const isRadial = bg.direction === 'radial'
    const isVertical = bg.direction === 'vertical'
    return (
      <>
        <defs>
          {isRadial ? (
            <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={hex(bg.from)} />
              {bg.mid && <stop offset="50%" stopColor={hex(bg.mid)} />}
              <stop offset="100%" stopColor={hex(bg.to)} />
            </radialGradient>
          ) : (
            <linearGradient
              id={gradId}
              x1="0" y1="0"
              x2={isVertical ? '0' : '1'}
              y2={isVertical ? '1' : bg.direction === 'diagonal' ? '1' : '0'}
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0%" stopColor={hex(bg.from)} />
              {bg.mid && <stop offset="50%" stopColor={hex(bg.mid)} />}
              <stop offset="100%" stopColor={hex(bg.to)} />
            </linearGradient>
          )}
        </defs>
        <rect x={0} y={0} width={C} height={C} fill={`url(#${gradId})`} />
      </>
    )
  }
  return <rect x={0} y={0} width={C} height={C} fill={hex(bg.color ?? 'paper')} />
}

// Star polygon helper
function starPoints(cx: number, cy: number, r: number, ir: number, points = 5): string {
  return Array.from({ length: points * 2 }, (_, i) => {
    const a = (Math.PI / points) * i - Math.PI / 2
    const rad = i % 2 === 0 ? r : ir
    return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`
  }).join(' ')
}

function RenderShape({ el, hex }: { el: ShapeElement; hex: HexFn }) {
  const { x, y, width: w, height: h, color, stroke, strokeWidth: sw, rotation, opacity } = el
  const fill = hex(color)
  const strokeColor = stroke ? hex(stroke) : 'none'
  const transform = rotation ? `rotate(${rotation} ${x} ${y})` : undefined
  const common = { fill, stroke: strokeColor, strokeWidth: sw, opacity, transform }

  switch (el.kind) {
    case 'circle':
      return <ellipse cx={x} cy={y} rx={w / 2} ry={h / 2} {...common} />
    case 'square':
      return <rect x={x - w / 2} y={y - h / 2} width={w} height={h} {...common} />
    case 'triangle': {
      const pts = `${x},${y - h / 2} ${x + w / 2},${y + h / 2} ${x - w / 2},${y + h / 2}`
      return <polygon points={pts} {...common} />
    }
    case 'star':
      return <polygon points={starPoints(x, y, w / 2, w / 4)} {...common} />
    case 'burst':
      return <polygon points={starPoints(x, y, w / 2, w / 3.5, 8)} {...common} />
    case 'heart': {
      const r = Math.min(w, h) / 2
      return (
        <path
          d={`M${x},${y + r * 0.9} C${x - r * 0.5},${y + r * 0.3} ${x - r},${y + r * 0.5} ${x - r},${y - r * 0.25} C${x - r},${y - r * 0.9} ${x},${y - r * 0.9} ${x},${y - r * 0.1} C${x},${y - r * 0.9} ${x + r},${y - r * 0.9} ${x + r},${y - r * 0.25} C${x + r},${y + r * 0.5} ${x + r * 0.5},${y + r * 0.3} ${x},${y + r * 0.9} Z`}
          {...common}
          transform={transform}
        />
      )
    }
    case 'arrow': {
      const pts = `${x - w / 2},${y - h / 6} ${x},${y - h / 6} ${x},${y - h / 2} ${x + w / 2},${y} ${x},${y + h / 2} ${x},${y + h / 6} ${x - w / 2},${y + h / 6}`
      return <polygon points={pts} {...common} />
    }
    case 'line':
      return <line x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} stroke={fill} strokeWidth={sw || 8} opacity={opacity} transform={transform} />
    default:
      return null
  }
}

// Simple decorations implemented as SVG patterns
function RenderDecoration({ el, clipId, hex }: { el: DecorationElement; clipId: string; hex: HexFn }) {
  const C = CANVAS
  const fill = hex(el.color)
  const patId = `pat-${el.id}-${clipId}`
  const baseSize = 80 * el.scale
  const opacity = 0.15 + el.density * 0.5

  switch (el.motif) {
    case 'dots':
      return (
        <>
          <defs>
            <pattern id={patId} x="0" y="0" width={baseSize} height={baseSize} patternUnits="userSpaceOnUse">
              <circle cx={baseSize / 2} cy={baseSize / 2} r={baseSize * 0.15} fill={fill} />
            </pattern>
          </defs>
          <rect x={0} y={0} width={C} height={C} fill={`url(#${patId})`} opacity={opacity} />
        </>
      )
    case 'stripes':
      return (
        <>
          <defs>
            <pattern id={patId} x="0" y="0" width={baseSize} height={baseSize} patternUnits="userSpaceOnUse" patternTransform={`rotate(${el.rotation})`}>
              <rect x={0} y={0} width={baseSize * 0.4} height={baseSize} fill={fill} />
            </pattern>
          </defs>
          <rect x={0} y={0} width={C} height={C} fill={`url(#${patId})`} opacity={opacity} />
        </>
      )
    case 'stars':
    case 'sparkles': {
      const pts = starPoints(baseSize / 2, baseSize / 2, baseSize * 0.3, baseSize * 0.12)
      return (
        <>
          <defs>
            <pattern id={patId} x="0" y="0" width={baseSize} height={baseSize} patternUnits="userSpaceOnUse">
              <polygon points={pts} fill={fill} />
            </pattern>
          </defs>
          <rect x={0} y={0} width={C} height={C} fill={`url(#${patId})`} opacity={opacity} />
        </>
      )
    }
    case 'confetti': {
      const sz = baseSize * 0.25
      return (
        <>
          <defs>
            <pattern id={patId} x="0" y="0" width={baseSize} height={baseSize} patternUnits="userSpaceOnUse">
              <rect x={sz} y={sz} width={sz} height={sz * 0.5} fill={fill} transform={`rotate(20 ${baseSize * 0.2} ${baseSize * 0.2})`} />
              <rect x={baseSize * 0.6} y={baseSize * 0.55} width={sz * 0.8} height={sz * 0.4} fill={fill} transform={`rotate(-15 ${baseSize * 0.7} ${baseSize * 0.6})`} />
              <circle cx={baseSize * 0.8} cy={baseSize * 0.2} r={sz * 0.3} fill={fill} />
            </pattern>
          </defs>
          <rect x={0} y={0} width={C} height={C} fill={`url(#${patId})`} opacity={opacity} />
        </>
      )
    }
    case 'wave': {
      const amp = baseSize * 0.3
      return (
        <>
          <defs>
            <pattern id={patId} x="0" y="0" width={baseSize * 2} height={baseSize} patternUnits="userSpaceOnUse">
              <path
                d={`M0,${baseSize / 2} Q${baseSize / 2},${baseSize / 2 - amp} ${baseSize},${baseSize / 2} Q${baseSize * 1.5},${baseSize / 2 + amp} ${baseSize * 2},${baseSize / 2}`}
                fill="none" stroke={fill} strokeWidth={baseSize * 0.1}
              />
            </pattern>
          </defs>
          <rect x={0} y={0} width={C} height={C} fill={`url(#${patId})`} opacity={opacity} />
        </>
      )
    }
    case 'botanical': {
      // Single-line botanical sprig: wavy stem + 3 alternate leaves + small round bud
      const tw = 100 * el.scale
      const th = 160 * el.scale
      const cx = tw * 0.5
      const sw = Math.max(1.5, tw * 0.028)
      const op = 0.12 + el.density * 0.42
      return (
        <>
          <defs>
            <pattern id={patId} x="0" y="0" width={tw} height={th} patternUnits="userSpaceOnUse" patternTransform={el.rotation ? `rotate(${el.rotation})` : undefined}>
              <g stroke={fill} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round">
                {/* wavy stem bottom → top */}
                <path d={`M${cx},${th} C${cx - tw * 0.04},${th * 0.72} ${cx + tw * 0.04},${th * 0.48} ${cx},${th * 0.22} C${cx - tw * 0.03},${th * 0.1} ${cx},${th * 0.02} ${cx},0`} />
                {/* left leaf at ~72% */}
                <path d={`M${cx},${th * 0.72} C${cx - tw * 0.28},${th * 0.63} ${cx - tw * 0.44},${th * 0.52} ${cx - tw * 0.4},${th * 0.43} C${cx - tw * 0.24},${th * 0.5} ${cx - tw * 0.08},${th * 0.66} ${cx},${th * 0.7}`} />
                {/* right leaf at ~52% */}
                <path d={`M${cx},${th * 0.52} C${cx + tw * 0.28},${th * 0.43} ${cx + tw * 0.44},${th * 0.32} ${cx + tw * 0.4},${th * 0.23} C${cx + tw * 0.24},${th * 0.3} ${cx + tw * 0.08},${th * 0.46} ${cx},${th * 0.5}`} />
                {/* left leaf at ~30% */}
                <path d={`M${cx},${th * 0.3} C${cx - tw * 0.22},${th * 0.22} ${cx - tw * 0.35},${th * 0.14} ${cx - tw * 0.32},${th * 0.07} C${cx - tw * 0.18},${th * 0.11} ${cx - tw * 0.06},${th * 0.24} ${cx},${th * 0.28}`} />
                {/* small bud */}
                <circle cx={cx} cy={th * 0.04} r={tw * 0.07} />
              </g>
            </pattern>
          </defs>
          <rect x={0} y={0} width={C} height={C} fill={`url(#${patId})`} opacity={op} />
        </>
      )
    }
    default:
      return null
  }
}

function RenderText({ el, hex }: { el: TextElement; hex: HexFn }) {
  const content = el.transform === 'uppercase'
    ? el.content.toUpperCase()
    : el.transform === 'lowercase'
    ? el.content.toLowerCase()
    : el.content

  const anchor = el.anchor === 'center' ? 'middle' : el.anchor === 'right' ? 'end' : 'start'
  const letterSpacing = (el.tracking / 1000) * el.size

  return (
    <text
      x={el.x}
      y={el.y}
      textAnchor={anchor}
      dominantBaseline="central"
      fontFamily={fontFamily(el.font)}
      fontSize={el.size}
      fontWeight={el.weight}
      fontStyle={el.italic ? 'italic' : 'normal'}
      fill={hex(el.color)}
      letterSpacing={letterSpacing}
      transform={el.rotation ? `rotate(${el.rotation} ${el.x} ${el.y})` : undefined}
    >
      {content}
    </text>
  )
}

interface Props {
  design: DesignJson
  size?: number
  className?: string
}

export default function StickerRenderer({ design, size = 300, className }: Props) {
  const C = CANVAS
  const clipId = `clip-${design.id ?? design.title.replace(/\s+/g, '-')}`
  const hex = makeHex(design.pack_palette)

  return (
    <svg
      viewBox={`0 0 ${C} ${C}`}
      width={size}
      height={size}
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <ShapeClip shape={design.shape} id={clipId} />
      </defs>

      {/* All content clipped to sticker shape */}
      <g clipPath={`url(#${clipId})`}>
        <Background bg={design.background} clipId={clipId} hex={hex} />
        {design.elements.map(el => {
          if (el.type === 'decoration') return <RenderDecoration key={el.id} el={el} clipId={clipId} hex={hex} />
          if (el.type === 'shape') return <RenderShape key={el.id} el={el} hex={hex} />
          if (el.type === 'text') return <RenderText key={el.id} el={el} hex={hex} />
          return null
        })}
      </g>

      {/* Border drawn on top, outside clip */}
      <ShapeOutline shape={design.shape} border={design.border} hex={hex} />
    </svg>
  )
}
