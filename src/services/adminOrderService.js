import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { getDownloadURL, ref } from 'firebase/storage'
import { auth, db, storage } from '../firebase'

export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed']
export const ORDER_STATUSES = ['Pending', 'Processing', 'Delivered']

export function subscribeToOrders(onOrders, onError) {
  const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
  return onSnapshot(ordersQuery, (snapshot) => {
    onOrders(snapshot.docs.map((snapshotDocument) => normalizeOrder(snapshotDocument.id, snapshotDocument.data())))
  }, onError)
}

export async function updateAdminOrder(orderId, changes) {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Admin session expired. Please sign in again.')
  const response = await fetch('/api/admin/update-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId, ...changes }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Order update failed.')
  return data
}

export async function resolveScreenshotUrl(value) {
  if (!value) return ''
  if (/^https:\/\//i.test(value)) return value
  return getDownloadURL(ref(storage, value))
}

export async function copyCustomerValue(value, label) {
  if (!value) throw new Error(`${label} is unavailable.`)
  await navigator.clipboard.writeText(value)
  return `${label} copied.`
}

function normalizeOrder(id, data) {
  return {
    id,
    ...data,
    orderId: data.orderId || id,
    customerName: data.customerName || data.name || 'Unknown customer',
    phone: data.phone || data.whatsapp || '',
    plan: String(data.plan || '').toLowerCase(),
    planName: data.planName || (String(data.plan).toLowerCase() === 'premium' ? 'Premium Sensi' : 'Normal Sensi'),
    paymentStatus: normalizePaymentStatus(data.paymentStatus),
    orderStatus: normalizeOrderStatus(data.orderStatus || data.status),
    hudScreenshotUrl: data.hudScreenshotUrl || data.hudScreenshot || '',
    sensiScreenshotUrl: data.sensiScreenshotUrl || data.sensiScreenshot || data.currentSensitivityUrl || '',
  }
}

function normalizePaymentStatus(status) {
  const value = String(status || '').toUpperCase()
  if (['PAID', 'SUCCESS', 'COMPLETED'].includes(value)) return 'Paid'
  if (['FAILED', 'CANCELLED', 'INITIATION_FAILED'].includes(value)) return 'Failed'
  return 'Pending'
}

function normalizeOrderStatus(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'delivered') return 'Delivered'
  if (value === 'processing') return 'Processing'
  return 'Pending'
}
