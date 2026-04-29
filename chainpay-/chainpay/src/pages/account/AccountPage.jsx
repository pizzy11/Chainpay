import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth, PLANS } from '../../context/AuthContext'
import { getReferralStats, getEarningsSummary } from '../../lib/referrals'
import { Logo, Spinner } from '../../components/UI'

export default function AccountPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, subscription, currentPlan, signOut, refreshSubscription } = useAuth()
  const [referralStats, setReferralStats] = useState(null)
  const [earnings, setEarnings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copiedRef, setCopiedRef] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)

  const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

  useEffect(() => {
    // Show success toast if coming from Stripe
    const subscribed = searchParams.get('subscribed')
    if (subscribed) {
      toast.success(`🎉 Welcome to ${subscribed.charAt(0).toUpperCase() + subscribed.slice(1)}! Your trial has started.`)
      refreshSubscription()
    }
  }, [searchParams])

  useEffect(() => {
    if (user) loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    try {
      const [refStats, earningsData] = await Promise.all([
        getReferralStats(user.id),
        getEarningsSummary(user.id),
      ])
      setReferralStats(refStats)
      setEarnings(earningsData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleBillingPortal() {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Billing portal not available')
      }
    } catch (e) {
      toast.error(e.message || 'Could not open billing portal')
    } finally {
      setBillingLoading(false)
    }
  }

  function copyReferralLink() {
    const code = referralStats?.referrals?.[0]?.referral_code
    if (!code) { toast.error('No referral code found'); return }
    const link = `${APP_URL}/auth?ref=${code}`
    navigator.clipboard.writeText(link)
    setCopiedRef(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopiedRef(false), 2500)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  if (!user) {
    navigate('/auth')
    return null
  }

  const planKey = subscription?.plan || 'free'
  const planColors = { free: 'var(--muted)', pro: 'var(--accent)', business: 'var(--accent2)' }
  const refCode = referralStats?.referrals?.[0]?.referral_code

  const section = (title, children) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
        {children}
      </div>
    </div>
  )

  const row = (label, value, extra) => (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'right' }}>
        {value}
        {extra && <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400, marginTop: 2 }}>{extra}</div>}
      </span>
    </div>
  )

  const actionRow = (label, onClick, variant = 'default', disabled = false) => {
    const colors = {
      default: { color: 'var(--text)', bg: 'transparent' },
      accent: { color: 'var(--accent)', bg: 'transparent' },
      danger: { color: 'var(--danger)', bg: 'transparent' },
    }
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: '100%', background: colors[variant].bg, border: 'none',
          padding: '14px 16px', textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer',
          color: colors[variant].color, fontSize: 13, fontWeight: 600,
          fontFamily: "'Syne', sans-serif", display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--border)', opacity: disabled ? 0.5 : 1,
        }}
      >
        {label} <span style={{ color: 'var(--muted)' }}>→</span>
      </button>
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo />
        <button onClick={() => navigate('/')} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 100, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>
          ← Back
        </button>
      </div>

      <div style={{ padding: 20 }}>

        {/* Profile hero */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface2)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', border: `1px solid ${planColors[planKey]}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: planColors[planKey], fontFamily: "'JetBrains Mono', monospace' " }}>
              {planKey.toUpperCase()} PLAN
            </div>
          </div>
        </div>

        {loading ? <div style={{ padding: 40 }}><Spinner /></div> : (
          <>
            {/* Earnings overview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>REFERRAL EARNINGS</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--paid)' }}>
                  ${parseFloat(earnings?.referral_earnings || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{referralStats?.convertedReferrals || 0} converted</div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>FEE REVENUE</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent2)' }}>
                  ${parseFloat(earnings?.fee_earnings || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>from paid invoices</div>
              </div>
            </div>

            {/* Referral link */}
            {section('💸 Your Referral Link', <>
              <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>
                  Earn <strong style={{ color: 'var(--accent)' }}>20% commission ($3.80/mo)</strong> for every Pro user you refer — recurring, for life.
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)', wordBreak: 'break-all', marginBottom: 10 }}>
                  {refCode ? `${APP_URL}/auth?ref=${refCode}` : 'Loading…'}
                </div>
                <button
                  onClick={copyReferralLink}
                  style={{
                    width: '100%', background: copiedRef ? 'rgba(200,241,53,0.1)' : 'var(--surface2)',
                    border: `1px solid ${copiedRef ? 'var(--accent)' : 'var(--border)'}`,
                    color: copiedRef ? 'var(--accent)' : 'var(--text)',
                    borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Syne', sans-serif", transition: 'all 0.2s',
                  }}
                >
                  {copiedRef ? '✓ Copied!' : '⧉ Copy Referral Link'}
                </button>
              </div>
              {row('Your code', <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)' }}>{refCode || '—'}</span>)}
              {row('Total referrals', referralStats?.totalReferrals || 0)}
              {row('Converted to paid', referralStats?.convertedReferrals || 0)}
              <div style={{ padding: '12px 16px', fontSize: 11, color: 'var(--muted)' }}>
                Payouts processed monthly to your connected bank account via Stripe.
              </div>
            </>)}

            {/* Subscription */}
            {section('📦 Subscription', <>
              {row('Current plan', <span style={{ color: planColors[planKey], textTransform: 'capitalize' }}>{planKey}</span>)}
              {row('Monthly price', planKey === 'free' ? 'Free' : `$${PLANS[planKey]?.price}/month`)}
              {subscription?.current_period_end && row('Renews', new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}
              {row('Status', <span style={{ color: subscription?.status === 'active' ? 'var(--paid)' : 'var(--danger)', textTransform: 'capitalize' }}>{subscription?.status || 'active'}</span>)}
              <div style={{ borderBottom: 'none' }}>
                {planKey === 'free'
                  ? actionRow('Upgrade to Pro — 7 days free', () => navigate('/pricing'), 'accent')
                  : actionRow(billingLoading ? 'Opening portal…' : 'Manage billing & invoices', handleBillingPortal, 'default', billingLoading)
                }
              </div>
            </>)}

            {/* Account */}
            {section('⚙️ Account', <>
              {row('Email', user.email)}
              <div style={{ borderBottom: 'none' }}>
                {actionRow('Sign out', handleSignOut, 'danger')}
              </div>
            </>)}
          </>
        )}
      </div>
    </div>
  )
}
