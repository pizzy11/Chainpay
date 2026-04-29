// api/billing-portal.js — Paystack subscription management
// Fetches the customer's active subscription so they can cancel

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

  if (!PAYSTACK_SECRET) {
    return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY not configured' })
  }

  const { userEmail } = req.body

  try {
    // Get customer by email
    const customerRes = await fetch(
      `https://api.paystack.co/customer/${encodeURIComponent(userEmail)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    )
    const customerData = await customerRes.json()

    if (!customerData.status || !customerData.data) {
      return res.status(404).json({ error: 'No billing account found' })
    }

    const subscriptions = customerData.data.subscriptions || []
    const activeSub = subscriptions.find(s => s.status === 'active')

    if (!activeSub) {
      return res.status(404).json({ error: 'No active subscription found' })
    }

    // Generate a subscription management link
    const linkRes = await fetch(
      `https://api.paystack.co/subscription/${activeSub.subscription_code}/manage/link`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    )
    const linkData = await linkRes.json()

    if (!linkData.status) {
      throw new Error('Could not generate management link')
    }

    return res.status(200).json({ url: linkData.data.link })
  } catch (error) {
    console.error('Billing portal error:', error)
    return res.status(500).json({ error: error.message })
  }
}
