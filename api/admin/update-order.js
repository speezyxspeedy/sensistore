import { FieldValue } from 'firebase-admin/firestore'
import { requireAdmin, adminDb } from '../_lib/firebaseAdmin.js'
import { sendDelivered } from '../_lib/email.js'
import { allowMethod, sendError, setSecurityHeaders } from '../_lib/http.js'

const paymentStatuses = ['Pending', 'Paid', 'Failed']
const orderStatuses = ['Pending', 'Processing', 'Delivered']

export default async function handler(request, response) {
  if (!allowMethod(request, response, 'POST')) return
  try {
    const admin = await requireAdmin(request)
    const orderId = String(request.body?.orderId || '')
    const paymentStatus = request.body?.paymentStatus
    const orderStatus = request.body?.orderStatus
    if (!/^[A-Za-z0-9_-]{6,100}$/.test(orderId)) throw badRequest('Invalid order ID.')
    if (paymentStatus === undefined && orderStatus === undefined) throw badRequest('No update was provided.')
    if (paymentStatus !== undefined && !paymentStatuses.includes(paymentStatus)) throw badRequest('Invalid payment status.')
    if (orderStatus !== undefined && !orderStatuses.includes(orderStatus)) throw badRequest('Invalid order status.')

    const reference = adminDb.doc(`orders/${orderId}`)
    const snapshot = await reference.get()
    if (!snapshot.exists) throw Object.assign(new Error('Order not found.'), { statusCode: 404 })
    const order = snapshot.data()
    const effectivePaymentStatus = paymentStatus || normalizePaymentStatus(order.paymentStatus)

    if (orderStatus === 'Delivered' && effectivePaymentStatus !== 'Paid') throw badRequest('An unpaid order cannot be marked Delivered.')
    if (orderStatus === 'Delivered' && order.orderStatus !== 'Delivered') {
      try { await sendDelivered({ ...order, orderId }) }
      catch (error) { console.error('Delivery email failed:', error); throw Object.assign(new Error('Delivery email failed, so the order was not marked Delivered.'), { statusCode: 502 }) }
    }

    await reference.update({
      updatedAt: FieldValue.serverTimestamp(), updatedByAdmin: admin.uid,
      ...(paymentStatus !== undefined ? { paymentStatus, paymentReviewedAt: FieldValue.serverTimestamp() } : {}),
      ...(orderStatus !== undefined ? { orderStatus } : {}),
      ...(orderStatus === 'Delivered' ? { deliveredAt: FieldValue.serverTimestamp(), deliveryEmailStatus: 'SENT' } : {}),
    })
    setSecurityHeaders(response)
    response.status(200).json({ success: true })
  } catch (error) { sendError(response, error) }
}

function normalizePaymentStatus(status) {
  const value = String(status || '').toUpperCase()
  if (['PAID', 'SUCCESS', 'COMPLETED'].includes(value)) return 'Paid'
  if (['FAILED', 'CANCELLED'].includes(value)) return 'Failed'
  return 'Pending'
}
function badRequest(message) { return Object.assign(new Error(message), { statusCode: 400 }) }
