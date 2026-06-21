import { auth } from '../firebase'

const PAYMENT_MODE = String(import.meta.env.VITE_PAYMENT_MODE || 'manual').toLowerCase()

async function postPaymentEndpoint(endpoint, payload) {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Your session expired. Sign in again before paying.')
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Payment request failed with HTTP ${response.status}.`)
  return data
}

export async function createPaymentOrder({ orderId, amount, paymentId, provider = 'manual_upi', ...customer }) {
  if (PAYMENT_MODE === 'manual') {
    const transactionId = String(paymentId || '').trim()
    if (transactionId.length < 6) throw new Error('Enter a valid UPI transaction ID with at least 6 characters.')
    return { orderId, amount, paymentId: transactionId, paymentProvider: provider, paymentStatus: 'Pending', mode: 'manual' }
  }

  // Gateway secrets stay inside /api/create-payment and are never exposed here.
  return postPaymentEndpoint('/api/create-payment', { orderId, amount, ...customer })
}

export async function verifyPayment({ orderId, paymentId, provider = 'manual_upi' }) {
  if (PAYMENT_MODE === 'manual') {
    return { orderId, paymentId, paymentProvider: provider, verified: false, paymentStatus: 'Pending', requiresAdminReview: true }
  }

  // The backend must validate the provider signature before returning Paid.
  return postPaymentEndpoint('/api/verify-payment', { orderId, paymentId, provider })
}

export const paymentMode = PAYMENT_MODE
