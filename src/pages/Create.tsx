import { Clock, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Create() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-paper flex flex-col px-6 pt-14 pb-10">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-paper-2 flex items-center justify-center mb-6">
          <Sparkles size={28} className="text-coral" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-3xl font-bold text-ink leading-tight">
          AI Design Studio
        </h1>
        <p className="mt-3 text-ink/50 text-sm leading-relaxed max-w-xs">
          Answer a few questions and an AI will design a custom sticker around your moment — then you add a voice note and order it.
        </p>
        <div className="mt-8 flex items-center gap-2 px-4 py-2.5 rounded-full bg-paper-2">
          <Clock size={14} className="text-ink/40" />
          <span className="font-mono text-[11px] text-ink/40 tracking-widest uppercase">
            Coming soon
          </span>
        </div>
      </div>

      <div className="border border-ink/10 rounded-2xl p-5">
        <p className="font-mono text-[11px] text-ink/40 tracking-widest uppercase mb-3">
          In the meantime
        </p>
        <p className="text-sm text-ink/60 leading-relaxed">
          Browse the gallery to find a preset, save it to your library, add a voice note, and order it.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-coral text-sm font-semibold"
        >
          Browse gallery →
        </button>
      </div>
    </div>
  )
}
