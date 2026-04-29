import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Missing Supabase env vars. Check your .env file.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
)

// ── Invoice helpers ──────────────────────────────────────────────────

export async function createInvoice(data) {
  const { data: inv, error } = await supabase
    .from('invoices')
    .insert([data])
    .select()
    .single()
  if (error) throw error
  return inv
}

export async function getInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getInvoiceByNumber(invoiceNumber) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('invoice_number', invoiceNumber)
    .single()
  if (error) throw error
  return data
}

export async function markInvoicePaid(invoiceNumber) {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('invoice_number', invoiceNumber)
    .select()
    .single()
  if (error) throw error
  return data
}
