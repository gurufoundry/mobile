import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mic, ShoppingBag, Share2, Trash2, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import StickerRenderer from '../components/StickerRenderer'
import { Sticker } from '../types/sticker'

export default function StickerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sticker, setSticker] = useState<Sticker | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAudio, setHasAudio] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('stickers').select('*').eq('id', id).single(),
      supabase.from('audio_notes').select('id').eq('sticker_id', id).maybeSingle(),
    ]).then(([stickerRes, audioRes]) => {
      if (!stickerRes.error && stickerRes.data) setSticker(stickerRes.data as Sticker)
      setHasAudio(!!audioRes.data)
      setLoading(false)
    })
  }, [id])

  const copyPlayLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/play/${id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const deleteSticker = async () => {
    if (!id) return
    if (!window.confirm('Delete this sticker? This cannot be undone.')) return
    await supabase.from('stickers').delete().eq('id', id)
    navigate('/library')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-coral border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!sticker) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4 px-6">
        <p className="font-mono text-sm text-ink/40">Sticker not found.</p>
        <button onClick={() => navigate('/library')} className="text-coral text-sm font-semibold">
          Back to library
        </button>
      </div>
    )
  }

  const checkoutId = sticker.source_preset_id ?? sticker.id

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Nav */}
      <div className="flex items-center justify-between px-4 pt-10 pb-2">
        <button
          onClick={() => navigate('/library')}
          className="p-2 -ml-2 text-ink/50 hover:text-ink transition"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={deleteSticker}
          className="p-2 -mr-2 text-ink/30 hover:text-red-500 transition"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Preview */}
      <div className="flex justify-center px-6 pt-4 pb-6">
        <div className="rounded-3xl overflow-hidden shadow-lg">
          <StickerRenderer design={sticker.design_json} size={260} />
        </div>
      </div>

      {/* Meta */}
      <div className="px-6">
        <h1 className="font-display text-3xl font-bold text-ink">{sticker.title}</h1>
        <p className="font-mono text-[11px] text-ink/30 mt-1">
          {new Date(sticker.created_at).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric',
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-6 px-6 flex flex-col gap-3 pb-10">
        <button
          onClick={() => navigate(`/sticker/${id}/audio`)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-ink/15 font-semibold text-sm text-ink hover:bg-paper-2 transition active:scale-95"
        >
          <Mic size={16} />
          {hasAudio ? 'Re-record voice note' : 'Add voice note'}
        </button>

        <button
          onClick={() => navigate(`/checkout/${checkoutId}`)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-coral text-paper font-semibold text-sm hover:opacity-90 transition active:scale-95"
        >
          <ShoppingBag size={16} />
          Order this sticker
        </button>

        <button
          onClick={copyPlayLink}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-ink/15 font-semibold text-sm text-ink hover:bg-paper-2 transition active:scale-95"
        >
          {copied ? <CheckCircle size={16} className="text-green-600" /> : <Share2 size={16} />}
          {copied ? 'Link copied!' : 'Copy NFC link'}
        </button>
      </div>
    </div>
  )
}
