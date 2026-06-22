import { supabase } from '../lib/supabase'

const PAYMENT_MODE = String(import.meta.env.VITE_PAYMENT_MODE || 'manual').toLowerCase()

async function postPaymentEndpoint(endpoint, payload) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Your session expired. Sign in again before paying.')
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || `Payment request failed with HTTP ${response.status}.`)
  return result
}

export async function createPaymentOrder({ orderId, amount, paymentId, provider = 'manual_upi', ...customer }) {
  if (PAYMENT_MODE === 'manual') {
    const transactionId = String(paymentId || '').trim()
    if (transactionId.length < 6) throw new Error('Enter a valid UPI transaction ID with at least 6 characters.')
    return { orderId, amount, paymentId: transactionId, paymentProvider: provider, paymentStatus: 'Pending', mode: 'manual' }
  }
  return postPaymentEndpoint('/api/create-payment', { orderId, amount, ...customer })
}

export async function verifyPayment({ orderId, paymentId, provider = 'manual_upi' }) {
  if (PAYMENT_MODE === 'manual') return { orderId, paymentId, paymentProvider: provider, verified: false, paymentStatus: 'Pending', requiresAdminReview: true }
  return postPaymentEndpoint('/api/verify-payment', { orderId, paymentId, provider })
}

export const paymentMode = PAYMENT_MODE
