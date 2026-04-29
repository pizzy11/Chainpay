import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth, PLANS } from '../../context/AuthContext'
import { Logo } from '../../components/UI'

const PLAN_ORDER = ['free', 'pro', 'business']

export default function PricingPage() {
  const navigate = useNavigate()
  const { user, subscription } = useAuth()
  const [loading, setLoading] = useState(null)

  async function handleSelect(planKey) {
    if (planKey === 'free') return
    if (!user) { navigate('/auth?next=pricing'); return }

    const plan = PLANS[planKey]
    if (!plan.paystackPlanCode) {
      toast.error('Plan code not set — add VITE_PAYSTACK_PRO_PLAN_CODE to your .env')
      return
    }

    setLoading(planKey)
    try {
      const res = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: plan.paystackPlanCode,
          userId: user.id,
          userEmail: user.email,
          plan: planKey,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error)
      }
    } catch (e) {
      toast.error(e.message || 'Could not start checkout')
    } finally {
      setLoading(null)
    }
  }

  const currentPlanKey = subscription?.plan || 'free'
  const planColors = {
    free:     { accent: 'var(--muted)',   border: 'var(--border)',   glow: 'transparent' },
    pro:      { accent: 'var(--accent)',  border: 'var(--accent)',   glow: 'rgba(200,241,53,0.08)' },
    business: { accent: 'var(--accent2)', border: 'var(--accent2)',  glow: 'rgba(123,110,246,0.08)' },
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', paddingBottom: 60 }}>
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo />
        <button onClick={() => navigate('/')} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 100, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>
          ← Back
        </button>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 32, marginTop: 12 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--accent)', background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.2)', padding: '4px 12px', borderRadius: 20, display: 'inline-block', marginBottom: 14 }}>
            POWERED BY PAYSTACK
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Simple, honest pricing</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
            Start free. Upgrade when you're ready.<br />Cancel anytime — no questions asked.
          </p>
        </div>

        {PLAN_ORDER.map(planKey => {
          const plan = PLANS[planKey]
          const colors = planColors[planKey]
          const isCurrent = currentPlanKey === planKey
          const isPopular = planKey === 'pro'

          return (
            <div key={planKey} style={{
              background: isCurrent ? colors.glow : 'var(--surface)',
              border: `1px solid ${isCurrent ? colors.border : 'var(--border)'}`,
              borderRadius: 16, padding: 20, marginBottom: 12, position: 'relative', overflow: 'hidden',
            }}>
              {isPopular && (
                <div style={{ position: 'absolute', top: 16, right: 16, background: 'var(--accent)', color: '#0a0a0f', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: colors.accent }}>
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </span>
                {plan.price > 0 && <span style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>/month</span>}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{plan.name}</div>

              <div style={{ marginBottom: 20 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: colors.accent, fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <div style={{ textAlign: 'center', padding: 12, background: 'var(--surface2)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: colors.accent, border: `1px solid ${colors.border}` }}>
                  ✓ Your current plan
                </div>
              ) : planKey === 'free' ? (
                <div style={{ textAlign: 'center', padding: 12, fontSize: 13, color: 'var(--muted)' }}>Always free</div>
              ) : (
                <button
                  onClick={() => handleSelect(planKey)}
                  disabled={loading === planKey}
                  style={{
                    width: '100%', border: 'none', borderRadius: 10, padding: 13,
                    fontWeight: 800, fontSize: 14, cursor: 'pointer',
                    background: planKey === 'pro' ? 'var(--accent)' : 'var(--accent2)',
                    color: planKey === 'pro' ? '#0a0a0f' : '#fff',
                    fontFamily: "'Syne', sans-serif",
                    opacity: loading === planKey ? 0.7 : 1,
                  }}
                >
                  {loading === planKey ? 'Redirecting…' : 'Get started →'}
                </button>
              )}
            </div>
          )
        })}

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, letterSpacing: '0.05em' }}>PLATFORM FEE</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            A <strong style={{ color: 'var(--text)' }}>0.5% transaction fee</strong> is applied to each paid invoice. On a $1,000 invoice, that's just $5.
          </div>
        </div>

        <div style={{ background: 'rgba(200,241,53,0.04)', border: '1px solid rgba(200,241,53,0.15)', borderRadius: 12, padding: 16, marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, letterSpacing: '0.05em' }}>REFER AND EARN</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Share your referral link and earn <strong style={{ color: 'var(--text)' }}>20% commission</strong> ($3.80/month) for every Pro user you refer — for life.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--muted)' }}>
          Secured by Paystack · Cancel anytime · No hidden fees
        </div>
      </div>
    </div>
  )
}
