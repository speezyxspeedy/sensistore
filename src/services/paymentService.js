export async function createPaymentOrder({ orderId, amount, paymentId, provider = 'manual_upi' }) {
  const transactionId = String(paymentId || '').trim()
  if (transactionId.length < 6) throw new Error('Enter a valid UPI transaction ID with at least 6 characters.')
  return { orderId, amount, paymentId: transactionId, paymentProvider: provider, paymentStatus: 'Pending', mode: 'manual' }
}

export async function verifyPayment({ orderId, paymentId, provider = 'manual_upi' }) {
  return { orderId, paymentId, paymentProvider: provider, verified: false, paymentStatus: 'Pending', requiresAdminReview: true }
}

export const paymentMode = 'manual'
