import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { createInvoice } from '../lib/supabase'
import { sendInvoiceEmail } from '../lib/email'
import {
  Logo, Field, Input, Textarea, Btn, SectionTitle,
  CRYPTO_OPTIONS, generateInvoiceNumber, formatCurrency,
} from '../components/UI'

const initForm = () => ({
  invoice_number: generateInvoiceNumber(),
  your_name: '', your_email: '', your_wallet: '',
  client_name: '', client_email: '', client_wallet: '',
  currency: 'USDC', due_date: '', note: '',
  items: [{ desc: '', qty: 1, rate: '' }],
})

export default function CreateInvoice() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initForm())
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const updateItem = (i, k, v) => {
    const items = [...form.items]
    items[i] = { ...items[i], [k]: v }
    setForm(f => ({ ...f, items }))
  }
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { desc: '', qty: 1, rate: '' }] }))
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))

  const total = form.items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0), 0)

  const canSubmit = form.your_name && form.your_wallet && form.client_name && form.client_email && total > 0

  async function handleCreate() {
    if (!canSubmit) {
      toast.error('Fill in required fields')
      return
    }
    setSaving(true)
    try {
      const invoiceData = {
        invoice_number: form.invoice_number,
        your_name: form.your_name,
        your_email: form.your_email,
        your_wallet: form.your_wallet,
        client_name: form.client_name,
        client_email: form.client_email,
        client_wallet: form.client_wallet,
        currency: form.currency,
        due_date: form.due_date || null,
        note: form.note,
        items: form.items,
        total,
        status: 'unpaid',
      }

      const saved = await createInvoice(invoiceData)

      // Send email notification to client
      toast.loading('Sending invoice email…', { id: 'email' })
      const emailSent = await sendInvoiceEmail({ invoice: saved })
      toast.dismiss('email')

      if (emailSent) {
        toast.success('Invoice sent & email delivered!')
      } else {
        toast.success('Invoice saved! (Email not configured yet)')
      }

      navigate(`/pay/${saved.invoice_number}`)
    } catch (e) {
      console.error(e)
      // Fallback: work without Supabase (demo mode)
      toast.success('Invoice created! (Connect Supabase to persist)')
      navigate('/')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%' }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', padding: '3px 8px', borderRadius: 20 }}>
          NEW INVOICE
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 100, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontFamily: "'Syne', sans-serif" }}
        >
          ← Back
        </button>

        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Create Invoice</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
          Invoice #{form.invoice_number}
        </div>

        {/* Your Info */}
        <SectionTitle>Your Info</SectionTitle>
        <Field label="Your Name / Business *">
          <Input value={form.your_name} onChange={e => set('your_name', e.target.value)} placeholder="e.g. Alex Johnson" />
        </Field>
        <Field label="Your Email (for payment confirmation)">
          <Input type="email" value={form.your_email} onChange={e => set('your_email', e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Your Wallet Address *">
          <Input value={form.your_wallet} onChange={e => set('your_wallet', e.target.value)} placeholder="0x... or bc1..." />
        </Field>

        {/* Client Info */}
        <SectionTitle>Client Info</SectionTitle>
        <Field label="Client Name *">
          <Input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="e.g. Acme Corp" />
        </Field>
        <Field label="Client Email * (invoice will be sent here)">
          <Input type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)} placeholder="client@example.com" />
        </Field>
        <Field label="Client Wallet (optional)">
          <Input value={form.client_wallet} onChange={e => set('client_wallet', e.target.value)} placeholder="0x..." />
        </Field>

        {/* Currency */}
        <SectionTitle>Payment Currency</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          {CRYPTO_OPTIONS.map((c) => (
            <button
              key={c.symbol}
              onClick={() => set('currency', c.symbol)}
              style={{
                background: form.currency === c.symbol ? 'rgba(200,241,53,0.06)' : 'var(--surface)',
                border: `1px solid ${form.currency === c.symbol ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10, padding: '10px 4px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Syne', sans-serif",
              }}
            >
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: form.currency === c.symbol ? 'var(--accent)' : 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}>
                {c.symbol}
              </span>
            </button>
          ))}
        </div>

        <Field label="Due Date">
          <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
        </Field>

        {/* Line Items */}
        <SectionTitle>Line Items</SectionTitle>
        {form.items.map((item, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={item.desc}
                onChange={e => updateItem(i, 'desc', e.target.value)}
                placeholder="Description"
                style={{ ...inputStyle, background: 'var(--surface2)', flex: 1 }}
              />
              {form.items.length > 1 && (
                <button onClick={() => removeItem(i)} style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)', color: 'var(--danger)', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>
                  ✕
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="Qty" min="1" style={{ ...inputStyle, background: 'var(--surface2)', padding: '9px 10px', fontSize: 13 }} />
              <input type="number" value={item.rate} onChange={e => updateItem(i, 'rate', e.target.value)} placeholder="Rate" min="0" step="0.01" style={{ ...inputStyle, background: 'var(--surface2)', padding: '9px 10px', fontSize: 13 }} />
              <input readOnly value={formatCurrency((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0))} style={{ ...inputStyle, background: 'var(--surface2)', padding: '9px 10px', fontSize: 13, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }} />
            </div>
          </div>
        ))}

        <button onClick={addItem} style={{ width: '100%', background: 'transparent', border: '1px dashed var(--border)', color: 'var(--muted)', borderRadius: 10, padding: 12, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
          ＋ Add Line Item
        </button>

        {/* Total */}
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Total</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
            {formatCurrency(total)} {form.currency}
          </span>
        </div>

        {/* Note */}
        <SectionTitle>Note (optional)</SectionTitle>
        <Field>
          <Textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="Payment terms, thank you note, etc." />
        </Field>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <Btn variant="secondary" onClick={() => navigate('/')} style={{ flex: 1 }}>Cancel</Btn>
          <Btn variant="primary" onClick={handleCreate} disabled={!canSubmit || saving} style={{ flex: 2 }}>
            {saving ? 'Sending…' : 'Send Invoice ✓'}
          </Btn>
        </div>
      </div>
    </div>
  )
}
