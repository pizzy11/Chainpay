import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getInvoices } from '../lib/supabase'
import { Logo, Badge, Spinner, formatDate, formatCurrency, CRYPTO_OPTIONS } from '../components/UI'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, subscription, currentPlan, invoiceCount, canCreateInvoice } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) loadInvoices() }, [user])

  async function loadInvoices() {
    try {
      const data = await getInvoices(user.id)
      setInvoices(data || [])
    } catch (e) {
      console.warn('Could not load invoices:', e.message)
    } finally {
      setLoading(false)
    }
  }

  const totalEarned = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.total || 0), 0)
  const pending = invoices.filter(i => i.status === 'unpaid').length
  const cryptoIcon = (sym) => CRYPTO_OPTIONS.find(c => c.symbol === sym)?.icon || 'o'
  const planKey = subscription?.plan || 'free'
  const limit = currentPlan?.invoiceLimit
  const isAtLimit = !canCreateInvoice

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: 100 }}>
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => navigate('/pricing')} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', padding: '4px 10px', borderRadius: 20, cursor: 'pointer', textTransform: 'uppercase' }}>
            {planKey}
          </button>
          <button onClick={() => navigate('/account')} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--accent)', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.email?.[0]?.toUpperCase()}
          </button>
        </div>
      </div>

      <div style={{ padding: 20, flex: 1 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'radial-gradient(circle, rgba(200,241,53,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--accent)', background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.2)', padding: '4px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 12 }}>
            Crypto-native invoicing
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
            Get paid in <span style={{ color: 'var(--accent)' }}>crypto</span>, professionally.
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>Create invoices, share a link, get paid in ETH, USDC or BTC.</p>
        </div>

        {planKey === 'free' && (
          <div style={{ background: 'var(--surface)', border: `1px solid ${isAtLimit ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: isAtLimit ? 'var(--danger)' : 'var(--muted)' }}>{isAtLimit ? 'Invoice limit reached' : 'Free plan usage'}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>{invoiceCount}/{limit} this month</span>
            </div>
            <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((invoiceCount / limit) * 100, 100)}%`, background: isAtLimit ? 'var(--danger)' : 'var(--accent)', borderRadius: 2 }} />
            </div>
            {isAtLimit && (
              <button onClick={() => navigate('/pricing')} style={{ width: '100%', marginTop: 10, background: 'var(--accent)', color: '#0a0a0f', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>
                Upgrade to Pro - 7 days free
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>TOTAL EARNED</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--paid)' }}>${totalEarned.toFixed(0)}</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>PENDING</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent2)' }}>{pending}</div>
          </div>
        </div>

        <div onClick={() => navigate('/account')} style={{ background: 'rgba(200,241,53,0.04)', border: '1px solid rgba(200,241,53,0.15)', borderRadius: 12, padding: '12px 14px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>Refer and Earn</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Earn 20% commission on every referral</div>
          </div>
          <span style={{ color: 'var(--muted)', fontSize: 16 }}>-&gt;</span>
        </div>

        {loading ? <div style={{ padding: 40 }}><Spinner /></div>
        : invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>No invoices yet. Create your first one.</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Recent Invoices</div>
            {invoices.map((inv) => (
              <div key={inv.id}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: 10, transition: 'border-color 0.2s' }}
                onClick={() => navigate(`/pay/${inv.invoice_number}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{inv.client_name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>{inv.invoice_number} · {formatDate(inv.created_at)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{cryptoIcon(inv.currency)} {formatCurrency(inv.total)} {inv.currency}</div>
                  <Badge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => isAtLimit ? navigate('/pricing') : navigate('/create')}
        style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: isAtLimit ? 'var(--danger)' : 'var(--accent)', color: '#0a0a0f', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 100, padding: '16px 32px', cursor: 'pointer', boxShadow: `0 4px 24px ${isAtLimit ? 'rgba(255,77,109,0.3)' : 'rgba(200,241,53,0.3)'}`, whiteSpace: 'nowrap', fontFamily: "'Syne', sans-serif" }}
      >
        {isAtLimit ? 'Upgrade to Create' : '+ New Invoice'}
      </button>
    </div>
  )
}
