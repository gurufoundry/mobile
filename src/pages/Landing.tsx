import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Landing() {
  const { user, signOut } = useAuth()

  if (!user) {
    return (
      <div className="p-6 pt-10 flex flex-col items-start">
        <h1 className="font-display text-4xl font-bold text-ink leading-tight">
          Design stickers.<br />Record your voice.<br />Share with NFC.
        </h1>
        <p className="mt-4 text-ink/60 text-sm leading-relaxed max-w-xs">
          A 2-minute chat with an AI creates a custom sticker with an attached voice note — paired with an NFC tag.
        </p>
        <Link
          to="/auth"
          className="mt-8 bg-coral text-paper font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition active:scale-95"
        >
          Get started
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 pt-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Gallery</h1>
        <button
          onClick={signOut}
          className="font-mono text-[11px] text-ink/40 hover:text-ink/70 tracking-widest uppercase transition"
        >
          Sign out
        </button>
      </div>
      <p className="text-sm font-mono text-ink/40">
        Preset gallery — Phase 2
      </p>
    </div>
  )
}
