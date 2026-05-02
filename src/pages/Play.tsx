import { useParams } from 'react-router-dom'

export default function Play() {
  const { id } = useParams()
  return (
    <div className="min-h-screen bg-plum flex flex-col items-center justify-center p-6">
      <h1 className="font-display text-3xl font-semibold text-paper">Play</h1>
      <p className="mt-2 text-sm font-mono text-paper/40">/play/{id} — NFC playback · Phase 0</p>
    </div>
  )
}
