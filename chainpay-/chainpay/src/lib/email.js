// Email notifications via Resend API
// Resend is free for up to 3,000 emails/month — https://resend.com
//
// These functions call a Vercel serverless function (/api/send-email)
// so the API key stays server-side and never exposed in the browser.

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173'

export async function sendInvoiceEmail({ invoice }) {
  try {
    const payLink = `${APP_URL}/pay/${invoice.invoice_number}`
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'invoice_sent',
        to: invoice.client_email,
        subject: `Invoice ${invoice.invoice_number} from ${invoice.your_name}`,
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.client_name,
        senderName: invoice.your_name,
        total: invoice.total,
        currency: invoice.currency,
        dueDate: invoice.due_date,
        payLink,
      }),
    })
    if (!res.ok) throw new Error('Email send failed')
    return true
  } catch (e) {
    console.error('Email error:', e)
    return false
  }
}

export async function sendPaymentConfirmationEmail({ invoice }) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment_confirmed',
        to: invoice.your_email,
        subject: `✅ Payment received — ${invoice.invoice_number}`,
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.client_name,
        senderName: invoice.your_name,
        total: invoice.total,
        currency: invoice.currency,
      }),
    })
    if (!res.ok) throw new Error('Email send failed')
    return true
  } catch (e) {
    console.error('Email error:', e)
    return false
  }
}
