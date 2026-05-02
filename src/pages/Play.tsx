import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Play as PlayIcon, Pause, Volume2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import StickerRenderer from '../components/StickerRenderer'
import { DesignJson } from '../types/sticker'

interface PlaybackData {
  id: string
  title: string
  design_json: DesignJson
  preview_png_url: string | null
  audio_url: string | null
  duration_seconds: number | null
  created_at: string
}

export default function Play() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<PlaybackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!id) return
    supabase
      .rpc('get_playback', { sticker_id: id })
      .then(({ data: rows, error }) => {
        if (!error && rows?.[0]) setData(rows[0] as PlaybackData)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!data?.audio_url) return
    const audio = new Audio(data.audio_url)
    audioRef.current = audio
    audio.ontimeupdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration)
    }
    audio.onended = () => { setPlaying(false); setProgress(0) }
    // Attempt autoplay
    audio.play().then(() => setPlaying(true)).catch(() => {})
    return () => { audio.pause() }
  }, [data?.audio_url])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-plum flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-paper/30 border-t-paper animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-plum flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-mono text-sm text-paper/40">This sticker isn't available.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-plum flex flex-col items-center px-6 pt-16 pb-12">
      {/* Sticker */}
      <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-paper/10">
        <StickerRenderer design={data.design_json} size={280} />
      </div>

      {/* Title */}
      <h1 className="mt-8 font-display text-2xl font-bold text-paper text-center leading-tight">
        {data.title}
      </h1>

      {/* Audio player */}
      {data.audio_url ? (
        <div className="mt-8 w-full max-w-xs">
          <button
            onClick={togglePlay}
            className="w-full flex items-center gap-4 bg-paper/8 hover:bg-paper/14 border border-paper/10 rounded-2xl px-5 py-4 transition active:scale-95"
          >
            <div className="w-10 h-10 rounded-full bg-coral flex items-center justify-center flex-shrink-0 shadow">
              {playing
                ? <Pause size={18} className="text-paper" fill="currentColor" />
                : <PlayIcon size={18} className="text-paper ml-0.5" fill="currentColor" />
              }
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 size={12} className="text-paper/40" />
                <span className="font-mono text-[11px] text-paper/40 tracking-widest uppercase">
                  Voice note
                  {data.duration_seconds ? ` · ${data.duration_seconds}s` : ''}
                </span>
              </div>
              <div className="h-1 bg-paper/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-paper/60 rounded-full transition-all duration-100"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </button>
        </div>
      ) : (
        <p className="mt-8 font-mono text-[11px] text-paper/20 tracking-widest uppercase">
          No voice note attached
        </p>
      )}

      <p className="mt-auto pt-16 font-mono text-[11px] text-paper/15 tracking-widest uppercase">
        Made with Sonic Sticker
      </p>
    </div>
  )
}
