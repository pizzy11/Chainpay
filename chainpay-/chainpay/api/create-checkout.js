// api/create-checkout.js — Paystack one-time invoice payment
// Paystack is free to sign up: https://paystack.com
// Get your secret key: Paystack Dashboard → Settings → API Keys

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY
  const APP_URL = process.env.VITE_APP_URL || 'https://chainpay.vercel.app'

  if (!PAYSTACK_SECRET) {
    return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY not configured' })
  }

  const { invoiceNumber, clientName, senderName, total, currency, invoiceId, clientEmail } = req.body

  // Paystack uses kobo (NGN) or smallest unit — but accepts USD via USD channel
  // Amount in USD cents equivalent (Paystack accepts amount in lowest denomination)
  const amountInKobo = Math.round(parseFloat(total) * 100)

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: clientEmail,
        amount: amountInKobo,
        currency: 'USD',
        callback_url: `${APP_URL}/pay/${invoiceNumber}?paystack=success`,
        metadata: {
          invoice_number: invoiceNumber,
          invoice_id: invoiceId,
          client_name: clientName,
          sender_name: senderName,
          cancel_action: `${APP_URL}/pay/${invoiceNumber}?paystack=cancelled`,
        },
      }),
    })

    const data = await response.json()

    if (!data.status) {
      throw new Error(data.message || 'Paystack initialization failed')
    }

    return res.status(200).json({
      url: data.data.authorization_url,
      reference: data.data.reference,
    })
  } catch (error) {
    console.error('Paystack checkout error:', error)
    return res.status(500).json({ error: error.message })
  }
}
