import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import Dashboard from './pages/Dashboard'
import CreateInvoice from './pages/CreateInvoice'
import PayPage from './pages/PayPage'
import PricingPage from './pages/PricingPage'
import AuthPage from './pages/auth/AuthPage'
import AccountPage from './pages/account/AccountPage'
import './index.css'

function Protected({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />
  return children
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/pay/:invoiceNumber" element={<PayPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/auth" element={<GuestOnly><AuthPage /></GuestOnly>} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/create" element={<Protected><CreateInvoice /></Protected>} />
      <Route path="/account" element={<Protected><AccountPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: '#1a1a24', color: '#f0f0f8', border: '1px solid #2a2a38', fontFamily: "'Syne', sans-serif", fontWeight: 600, borderRadius: '12px', fontSize: '14px' },
            success: { iconTheme: { primary: '#c8f135', secondary: '#0a0a0f' } },
            error: { iconTheme: { primary: '#ff4d6d', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
