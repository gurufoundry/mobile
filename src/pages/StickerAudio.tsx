import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mic, Square, Play, Pause, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type Stage = 'idle' | 'recording' | 'review' | 'saving'

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, '0')
}

function formatTime(s: number) {
  return `${pad(s / 60)}:${pad(s % 60)}`
}

export default function StickerAudio() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stage, setStage] = useState<Stage>('idle')
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const blobRef = useRef<Blob | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
      audioRef.current?.pause()
    }
  }, [])

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType })
        blobRef.current = blob
        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url
        audioRef.current = new Audio(url)
        audioRef.current.onended = () => setPlaying(false)
        setStage('review')
      }

      recorder.start(100)
      startTimeRef.current = Date.now()
      setDuration(0)
      setStage('recording')

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        setDuration(elapsed)
        if (elapsed >= 60) stopRecording()
      }, 250)
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    mediaRecorderRef.current?.stop()
  }

  const togglePlayback = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  const saveAudio = async () => {
    if (!blobRef.current || !user || !id) return
    setStage('saving')
    setError(null)

    const mimeType = blobRef.current.type
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
    const path = `${user.id}/${id}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('audio-notes')
      .upload(path, blobRef.current, { contentType: mimeType, upsert: true })

    if (uploadErr) { setError(uploadErr.message); setStage('review'); return }

    const { data: { publicUrl } } = supabase.storage.from('audio-notes').getPublicUrl(path)

    const { error: dbErr } = await supabase.from('audio_notes').upsert(
      { sticker_id: id, audio_url: publicUrl, duration_seconds: Math.max(1, Math.round(duration)) },
      { onConflict: 'sticker_id' }
    )

    if (dbErr) { setError(dbErr.message); setStage('review'); return }

    navigate(`/sticker/${id}`)
  }

  const MAX = 60
  const pct = Math.min((duration / MAX) * 100, 100)

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Nav */}
      <div className="flex items-center px-4 pt-10 pb-2">
        <button
          onClick={() => navigate(`/sticker/${id}`)}
          className="p-2 -ml-2 text-ink/50 hover:text-ink transition"
          disabled={stage === 'saving'}
        >
          <ArrowLeft size={20} />
        </button>
        <span className="ml-2 font-mono text-[11px] text-ink/40 tracking-widest uppercase">
          Voice note
        </span>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">

        {/* Timer ring */}
        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor"
              className="text-paper-2" strokeWidth="8" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor"
              className={stage === 'recording' ? 'text-coral' : 'text-ink/20'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.25s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-bold text-ink tabular-nums">
              {formatTime(duration)}
            </span>
            <span className="font-mono text-[10px] text-ink/30 mt-1 tracking-widest uppercase">
              {stage === 'recording' ? 'recording' : stage === 'review' ? 'recorded' : stage === 'saving' ? 'saving…' : 'max 60s'}
            </span>
          </div>
        </div>

        {/* Controls */}
        {stage === 'idle' && (
          <button
            onClick={startRecording}
            className="w-20 h-20 rounded-full bg-coral text-paper flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition"
          >
            <Mic size={32} />
          </button>
        )}

        {stage === 'recording' && (
          <button
            onClick={stopRecording}
            className="w-20 h-20 rounded-full bg-ink text-paper flex items-center justify-center shadow-lg hover:opacity-80 active:scale-95 transition"
          >
            <Square size={28} fill="currentColor" />
          </button>
        )}

        {stage === 'review' && (
          <div className="flex items-center gap-6">
            <button
              onClick={startRecording}
              className="w-14 h-14 rounded-full border-2 border-ink/20 text-ink/50 flex items-center justify-center hover:border-ink/40 hover:text-ink active:scale-95 transition"
              title="Re-record"
            >
              <Mic size={22} />
            </button>
            <button
              onClick={togglePlayback}
              className="w-20 h-20 rounded-full bg-paper-2 text-ink flex items-center justify-center shadow hover:bg-ink/10 active:scale-95 transition"
            >
              {playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
            </button>
            <button
              onClick={saveAudio}
              className="w-14 h-14 rounded-full bg-coral text-paper flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition"
              title="Save"
            >
              <Check size={22} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {stage === 'saving' && (
          <div className="w-10 h-10 rounded-full border-2 border-coral border-t-transparent animate-spin" />
        )}

        {error && (
          <p className="text-center font-mono text-xs text-red-500 max-w-xs">{error}</p>
        )}
      </div>

      <p className="text-center font-mono text-[11px] text-ink/20 pb-10 tracking-wide">
        {stage === 'idle' ? 'Tap the mic to start recording' :
         stage === 'recording' ? 'Tap the square to stop' :
         stage === 'review' ? 'Play it back, re-record, or save' : ''}
      </p>
    </div>
  )
}
