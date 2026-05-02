import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import StickerRenderer from '../components/StickerRenderer'
import { Preset, Pack } from '../types/sticker'

const CATEGORIES = ['all', 'greeting', 'event', 'memory', 'gift', 'encouragement'] as const
type Category = typeof CATEGORIES[number]

// Marketing view for signed-out visitors
function MarketingLanding() {
  return (
    <div className="p-6 pt-12 flex flex-col items-start min-h-screen">
      <h1 className="font-display text-4xl font-bold text-ink leading-tight">
        Design stickers.<br />Record your voice.<br />Share with NFC.
      </h1>
      <p className="mt-4 text-ink/60 text-sm leading-relaxed max-w-xs">
        A 2-minute chat with an AI creates a custom sticker with an attached voice note — paired with an NFC tag.
      </p>
      <Link
        to="/auth"
        className="mt-8 bg-coral text-paper font-semibold px-6 py-3.5 rounded-xl text-sm hover:opacity-90 transition active:scale-95"
      >
        Get started
      </Link>

      {/* Sample stickers teaser */}
      <p className="mt-16 font-mono text-[11px] text-ink/30 tracking-widest uppercase">Sample designs</p>
    </div>
  )
}

function isPackInSeason(pack: Pack): boolean {
  if (!pack.is_seasonal || !pack.season_start || !pack.season_end) return false
  const today = new Date()
  return today >= new Date(pack.season_start) && today <= new Date(pack.season_end)
}

function SeasonalBanner({ pack, presets, onPresetClick }: {
  pack: Pack
  presets: Preset[]
  onPresetClick: (id: string) => void
}) {
  return (
    <div className="mx-5 mt-2 mb-4 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #F4D5C8 0%, #E8B4D2 100%)' }}>
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono tracking-widest uppercase" style={{ background: '#E8B4D2', color: '#8B6F47' }}>
            In Season
          </span>
          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#8B6F47', opacity: 0.6 }}>
            thru May 14
          </span>
        </div>
        <h2 className="font-display text-xl font-bold mt-1.5" style={{ color: '#8B6F47' }}>{pack.title}</h2>
        {pack.tagline && (
          <p className="font-mono text-[11px] mt-0.5" style={{ color: '#8B6F47', opacity: 0.65 }}>{pack.tagline}</p>
        )}
      </div>
      <div className="flex gap-3 px-4 pb-4 pt-1 overflow-x-auto scrollbar-none">
        {presets.map(preset => (
          <button
            key={preset.id}
            onClick={() => onPresetClick(preset.id)}
            className="flex-shrink-0 flex flex-col items-center group"
          >
            <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm group-active:scale-95 transition">
              <StickerRenderer design={preset.design_json} size={96} />
            </div>
            <p className="mt-1.5 text-[10px] font-medium text-center leading-tight px-1 max-w-[88px]" style={{ color: '#8B6F47' }}>
              {preset.title}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

function PackSection({ pack, presets, onPresetClick }: {
  pack: Pack
  presets: Preset[]
  onPresetClick: (id: string) => void
}) {
  return (
    <div className="mt-4">
      <div className="flex items-baseline gap-2 px-5 mb-3">
        <h2 className="font-display text-lg font-semibold text-ink">{pack.title}</h2>
        {pack.tagline && (
          <span className="font-mono text-[11px] text-ink/40">{pack.tagline}</span>
        )}
      </div>
      <div className="flex gap-3 px-5 overflow-x-auto scrollbar-none pb-1">
        {presets.map(preset => (
          <button
            key={preset.id}
            onClick={() => onPresetClick(preset.id)}
            className="flex-shrink-0 flex flex-col items-center group"
          >
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-paper-2 shadow-sm group-active:scale-95 transition">
              <StickerRenderer design={preset.design_json} size={112} />
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-ink/70 text-center leading-tight px-1 max-w-[104px]">
              {preset.title}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

// Authenticated gallery view
function Gallery() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [presets, setPresets] = useState<Preset[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<Category>('all')

  useEffect(() => {
    Promise.all([
      supabase.from('presets').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('packs').select('*').eq('is_active', true).order('sort_order'),
    ]).then(([presetsRes, packsRes]) => {
      if (!presetsRes.error && presetsRes.data) setPresets(presetsRes.data as Preset[])
      if (!packsRes.error && packsRes.data) setPacks(packsRes.data as Pack[])
      setLoading(false)
    })
  }, [])

  const packPresets = (packId: string) => presets.filter(p => p.pack_id === packId)
  const genericPresets = presets.filter(p => p.pack_id === null)
  const seasonalPacks = packs.filter(isPackInSeason)
  const nonSeasonalPacks = packs.filter(p => !isPackInSeason(p))

  const filtered = activeCategory === 'all'
    ? genericPresets
    : genericPresets.filter(p => p.category === activeCategory)

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <h1 className="font-display text-2xl font-semibold text-ink">Gallery</h1>
        <button
          onClick={signOut}
          className="font-mono text-[11px] text-ink/40 hover:text-ink/70 tracking-widest uppercase transition"
        >
          Sign out
        </button>
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          <div className="h-44 rounded-2xl bg-paper-2 animate-pulse" />
          <div className="grid grid-cols-2 gap-3 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-paper-2 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Seasonal packs — prominent banner */}
          {seasonalPacks.map(pack => (
            <SeasonalBanner
              key={pack.id}
              pack={pack}
              presets={packPresets(pack.id)}
              onPresetClick={id => navigate(`/preset/${id}`)}
            />
          ))}

          {/* Non-seasonal packs — horizontal scroll rows */}
          {nonSeasonalPacks.map(pack => packPresets(pack.id).length > 0 && (
            <PackSection
              key={pack.id}
              pack={pack}
              presets={packPresets(pack.id)}
              onPresetClick={id => navigate(`/preset/${id}`)}
            />
          ))}

          {/* Divider before generic gallery */}
          {packs.length > 0 && genericPresets.length > 0 && (
            <div className="mx-5 mt-6 mb-2 border-t border-ink/8" />
          )}

          {/* Category chips — generic presets only */}
          {genericPresets.length > 0 && (
            <>
              <div className="flex gap-2 px-5 overflow-x-auto pb-3 scrollbar-none mt-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition capitalize ${
                      activeCategory === cat
                        ? 'bg-ink text-paper'
                        : 'bg-paper-2 text-ink/60 hover:text-ink'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="px-5 mt-12 text-center">
                  <p className="font-mono text-xs text-ink/30">No presets in this category yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 px-5 mt-2">
                  {filtered.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => navigate(`/preset/${preset.id}`)}
                      className="flex flex-col items-center group"
                    >
                      <div className="w-full aspect-square rounded-2xl overflow-hidden bg-paper-2 flex items-center justify-center shadow-sm group-active:scale-95 transition">
                        <StickerRenderer
                          design={preset.design_json}
                          size={160}
                        />
                      </div>
                      <p className="mt-2 text-xs font-medium text-ink/70 text-center leading-tight px-1">
                        {preset.title}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function Landing() {
  const { user } = useAuth()
  return user ? <Gallery /> : <MarketingLanding />
}
