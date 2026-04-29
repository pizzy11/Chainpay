import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { Logo, Btn, Field, Input } from '../../components/UI'

export default function AuthPage() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // signin | signup
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.email || !form.password) {
      toast.error('Email and password required')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(form.email, form.password, form.fullName)
        toast.success('Account created! Check your email to confirm.')
        navigate('/')
      } else {
        await signIn(form.email, form.password)
        toast.success('Welcome back!')
        navigate('/')
      }
    } catch (e) {
      toast.error(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 40, marginTop: 16 }}>
        <Logo />
      </div>

      {/* Hero text */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
          {mode === 'signup' ? <>Start getting paid<br />in <span style={{ color: 'var(--accent)' }}>crypto</span></> : <>Welcome<br />back</>}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          {mode === 'signup'
            ? 'Create your free account. No credit card required.'
            : 'Sign in to manage your invoices.'}
        </p>
      </div>

      {/* Form */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
        {mode === 'signup' && (
          <Field label="Full Name">
            <Input
              value={form.fullName}
              onChange={e => set('fullName', e.target.value)}
              placeholder="Alex Johnson"
              autoComplete="name"
            />
          </Field>
        )}
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </Field>

        <div style={{ marginTop: 20 }}>
          <Btn variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create Free Account →' : 'Sign In →'}
          </Btn>
        </div>
      </div>

      {/* Toggle */}
      <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>
        {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: "'Syne', sans-serif" }}
        >
          {mode === 'signup' ? 'Sign in' : 'Sign up free'}
        </button>
      </div>

      {/* Free plan reminder */}
      {mode === 'signup' && (
        <div style={{ marginTop: 32, background: 'rgba(200,241,53,0.04)', border: '1px solid rgba(200,241,53,0.15)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
            FREE PLAN INCLUDES
          </div>
          {['3 invoices/month', 'ETH, USDC, BTC, USDT', 'Public payment link', 'No credit card needed'].map(f => (
            <div key={f} style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent)' }}>✓</span> {f}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
