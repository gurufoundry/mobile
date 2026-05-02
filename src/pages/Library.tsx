import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import StickerRenderer from '../components/StickerRenderer'
import { Sticker } from '../types/sticker'

export default function Library() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('stickers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setStickers(data as Sticker[])
        setLoading(false)
      })
  }, [user])

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <h1 className="font-display text-2xl font-semibold text-ink">Library</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 px-5 mt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-paper-2 animate-pulse" />
          ))}
        </div>
      ) : stickers.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 mt-24 text-center">
          <p className="font-mono text-xs text-ink/30 leading-relaxed">
            Nothing here yet.<br />Save a preset from the gallery to get started.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 flex items-center gap-2 text-coral text-sm font-semibold"
          >
            <Plus size={16} />
            Browse gallery
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5 mt-2">
          {stickers.map(sticker => (
            <button
              key={sticker.id}
              onClick={() => navigate(`/sticker/${sticker.id}`)}
              className="flex flex-col items-center group"
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-paper-2 flex items-center justify-center shadow-sm group-active:scale-95 transition">
                <StickerRenderer design={sticker.design_json} size={160} />
              </div>
              <p className="mt-2 text-xs font-medium text-ink/70 text-center leading-tight px-1">
                {sticker.title}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
