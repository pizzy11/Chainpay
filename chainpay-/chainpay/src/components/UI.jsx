// Shared reusable UI components

export function Logo() {
  return (
    <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>
      Chain<span style={{ color: 'var(--accent)' }}>Pay</span>
    </span>
  )
}

export function Badge({ status }) {
  const styles = {
    paid: { bg: 'rgba(0,229,160,0.1)', color: 'var(--paid)', border: 'rgba(0,229,160,0.25)' },
    unpaid: { bg: 'rgba(200,241,53,0.08)', color: 'var(--accent)', border: 'rgba(200,241,53,0.2)' },
    cancelled: { bg: 'rgba(255,77,109,0.08)', color: 'var(--danger)', border: 'rgba(255,77,109,0.2)' },
  }
  const s = styles[status] || styles.unpaid
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      padding: '3px 9px', borderRadius: 20,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {status}
    </span>
  )
}

export function Btn({ children, variant = 'primary', onClick, disabled, style = {} }) {
  const variants = {
    primary: { background: 'var(--accent)', color: '#0a0a0f', border: 'none' },
    secondary: { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' },
    outline: { background: 'transparent', color: 'var(--accent2)', border: '1px solid var(--accent2)' },
    danger: { background: 'rgba(255,77,109,0.1)', color: 'var(--danger)', border: '1px solid rgba(255,77,109,0.3)' },
    ghost: { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        borderRadius: 12,
        padding: '13px 20px',
        fontWeight: 700,
        fontSize: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s, transform 0.1s',
        width: '100%',
        fontFamily: "'Syne', sans-serif",
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{
          display: 'block', fontSize: 11, color: 'var(--muted)',
          marginBottom: 6, fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.04em',
        }}>
          {label}
        </label>
      )}
      {children}
    </div>
  )
}

export function Input({ ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '12px 14px',
        color: 'var(--text)',
        fontSize: 14,
        outline: 'none',
        transition: 'border-color 0.2s',
        ...props.style,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent2)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    />
  )
}

export function Textarea({ ...props }) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '12px 14px',
        color: 'var(--text)',
        fontSize: 14,
        outline: 'none',
        resize: 'vertical',
        minHeight: 70,
        transition: 'border-color 0.2s',
        fontFamily: "'Syne', sans-serif",
        ...props.style,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent2)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    />
  )
}

export function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--muted)',
      letterSpacing: '0.08em', textTransform: 'uppercase',
      fontFamily: "'JetBrains Mono', monospace",
      marginBottom: 12, marginTop: 24,
    }}>
      {children}
    </div>
  )
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function Spinner() {
  return (
    <div style={{
      width: 20, height: 20,
      border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      margin: '0 auto',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export const CRYPTO_OPTIONS = [
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  { symbol: 'USDC', name: 'USD Coin', icon: '◎', color: '#2775CA' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: '#F7931A' },
  { symbol: 'USDT', name: 'Tether', icon: '₮', color: '#26A17B' },
]

export const generateInvoiceNumber = () =>
  'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase()

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export const formatCurrency = (n) => parseFloat(n || 0).toFixed(2)
