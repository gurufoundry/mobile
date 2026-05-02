import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import StickerRenderer from '../components/StickerRenderer'
import { Preset } from '../types/sticker'

const SIZE_LABELS: Record<string, string> = {
  '2inch': '2" round',
  '3inch': '3" round',
  '4inch': '4" round',
}

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

interface FormState {
  name: string
  email: string
  address: string
  quantity: number
  size: '2inch' | '3inch' | '4inch'
  notes: string
}

export default function Checkout() {
  const { presetId } = useParams<{ presetId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [preset, setPreset] = useState<Preset | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>({
    name: '',
    email: user?.email ?? '',
    address: '',
    quantity: 1,
    size: '3inch',
    notes: '',
  })

  useEffect(() => {
    if (!presetId) return
    supabase
      .from('presets')
      .select('*')
      .eq('id', presetId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setPreset(data as Preset)
        setLoading(false)
      })
  }, [presetId])

  const unitPrice = preset?.price_cents ?? 1200
  const total = unitPrice * form.quantity

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }))

  const setQty = (delta: number) =>
    setForm(f => ({ ...f, quantity: Math.min(20, Math.max(1, f.quantity + delta)) }))

  const isStep1Valid =
    form.name.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.address.trim().length > 0

  const submitOrder = async () => {
    setSubmitting(true)
    setError(null)
    const { data, error: insertErr } = await supabase
      .from('orders')
      .insert({
        preset_id: presetId ?? null,
        user_id: user?.id ?? null,
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        shipping_address: form.address.trim(),
        quantity: form.quantity,
        magnet_size: form.size,
        notes: form.notes.trim() || null,
        unit_price_cents: unitPrice,
        total_cents: total,
        status: 'pending_payment',
      })
      .select('id')
      .single()

    if (insertErr) { setError('Could not save order. Please try again.'); setSubmitting(false); return }
    setOrderId(data.id)

    // Send emails — non-blocking, failure is silent
    supabase.functions
      .invoke('send-order-email', {
        body: {
          order_id: data.id,
          preset_title: preset?.title ?? 'Sonic Sticker',
          customer_name: form.name.trim(),
          customer_email: form.email.trim(),
          shipping_address: form.address.trim(),
          quantity: form.quantity,
          magnet_size: form.size,
          total_cents: total,
          notes: form.notes.trim() || undefined,
        },
      })
      .catch(() => {})

    setSubmitting(false)
    setStep(3)
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
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
        <p className="font-mono text-sm text-ink/40">Sticker not found.</p>
        <button onClick={() => navigate('/')} className="text-coral text-sm font-semibold">Back to gallery</button>
      </div>
    )
  }

  // ─── Step 1: Details form ───────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <div className="flex items-center px-4 pt-10 pb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-ink/50 hover:text-ink transition">
            <ArrowLeft size={20} />
          </button>
          <span className="ml-2 font-mono text-[11px] text-ink/40 tracking-widest uppercase">Order · 1 of 2</span>
        </div>

        {/* Sticker preview + name */}
        <div className="flex items-center gap-4 px-6 pb-4">
          <div className="rounded-2xl overflow-hidden shadow flex-shrink-0">
            <StickerRenderer design={preset.design_json} size={72} />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-ink">{preset.title}</p>
            <p className="font-mono text-[11px] text-ink/40">{dollars(unitPrice)} each</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block font-mono text-[11px] text-ink/40 tracking-widest uppercase mb-1.5">Full name</label>
            <input
              type="text" value={form.name} onChange={set('name')}
              placeholder="Your name"
              className="w-full bg-paper-2 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-coral/40"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-mono text-[11px] text-ink/40 tracking-widest uppercase mb-1.5">Email</label>
            <input
              type="email" value={form.email} onChange={set('email')}
              placeholder="you@example.com"
              className="w-full bg-paper-2 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-coral/40"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block font-mono text-[11px] text-ink/40 tracking-widest uppercase mb-1.5">Shipping address</label>
            <textarea
              value={form.address} onChange={set('address')}
              placeholder={"123 Main St\nCity, State ZIP\nCountry"}
              rows={3}
              className="w-full bg-paper-2 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-coral/40 resize-none"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block font-mono text-[11px] text-ink/40 tracking-widest uppercase mb-1.5">Quantity</label>
            <div className="flex items-center gap-4">
              <button onClick={() => setQty(-1)} className="w-10 h-10 rounded-full bg-paper-2 text-ink font-bold text-lg flex items-center justify-center hover:bg-ink/10 transition active:scale-90">−</button>
              <span className="font-display text-2xl font-bold text-ink w-8 text-center tabular-nums">{form.quantity}</span>
              <button onClick={() => setQty(+1)} className="w-10 h-10 rounded-full bg-paper-2 text-ink font-bold text-lg flex items-center justify-center hover:bg-ink/10 transition active:scale-90">+</button>
              <span className="font-mono text-xs text-ink/40 ml-2">= {dollars(total)}</span>
            </div>
          </div>

          {/* Magnet size */}
          <div>
            <label className="block font-mono text-[11px] text-ink/40 tracking-widest uppercase mb-1.5">Magnet size</label>
            <div className="grid grid-cols-3 gap-2">
              {(['2inch', '3inch', '4inch'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setForm(f => ({ ...f, size: s }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition ${
                    form.size === s
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper-2 text-ink/60 border-transparent hover:border-ink/20'
                  }`}
                >
                  {SIZE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-mono text-[11px] text-ink/40 tracking-widest uppercase mb-1.5">Notes <span className="normal-case text-ink/25">(optional)</span></label>
            <textarea
              value={form.notes} onChange={set('notes')}
              placeholder="Any special requests…"
              rows={2}
              className="w-full bg-paper-2 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-coral/40 resize-none"
            />
          </div>
        </div>

        <div className="px-6 pb-8 pt-2">
          <button
            onClick={() => setStep(2)}
            disabled={!isStep1Valid}
            className="w-full bg-coral text-paper font-semibold py-4 rounded-2xl text-sm disabled:opacity-40 hover:opacity-90 transition active:scale-95"
          >
            Continue to payment →
          </button>
        </div>
      </div>
    )
  }

  // ─── Step 2: Payment ────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <div className="flex items-center px-4 pt-10 pb-4">
          <button onClick={() => setStep(1)} className="p-2 -ml-2 text-ink/50 hover:text-ink transition">
            <ArrowLeft size={20} />
          </button>
          <span className="ml-2 font-mono text-[11px] text-ink/40 tracking-widest uppercase">Payment · 2 of 2</span>
        </div>

        <div className="flex-1 px-6 overflow-y-auto">
          {/* Order summary */}
          <div className="bg-paper-2 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl overflow-hidden flex-shrink-0">
                <StickerRenderer design={preset.design_json} size={52} />
              </div>
              <div>
                <p className="font-medium text-sm text-ink">{preset.title}</p>
                <p className="font-mono text-[11px] text-ink/40">
                  {form.quantity} × {SIZE_LABELS[form.size]}
                </p>
              </div>
              <p className="ml-auto font-display text-lg font-bold text-ink">{dollars(total)}</p>
            </div>
            <div className="border-t border-ink/8 pt-3 font-mono text-[11px] text-ink/40 space-y-1">
              <p>{form.name}</p>
              <p>{form.email}</p>
              <p className="whitespace-pre-wrap">{form.address}</p>
            </div>
          </div>

          {/* Venmo QR */}
          <div className="flex flex-col items-center text-center mb-6">
            <p className="font-mono text-[11px] text-ink/40 tracking-widest uppercase mb-4">
              Pay via Venmo
            </p>
            <div className="bg-white p-4 rounded-2xl shadow-sm inline-block">
              <QRCodeSVG
                value="https://venmo.com/u/Gursimran-Rajvansh"
                size={180}
                bgColor="#ffffff"
                fgColor="#0E0E10"
              />
            </div>
            <p className="mt-4 font-mono text-sm font-bold text-ink tracking-wide">@Gursimran-Rajvansh</p>
            <p className="mt-1 font-display text-3xl font-bold text-coral">{dollars(total)}</p>
            <p className="mt-2 font-mono text-[11px] text-ink/40 max-w-xs leading-relaxed">
              Scan the QR code or search @Gursimran-Rajvansh in Venmo. Include your name in the payment note.
            </p>
          </div>

          {error && (
            <p className="text-center font-mono text-xs text-red-500 mb-4">{error}</p>
          )}
        </div>

        <div className="px-6 pb-8 pt-2">
          <button
            onClick={submitOrder}
            disabled={submitting}
            className="w-full bg-coral text-paper font-semibold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition active:scale-95"
          >
            {submitting
              ? <div className="w-5 h-5 rounded-full border-2 border-paper border-t-transparent animate-spin" />
              : <><ShoppingBag size={16} /> I've sent payment — confirm order</>
            }
          </button>
          <p className="text-center font-mono text-[10px] text-ink/25 mt-3">
            We'll start production once Venmo payment is confirmed.
          </p>
        </div>
      </div>
    )
  }

  // ─── Step 3: Confirmation ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-paper-2 flex items-center justify-center mb-6">
        <Check size={36} className="text-coral" strokeWidth={2} />
      </div>
      <h1 className="font-display text-3xl font-bold text-ink">Order received!</h1>
      <p className="mt-3 text-sm text-ink/60 leading-relaxed max-w-xs">
        Thanks, {form.name}. We'll confirm your Venmo payment and ship within 5–7 business days.
      </p>
      {orderId && (
        <p className="mt-4 font-mono text-[11px] text-ink/30">
          Order #{orderId.slice(0, 8).toUpperCase()}
        </p>
      )}
      <p className="mt-2 font-mono text-[11px] text-ink/40">
        Confirmation sent to {form.email}
      </p>
      <button
        onClick={() => navigate('/')}
        className="mt-10 bg-ink text-paper font-semibold px-8 py-3.5 rounded-xl text-sm hover:opacity-80 transition active:scale-95"
      >
        Back to gallery
      </button>
    </div>
  )
}
