// api/create-subscription.js — Paystack subscription plans
// Paystack handles recurring billing natively for Nigerian businesses

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY
  const APP_URL = process.env.VITE_APP_URL || 'https://chainpay.vercel.app'

  if (!PAYSTACK_SECRET) {
    return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY not configured' })
  }

  const { planCode, userId, userEmail, plan } = req.body

  if (!planCode || !userId) {
    return res.status(400).json({ error: 'Missing planCode or userId' })
  }

  try {
    // Initialize a Paystack transaction that also creates a subscription
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userEmail,
        plan: planCode,           // Paystack plan code e.g. PLN_xxxx
        amount: getPlanAmount(plan), // first charge amount in kobo/cents
        currency: 'USD',
        callback_url: `${APP_URL}/account?subscribed=${plan}`,
        metadata: {
          user_id: userId,
          plan,
          cancel_action: `${APP_URL}/pricing?cancelled=true`,
        },
      }),
    })

    const data = await response.json()

    if (!data.status) {
      throw new Error(data.message || 'Could not initialize subscription')
    }

    return res.status(200).json({ url: data.data.authorization_url })
  } catch (error) {
    console.error('Paystack subscription error:', error)
    return res.status(500).json({ error: error.message })
  }
}

function getPlanAmount(plan) {
  const prices = { pro: 1900, business: 4900 } // in cents (USD)
  return prices[plan] || 1900
}
