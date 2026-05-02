import { useParams } from 'react-router-dom'

export default function StickerDetail() {
  const { id } = useParams()
  return (
    <div className="p-6 pt-10">
      <h1 className="font-display text-3xl font-semibold text-ink">Sticker</h1>
      <p className="mt-2 text-sm font-mono text-ink/40">/sticker/{id} — Preview + edit · Phase 0</p>
    </div>
  )
}
