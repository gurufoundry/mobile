import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import StickerRenderer from '../components/StickerRenderer'
import { Preset } from '../types/sticker'
import { resolveColor } from '../types/sticker'

export default function PresetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [preset, setPreset] = useState<Preset | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('presets')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setPreset(data as Preset)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-coral border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!preset) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4 px-6">
        <p className="font-mono text-sm text-ink/40">Preset not found.</p>
        <button onClick={() => navigate('/')} className="text-coral text-sm font-semibold">
          Back to gallery
        </button>
      </div>
    )
  }

  const palette = preset.design_json.palette
  const packPalette = preset.design_json.pack_palette

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Nav */}
      <div className="flex items-center px-4 pt-10 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-ink/50 hover:text-ink transition"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="ml-2 font-mono text-[11px] text-ink/40 tracking-widest uppercase capitalize">
          {preset.category}
        </span>
      </div>

      {/* Sticker preview */}
      <div className="flex justify-center px-6 pt-4 pb-8">
        <div className="rounded-3xl overflow-hidden shadow-lg">
          <StickerRenderer design={preset.design_json} size={280} />
        </div>
      </div>

      {/* Meta */}
      <div className="px-6">
        <h1 className="font-display text-3xl font-bold text-ink">{preset.title}</h1>

        {/* Palette swatches */}
        <div className="flex gap-2 mt-4">
          {palette.map(token => (
            <div
              key={token}
              className="w-6 h-6 rounded-full border border-ink/10"
              style={{ backgroundColor: resolveColor(token, packPalette) }}
              title={token}
            />
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {preset.design_json.tags.map(tag => (
            <span
              key={tag}
              className="px-2.5 py-1 bg-paper-2 rounded-full font-mono text-[11px] text-ink/50"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto px-6 pb-8 pt-8">
        <button
          onClick={() => navigate('/create')}
          className="w-full bg-coral text-paper font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm hover:opacity-90 transition active:scale-95"
        >
          <Sparkles size={16} />
          Create yours with AI
        </button>
        <p className="text-center font-mono text-[11px] text-ink/30 mt-3 tracking-wide">
          Answer 3–5 questions · Takes 2 minutes
        </p>
      </div>
    </div>
  )
}
