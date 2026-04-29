import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    invoiceLimit: 3,
    features: ['3 invoices/month', 'Crypto payments', 'Public pay link'],
    paystackPlanCode: null,
  },
  pro: {
    name: 'Pro',
    price: 19,
    invoiceLimit: Infinity,
    features: [
      'Unlimited invoices',
      'Email notifications',
      'Card payment via Paystack',
      'Payment confirmation emails',
      'Priority support',
    ],
    paystackPlanCode: import.meta.env.VITE_PAYSTACK_PRO_PLAN_CODE,
  },
  business: {
    name: 'Business',
    price: 49,
    invoiceLimit: Infinity,
    features: [
      'Everything in Pro',
      'Multiple wallets',
      'Team members (coming soon)',
      'White-label branding (coming soon)',
      'API access (coming soon)',
    ],
    paystackPlanCode: import.meta.env.VITE_PAYSTACK_BUSINESS_PLAN_CODE,
  },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [invoiceCount, setInvoiceCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadSubscription(session.user.id)
        loadInvoiceCount(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadSubscription(session.user.id)
        loadInvoiceCount(session.user.id)
      } else {
        setSubscription(null)
        setInvoiceCount(0)
        setLoading(false)
      }
    })

    return () => authSub.unsubscribe()
  }, [])

  async function loadSubscription(userId) {
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()
      setSubscription(data)
    } catch {
      setSubscription({ plan: 'free', status: 'active' })
    } finally {
      setLoading(false)
    }
  }

  async function loadInvoiceCount(userId) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    try {
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString())
      setInvoiceCount(count || 0)
    } catch {
      setInvoiceCount(0)
    }
  }

  const currentPlan = PLANS[subscription?.plan || 'free']
  const canCreateInvoice = invoiceCount < currentPlan.invoiceLimit
  const isProOrHigher = ['pro', 'business'].includes(subscription?.plan)

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshSubscription() {
    if (user) await loadSubscription(user.id)
  }

  return (
    <AuthContext.Provider value={{
      user, subscription, loading,
      currentPlan, canCreateInvoice, isProOrHigher,
      invoiceCount, signUp, signIn, signOut, refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
