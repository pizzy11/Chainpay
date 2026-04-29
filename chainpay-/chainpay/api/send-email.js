// api/send-email.js — Vercel Serverless Function
// Deploy to Vercel and set RESEND_API_KEY in environment variables

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' })
  }

  const { type, to, subject, invoiceNumber, clientName, senderName, total, currency, dueDate, payLink } = req.body

  let html = ''

  if (type === 'invoice_sent') {
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .card { background: #ffffff; border-radius: 16px; max-width: 520px; margin: 0 auto; overflow: hidden; }
    .header { background: #0a0a0f; padding: 28px 32px; }
    .logo { color: #f0f0f8; font-size: 20px; font-weight: 800; }
    .logo span { color: #c8f135; }
    .body { padding: 32px; }
    .amount { font-size: 38px; font-weight: 800; color: #0a0a0f; margin: 16px 0 8px; }
    .currency { color: #6b6b80; font-size: 15px; margin-bottom: 24px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-label { color: #6b6b80; }
    .info-value { font-weight: 600; }
    .cta { display: block; background: #c8f135; color: #0a0a0f; text-decoration: none; text-align: center; padding: 16px; border-radius: 12px; font-weight: 800; font-size: 16px; margin-top: 28px; }
    .footer { padding: 20px 32px; background: #f9f9f9; font-size: 12px; color: #9b9ba8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">Chain<span>Pay</span></div>
    </div>
    <div class="body">
      <p style="color:#6b6b80; margin:0 0 8px;">Hi ${clientName},</p>
      <p style="font-size:16px; color:#0a0a0f; margin:0 0 20px;"><strong>${senderName}</strong> has sent you a crypto invoice.</p>
      <div class="amount">${parseFloat(total).toFixed(2)}</div>
      <div class="currency">payable in ${currency}</div>
      <div class="info-row"><span class="info-label">Invoice #</span><span class="info-value">${invoiceNumber}</span></div>
      <div class="info-row"><span class="info-label">From</span><span class="info-value">${senderName}</span></div>
      ${dueDate ? `<div class="info-row"><span class="info-label">Due</span><span class="info-value">${new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>` : ''}
      <a href="${payLink}" class="cta">Pay Invoice →</a>
    </div>
    <div class="footer">Powered by ChainPay · Crypto invoicing for the modern freelancer</div>
  </div>
</body>
</html>`
  }

  if (type === 'payment_confirmed') {
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .card { background: #ffffff; border-radius: 16px; max-width: 520px; margin: 0 auto; overflow: hidden; }
    .header { background: #0a0a0f; padding: 28px 32px; }
    .logo { color: #f0f0f8; font-size: 20px; font-weight: 800; }
    .logo span { color: #c8f135; }
    .body { padding: 32px; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    .title { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .sub { color: #6b6b80; font-size: 15px; }
    .amount { font-size: 36px; font-weight: 800; color: #00e5a0; margin: 24px 0 8px; }
    .footer { padding: 20px; background: #f9f9f9; font-size: 12px; color: #9b9ba8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header"><div class="logo">Chain<span>Pay</span></div></div>
    <div class="body">
      <div class="icon">✅</div>
      <div class="title">Payment Confirmed!</div>
      <div class="sub">${clientName} has paid invoice ${invoiceNumber}</div>
      <div class="amount">${parseFloat(total).toFixed(2)} ${currency}</div>
      <p style="color:#6b6b80; font-size:14px;">The payment has been marked as received. Check your wallet for the funds.</p>
    </div>
    <div class="footer">Powered by ChainPay</div>
  </div>
</body>
</html>`
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ChainPay <invoices@chainpay.app>',
        to: [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(err)
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Resend error:', error)
    return res.status(500).json({ error: error.message })
  }
}
