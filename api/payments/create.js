import crypto from 'node:crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { createBharatPePayment } from '../_lib/bharatpe.js'
import { requireUser, adminDb } from '../_lib/firebaseAdmin.js'
import { allowMethod, sendError, setSecurityHeaders } from '../_lib/http.js'
import { rateLimit } from '../_lib/rateLimit.js'
import { validateOrder } from '../_lib/validation.js'

export default async function handler(request, response) {
  if (!allowMethod(request, response, 'POST')) return
  try {
    const user = await requireUser(request)
    await rateLimit(`payment:${user.uid}`, { limit: 5, windowSeconds: 600 })
    const order = validateOrder(request.body, user)
    const orderId = `SS-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    const appUrl = process.env.APP_URL?.replace(/\/$/, '')
    if (!appUrl?.startsWith('https://') && process.env.NODE_ENV === 'production') throw Object.assign(new Error('APP_URL must be configured with HTTPS.'), { statusCode: 503 })
    const reference = adminDb.doc(`paymentSessions/${orderId}`)
    await reference.create({ ...order, orderId, paymentStatus: 'PENDING', createdAt: FieldValue.serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + 30 * 60 * 1000) })
    try {
      const gateway = await createBharatPePayment({ orderId, amount: order.amount, customer: { name: order.customerName, email: order.email, phone: order.phone }, returnUrl: `${appUrl}/payment/return?orderId=${encodeURIComponent(orderId)}`, webhookUrl: `${appUrl}/api/payments/webhook` })
      const batch = adminDb.batch()
      batch.update(reference, { gatewayPaymentId: gateway.gatewayPaymentId, updatedAt: FieldValue.serverTimestamp() })
      batch.create(adminDb.doc(`orders/${orderId}`), { ...order, orderId, paymentId: gateway.gatewayPaymentId || null, paymentStatus: 'Pending', orderStatus: 'Pending', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
      await batch.commit()
      setSecurityHeaders(response); return response.status(200).json({ orderId, paymentUrl: gateway.paymentUrl })
    } catch (error) { await reference.update({ paymentStatus: 'INITIATION_FAILED', updatedAt: FieldValue.serverTimestamp() }); throw error }
  } catch (error) { sendError(response, error) }
}
