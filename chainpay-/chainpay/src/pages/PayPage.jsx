import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getInvoiceByNumber, markInvoicePaid } from '../lib/supabase'
import { sendPaymentConfirmationEmail } from '../lib/email'
import { Logo, Badge, Spinner, Card, formatDate, formatCurrency, CRYPTO_OPTIONS } from '../components/UI'

// Demo invoice for when Supabase isn't connected
const DEMO_INVOICE = {
  invoice_number: 'INV-DEMO01',
  your_name: 'Alex Johnson',
  your_email: 'alex@example.com',
  your_wallet: '0x742d35Cc6634C0532925a3b8D4C9b5A2f1e4d6c8',
  client_name: 'Acme Corp',
  client_email: 'client@acme.com',
  currency: 'USDC',
  total: 2500,
  due_date: '2026-05-31',
  note: 'Thank you for your business!',
  items: [
    { desc: 'Web Development', qty: 1, rate: 2000 },
    { desc: 'Design Consulting', qty: 5, rate: 100 },
  ],
  status: 'unpaid',
  created_at: new Date().toISOString(),
}

export default function PayPage() {
  const { invoiceNumber } = useParams()
  const [searchParams] = useSearchParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payMethod, setPayMethod] = useState(null) // 'crypto' | 'card'
  const [copied, setCopied] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [paystackLoading, setStripeLoading] = useState(false)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    loadInvoice()
  }, [invoiceNumber])

  useEffect(() => {
    // Handle Stripe return
    const stripeStatus = searchParams.get('paystack')
    if (stripeStatus === 'success') {
      toast.success('Payment successful! Invoice marked as paid.')
      handleMarkPaid(true)
    } else if (stripeStatus === 'cancelled') {
      toast.error('Payment cancelled.')
    }
  }, [searchParams])

  async function loadInvoice() {
    try {
      const data = await getInvoiceByNumber(invoiceNumber)
      setInvoice(data)
    } catch {
      // Show demo if Supabase not configured or invoice not found
      setInvoice({ ...DEMO_INVOICE, invoice_number: invoiceNumber })
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkPaid(fromStripe = false) {
    if (!invoice || isDemo) {
      setInvoice(i => ({ ...i, status: 'paid' }))
      toast.success('Marked as paid!')
      return
    }
    setMarkingPaid(true)
    try {
      const updated = await markInvoicePaid(invoiceNumber)
      setInvoice(updated)
      if (!fromStripe && invoice.your_email) {
        await sendPaymentConfirmationEmail({ invoice: updated })
      }
      toast.success('Invoice marked as paid!')
    } catch (e) {
      toast.error('Failed to update')
    } finally {
      setMarkingPaid(false)
    }
  }

  async function handlePaystackCheckout() {
    setStripeLoading(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: invoice.invoice_number,
          clientName: invoice.client_name,
          senderName: invoice.your_name,
          clientEmail: invoice.client_email,
          total: invoice.total,
          currency: invoice.currency,
          invoiceId: invoice.id,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error)
      }
    } catch (e) {
      toast.error('Stripe not configured yet — add STRIPE_SECRET_KEY in Vercel')
      console.error(e)
    } finally {
      setStripeLoading(false)
    }
  }

  function copyWallet() {
    navigator.clipboard.writeText(invoice.your_wallet)
    setCopied(true)
    toast.success('Wallet address copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 40, textAlign: 'center' }}>
        <Spinner />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Invoice not found</div>
        <div style={{ fontSize: 14 }}>Check the link and try again.</div>
      </div>
    )
  }

  const crypto = CRYPTO_OPTIONS.find(c => c.symbol === invoice.currency)
  const isPaid = invoice.status === 'paid'
  const items = Array.isArray(invoice.items) ? invoice.items : []

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo />
        {isDemo && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--accent)', background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.2)', padding: '3px 8px', borderRadius: 20 }}>
            DEMO
          </div>
        )}
      </div>

      <div style={{ padding: 20 }}>

        {/* Paid banner */}
        {isPaid && (
          <div style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--paid)', fontSize: 14 }}>Payment Received</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>This invoice has been paid. Thank you!</div>
            </div>
          </div>
        )}

        {/* Invoice card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 20 }}>

          {/* Card header */}
          <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                {invoice.invoice_number}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>Invoice</div>
              {invoice.due_date && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                  Due {formatDate(invoice.due_date)}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <Badge status={invoice.status} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginTop: 6 }}>
                {crypto?.icon} {invoice.currency}
              </div>
            </div>
          </div>

          {/* Card body */}
          <div style={{ padding: 20 }}>
            {/* Parties */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>FROM</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{invoice.your_name}</div>
                {invoice.your_wallet && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--muted)', wordBreak: 'break-all' }}>
                    {invoice.your_wallet.slice(0, 8)}…{invoice.your_wallet.slice(-6)}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>TO</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{invoice.client_name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{invoice.client_email}</div>
              </div>
            </div>

            {/* Line items */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                <span>ITEM</span><span>QTY</span><span>RATE</span><span>TOTAL</span>
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span>{item.desc || '—'}</span>
                  <span>{item.qty}</span>
                  <span>{formatCurrency(item.rate)}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                    {formatCurrency((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0))}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Total Due</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
                {formatCurrency(invoice.total)} {invoice.currency}
              </div>
            </div>

            {/* Note */}
            {invoice.note && (
              <div style={{ marginTop: 14, padding: 12, background: 'var(--surface2)', borderRadius: 8, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                {invoice.note}
              </div>
            )}
          </div>
        </div>

        {/* ── PAYMENT SECTION ── */}
        {!isPaid && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Choose Payment Method
            </div>

            {/* Method selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => setPayMethod(payMethod === 'crypto' ? null : 'crypto')}
                style={{
                  background: payMethod === 'crypto' ? 'rgba(200,241,53,0.06)' : 'var(--surface)',
                  border: `1px solid ${payMethod === 'crypto' ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  fontFamily: "'Syne', sans-serif", transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 22 }}>{crypto?.icon || '⟠'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: payMethod === 'crypto' ? 'var(--accent)' : 'var(--text)' }}>
                  Pay in {invoice.currency}
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Crypto wallet</span>
              </button>

              <button
                onClick={() => setPayMethod(payMethod === 'card' ? null : 'card')}
                style={{
                  background: payMethod === 'card' ? 'rgba(123,110,246,0.06)' : 'var(--surface)',
                  border: `1px solid ${payMethod === 'card' ? 'var(--accent2)' : 'var(--border)'}`,
                  borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  fontFamily: "'Syne', sans-serif", transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 22 }}>💳</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: payMethod === 'card' ? 'var(--accent2)' : 'var(--text)' }}>
                  Pay by Card
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Paystack checkout</span>
              </button>
            </div>

            {/* Crypto payment panel */}
            {payMethod === 'crypto' && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 12, padding: 20, marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
                  Send exactly <strong style={{ color: 'var(--accent)' }}>{formatCurrency(invoice.total)} {invoice.currency}</strong> to this wallet:
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text)', wordBreak: 'break-all', lineHeight: 1.6 }}>
                  {invoice.your_wallet}
                </div>
                <button
                  onClick={copyWallet}
                  style={{ width: '100%', background: copied ? 'rgba(200,241,53,0.1)' : 'var(--surface2)', border: `1px solid ${copied ? 'var(--accent)' : 'var(--border)'}`, color: copied ? 'var(--accent)' : 'var(--text)', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 12, fontFamily: "'Syne', sans-serif", transition: 'all 0.2s' }}
                >
                  {copied ? '✓ Copied!' : '⧉ Copy Wallet Address'}
                </button>
                <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginBottom: 16 }}>
                  After sending, click below to confirm payment
                </div>
                <button
                  onClick={() => handleMarkPaid()}
                  disabled={markingPaid}
                  style={{ width: '100%', background: 'var(--accent)', color: '#0a0a0f', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne', sans-serif", opacity: markingPaid ? 0.7 : 1 }}
                >
                  {markingPaid ? 'Confirming…' : "✓ I've Sent the Payment"}
                </button>
              </div>
            )}

            {/* Card payment panel */}
            {payMethod === 'card' && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--accent2)', borderRadius: 12, padding: 20, marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>
                  Pay <strong style={{ color: 'var(--text)' }}>{formatCurrency(invoice.total)} USD</strong> securely via Stripe. Accepts Visa, Mastercard, Amex.
                </div>
                <button
                  onClick={handlePaystackCheckout}
                  disabled={paystackLoading}
                  style={{ width: '100%', background: 'var(--accent2)', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne', sans-serif", opacity: paystackLoading ? 0.7 : 1 }}
                >
                  {paystackLoading ? 'Redirecting…' : '💳 Pay with Card via Paystack'}
                </button>
                <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
                  Secured by Paystack · 256-bit encryption
                </div>
              </div>
            )}
          </div>
        )}

        {/* Powered by */}
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: 'var(--muted)' }}>
          Powered by <span style={{ color: 'var(--accent)', fontWeight: 700 }}>ChainPay</span> · Crypto invoicing for the modern freelancer
        </div>
      </div>
    </div>
  )
}
