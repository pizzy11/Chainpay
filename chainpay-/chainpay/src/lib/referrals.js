import { supabase } from './supabase'

// ── Referral helpers ─────────────────────────────────────────────────

export async function getMyReferralCode(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data?.referral_code
}

export async function getReferralStats(userId) {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error

  const converted = (data || []).filter(r => r.status === 'converted' || r.status === 'paid')
  const totalEarned = converted.reduce((s, r) => s + parseFloat(r.reward_amount || 0), 0)

  return {
    referrals: data || [],
    totalReferrals: (data || []).length,
    convertedReferrals: converted.length,
    totalEarned,
  }
}

export async function applyReferralCode(referredUserId, referralCode) {
  // Call a Supabase RPC (the SQL function we created in migration 003)
  const { error } = await supabase.rpc('process_referral_conversion', {
    referred_user_id: referredUserId,
    ref_code: referralCode.toUpperCase(),
  })
  if (error) throw error
  return true
}

// ── Earnings helpers ─────────────────────────────────────────────────

export async function getEarnings(userId) {
  const { data, error } = await supabase
    .from('earnings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getEarningsSummary(userId) {
  const { data, error } = await supabase
    .from('earnings_summary')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) return { referral_earnings: 0, fee_earnings: 0, total_earnings: 0, total_referrals: 0 }
  return data
}

export async function logTransactionFee({ invoiceId, userId, invoiceTotal, currency }) {
  // 0.5% platform fee on every paid invoice
  const FEE_RATE = 0.005
  const feeAmount = parseFloat(invoiceTotal) * FEE_RATE

  // Log fee in earnings table (platform revenue)
  const { error } = await supabase.from('earnings').insert([{
    user_id: userId,
    type: 'platform_fee',
    invoice_id: invoiceId,
    amount: feeAmount,
    description: `0.5% fee on ${parseFloat(invoiceTotal).toFixed(2)} ${currency} invoice`,
  }])

  // Mark fee as collected on invoice
  await supabase
    .from('invoices')
    .update({ fee_amount: feeAmount, fee_collected: true })
    .eq('id', invoiceId)

  if (error) console.error('Fee log error:', error)
  return feeAmount
}
