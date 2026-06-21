import { requireUser, adminDb } from '../_lib/firebaseAdmin.js'
import { allowMethod, sendError, setSecurityHeaders } from '../_lib/http.js'

export default async function handler(request, response) {
  if (!allowMethod(request, response, 'GET')) return
  try {
    const user = await requireUser(request)
    const orderId = String(request.query.orderId || '').slice(0, 80)
    if (!orderId) throw Object.assign(new Error('Order ID is required.'), { statusCode: 400 })
    const [order, session] = await Promise.all([adminDb.doc(`orders/${orderId}`).get(), adminDb.doc(`paymentSessions/${orderId}`).get()])
    const data = order.exists ? order.data() : session.data()
    if (!data || data.userId !== user.uid) throw Object.assign(new Error('Order not found.'), { statusCode: 404 })
    const rawStatus = String(data.paymentStatus || '').toUpperCase()
    const status = order.exists && rawStatus === 'PAID'
      ? 'SUCCESS'
      : ['FAILED', 'CANCELLED', 'INITIATION_FAILED'].includes(rawStatus) ? 'FAILED' : 'PENDING'
    setSecurityHeaders(response); response.status(200).json({ orderId, status })
  } catch (error) { sendError(response, error) }
}
