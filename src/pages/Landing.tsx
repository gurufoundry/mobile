import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import StickerRenderer from '../components/StickerRenderer'
import { Preset } from '../types/sticker'

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

// Authenticated gallery view
function Gallery() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<Category>('all')

  useEffect(() => {
    supabase
      .from('presets')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error && data) setPresets(data as Preset[])
        setLoading(false)
      })
  }, [])

  const filtered = activeCategory === 'all'
    ? presets
    : presets.filter(p => p.category === activeCategory)

  return (
    <div className="pb-4">
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

      {/* Category chips */}
      <div className="flex gap-2 px-5 overflow-x-auto pb-3 scrollbar-none">
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

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 px-5 mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-paper-2 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
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
    </div>
  )
}

export default function Landing() {
  const { user } = useAuth()
  return user ? <Gallery /> : <MarketingLanding />
}
