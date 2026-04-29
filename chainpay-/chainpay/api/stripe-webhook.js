// api/paystack-webhook.js — Paystack event handler
// Add this URL in Paystack Dashboard → Settings → API → Webhooks
// URL: https://your-app.vercel.app/api/paystack-webhook

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Verify the webhook is genuinely from Paystack
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex')

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const { event, data } = req.body

  // ── 1. One-time invoice payment succeeded ──────────────────────────
  if (event === 'charge.success') {
    const meta = data.metadata || {}
    const invoiceNumber = meta.invoice_number
    const userId = meta.user_id

    if (invoiceNumber) {
      const { data: inv } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_paid: true,           // reusing field name for compatibility
          stripe_session_id: data.reference,
        })
        .eq('invoice_number', invoiceNumber)
        .select()
        .single()

      // Log 0.5% platform fee
      if (inv && userId) {
        const feeAmount = parseFloat(inv.total) * 0.005
        await supabase.from('earnings').insert([{
          user_id: userId,
          type: 'platform_fee',
          invoice_id: inv.id,
          amount: feeAmount,
          description: `0.5% fee on ${inv.total} ${inv.currency} invoice`,
        }])
        await supabase.from('invoices')
          .update({ fee_amount: feeAmount, fee_collected: true })
          .eq('id', inv.id)
      }

      console.log(`✅ Invoice ${invoiceNumber} paid via Paystack card`)
    }
  }

  // ── 2. Subscription created / renewed ──────────────────────────────
  if (event === 'subscription.create' || event === 'invoice.payment_success') {
    const userId = data.metadata?.user_id
    const plan = data.metadata?.plan || 'pro'

    if (userId) {
      await supabase.from('subscriptions').update({
        plan,
        status: 'active',
        stripe_customer_id: data.customer?.customer_code,
        stripe_subscription_id: data.subscription_code,
        current_period_end: data.next_payment_date
          ? new Date(data.next_payment_date).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)

      console.log(`✅ Subscription active: user ${userId} → ${plan}`)
    }
  }

  // ── 3. Subscription cancelled ──────────────────────────────────────
  if (event === 'subscription.disable') {
    const userId = data.metadata?.user_id

    if (userId) {
      await supabase.from('subscriptions').update({
        plan: 'free',
        status: 'cancelled',
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)

      console.log(`⚠️ Subscription cancelled: user ${userId} → free`)
    }
  }

  // ── 4. Payment failed ──────────────────────────────────────────────
  if (event === 'invoice.payment_failed') {
    const userId = data.metadata?.user_id
    if (userId) {
      await supabase.from('subscriptions')
        .update({ status: 'past_due' })
        .eq('user_id', userId)
    }
  }

  res.status(200).json({ received: true })
}
