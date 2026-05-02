// Sonic Sticker — Edge Function: send-order-email
//
// Sends an order notification to the founder and a confirmation to the customer.
// Uses Resend (https://resend.com) — free tier: 3,000 emails/month.
//
// Required env vars (set in Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY  — from resend.com/api-keys
//   FOUNDER_EMAIL   — your email address to receive order notifications
//   FROM_EMAIL      — verified sender address in Resend (e.g. orders@yourdomain.com)
//
// Deploy: npx supabase functions deploy send-order-email

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FOUNDER_EMAIL  = Deno.env.get('FOUNDER_EMAIL') ?? ''
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') ?? 'orders@sonicsticker.app'

interface OrderPayload {
  order_id: string
  preset_title: string
  customer_name: string
  customer_email: string
  shipping_address: string
  quantity: number
  magnet_size: string
  total_cents: number
  notes?: string
}

const SIZE_LABEL: Record<string, string> = {
  '2inch': '2" round',
  '3inch': '3" round',
  '4inch': '4" round',
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY || !to) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const order: OrderPayload = await req.json()
  const size = SIZE_LABEL[order.magnet_size] ?? order.magnet_size

  const summaryRows = `
    <tr><td><b>Sticker</b></td><td>${order.preset_title}</td></tr>
    <tr><td><b>Qty</b></td><td>${order.quantity} × ${size}</td></tr>
    <tr><td><b>Total</b></td><td>${dollars(order.total_cents)}</td></tr>
    <tr><td><b>Ship to</b></td><td>${order.shipping_address.replace(/\n/g, '<br>')}</td></tr>
    ${order.notes ? `<tr><td><b>Notes</b></td><td>${order.notes}</td></tr>` : ''}
  `

  const tableStyle = 'border-collapse:collapse;font-family:monospace;font-size:14px;'
  const tdStyle = 'padding:6px 12px 6px 0;vertical-align:top;'

  // Founder notification
  if (FOUNDER_EMAIL) {
    await sendEmail(
      FOUNDER_EMAIL,
      `New order from ${order.customer_name} — ${order.preset_title}`,
      `<h2 style="font-family:sans-serif">New Sonic Sticker Order</h2>
       <p style="font-family:sans-serif"><b>Customer:</b> ${order.customer_name} &lt;${order.customer_email}&gt;</p>
       <table style="${tableStyle}"><tbody>
         <tr><td style="${tdStyle}"><b>Order ID</b></td><td style="${tdStyle}">${order.order_id}</td></tr>
         ${summaryRows}
       </tbody></table>
       <p style="font-family:sans-serif;margin-top:20px">Check Venmo (@Gursimran-Rajvansh) for payment confirmation before shipping.</p>`
    )
  }

  // Customer confirmation
  await sendEmail(
    order.customer_email,
    'Your Sonic Sticker order is confirmed!',
    `<h2 style="font-family:sans-serif">Thanks, ${order.customer_name}!</h2>
     <p style="font-family:sans-serif">Your order has been received. Here's a summary:</p>
     <table style="${tableStyle}"><tbody>${summaryRows}</tbody></table>
     <p style="font-family:sans-serif;margin-top:20px">
       <b>Next step:</b> Send ${dollars(order.total_cents)} via Venmo to
       <b>@Gursimran-Rajvansh</b> with your order ID <b>${order.order_id.slice(0, 8)}</b> in the note.
     </p>
     <p style="font-family:sans-serif">
       We'll start production once payment is confirmed and ship within 5–7 business days.
     </p>
     <p style="font-family:sans-serif;color:#888;font-size:12px;margin-top:32px">Sonic Sticker</p>`
  )

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
