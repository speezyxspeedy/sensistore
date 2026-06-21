import { FieldValue } from 'firebase-admin/firestore'
import { getBharatPePayment, verifyBharatPeWebhook } from '../_lib/bharatpe.js'
import { adminDb } from '../_lib/firebaseAdmin.js'
import { sendConfirmation } from '../_lib/email.js'
import { sendError, setSecurityHeaders } from '../_lib/http.js'

export const config = { api: { bodyParser: false } }

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).end()
  try {
    const rawBody = await readBody(request)
    const signature = request.headers['x-bharatpe-signature'] || request.headers['x-webhook-signature']
    if (!verifyBharatPeWebhook(rawBody, signature)) throw Object.assign(new Error('Invalid webhook signature.'), { statusCode: 401 })
    const payload = JSON.parse(rawBody)
    const orderId = String(payload.merchantTransactionId || payload.orderId || payload.data?.merchantTransactionId || '')
    if (!orderId) throw Object.assign(new Error('Missing order ID.'), { statusCode: 400 })
    const gateway = await getBharatPePayment(orderId)
    if (!['SUCCESS', 'PAID', 'COMPLETED'].includes(gateway.status)) {
      const batch = adminDb.batch()
      batch.update(adminDb.doc(`paymentSessions/${orderId}`), { paymentStatus: gateway.status || 'FAILED', updatedAt: FieldValue.serverTimestamp() })
      const failedOrder = adminDb.doc(`orders/${orderId}`)
      if ((await failedOrder.get()).exists) batch.update(failedOrder, { paymentStatus: 'Failed', paymentId: gateway.paymentId || null, updatedAt: FieldValue.serverTimestamp() })
      await batch.commit()
      return response.status(200).json({ received: true })
    }
    const sessionRef = adminDb.doc(`paymentSessions/${orderId}`)
    const orderRef = adminDb.doc(`orders/${orderId}`)
    const created = await adminDb.runTransaction(async (transaction) => {
      const [session, existing] = await Promise.all([transaction.get(sessionRef), transaction.get(orderRef)])
      if (!session.exists) throw Object.assign(new Error('Payment session not found.'), { statusCode: 404 })
      if (existing.exists && ['Paid', 'PAID'].includes(existing.data().paymentStatus)) return false
      const data = session.data()
      const gatewayAmount = process.env.BHARATPE_AMOUNT_UNIT === 'paise' ? gateway.amount / 100 : gateway.amount
      if (Number(gatewayAmount) !== data.amount) throw Object.assign(new Error('Payment amount mismatch.'), { statusCode: 400 })
      const order = { ...data, paymentId: gateway.paymentId, paymentStatus: 'Paid', orderStatus: 'Pending', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }
      delete order.expiresAt
      transaction.set(orderRef, order, { merge: true })
      transaction.update(sessionRef, { paymentId: gateway.paymentId, paymentStatus: 'SUCCESS', updatedAt: FieldValue.serverTimestamp() })
      return true
    })
    const order = (await orderRef.get()).data()
    if (created || order.confirmationEmailStatus !== 'SENT') {
      try { await sendConfirmation(order); await orderRef.update({ confirmationEmailStatus: 'SENT', confirmationEmailSentAt: FieldValue.serverTimestamp() }) }
      catch (error) { console.error('Confirmation email failed:', error); await orderRef.update({ confirmationEmailStatus: 'FAILED' }) }
    }
    setSecurityHeaders(response); response.status(200).json({ received: true })
  } catch (error) { sendError(response, error) }
}

function readBody(request) { return new Promise((resolve, reject) => { let body = ''; request.on('data', (chunk) => { body += chunk; if (body.length > 1_000_000) reject(Object.assign(new Error('Payload too large.'), { statusCode: 413 })) }); request.on('end', () => resolve(body)); request.on('error', reject) }) }
