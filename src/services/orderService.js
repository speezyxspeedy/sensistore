import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../firebase'

export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed']
export const ORDER_STATUSES = ['Pending', 'Processing', 'Delivered']

function safeFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(-80)
}

export function createOrderId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const suffix = globalThis.crypto?.randomUUID?.().replaceAll('-', '').slice(0, 8).toUpperCase()
    || Math.random().toString(36).slice(2, 10).toUpperCase()
  return `SS-${date}-${suffix}`
}

export async function uploadOrderScreenshots({ uid, orderId, hudScreenshot, sensiScreenshot }) {
  const folder = `order-uploads/${uid}/${orderId}`
  const [hudUpload, sensiUpload] = await Promise.all([
    uploadBytes(ref(storage, `${folder}/hud-${safeFileName(hudScreenshot.name)}`), hudScreenshot, { contentType: hudScreenshot.type, customMetadata: { ownerId: uid, orderId } }),
    uploadBytes(ref(storage, `${folder}/sensitivity-${safeFileName(sensiScreenshot.name)}`), sensiScreenshot, { contentType: sensiScreenshot.type, customMetadata: { ownerId: uid, orderId } }),
  ])
  const [hudScreenshotUrl, sensiScreenshotUrl] = await Promise.all([
    getDownloadURL(hudUpload.ref),
    getDownloadURL(sensiUpload.ref),
  ])
  return { hudScreenshotUrl, sensiScreenshotUrl }
}

export async function createOrder({ user, form, plan, payment, hudScreenshot, sensiScreenshot, orderId = createOrderId() }) {
  if (!user?.uid) throw new Error('Sign in before placing an order.')
  const screenshots = await uploadOrderScreenshots({ uid: user.uid, orderId, hudScreenshot, sensiScreenshot })
  const order = {
    orderId,
    uid: user.uid,
    customerName: form.customerName.trim(),
    email: user.email.trim(),
    phone: form.phone.trim(),
    deviceName: form.deviceName.trim(),
    deviceModel: form.deviceModel.trim(),
    ram: form.ram.trim(),
    androidVersion: form.androidVersion.trim(),
    gameName: form.gameName.trim(),
    plan: plan.id,
    amount: Number(plan.price),
    paymentProvider: payment.paymentProvider || 'manual_upi',
    paymentId: payment.paymentId.trim(),
    paymentStatus: 'Pending',
    orderStatus: 'Pending',
    hudScreenshotUrl: screenshots.hudScreenshotUrl,
    sensiScreenshotUrl: screenshots.sensiScreenshotUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(doc(db, 'orders', orderId), order)
  return { ...order, createdAt: new Date(), updatedAt: new Date() }
}

export function subscribeToUserOrders(uid, onOrders, onError) {
  const customerOrders = query(collection(db, 'orders'), where('uid', '==', uid))
  return onSnapshot(customerOrders, (snapshot) => {
    const orders = snapshot.docs.map((item) => normalizeOrder(item.id, item.data()))
      .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt))
    onOrders(orders)
  }, onError)
}

export function subscribeToOrders(onOrders, onError) {
  const allOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
  return onSnapshot(allOrders, (snapshot) => {
    onOrders(snapshot.docs.map((item) => normalizeOrder(item.id, item.data())))
  }, onError)
}

export async function updateAdminOrder(orderId, changes) {
  const allowed = {}
  if (changes.paymentStatus && PAYMENT_STATUSES.includes(changes.paymentStatus)) allowed.paymentStatus = changes.paymentStatus
  if (changes.orderStatus && ORDER_STATUSES.includes(changes.orderStatus)) allowed.orderStatus = changes.orderStatus
  if (!Object.keys(allowed).length) throw new Error('No valid order changes were provided.')
  await updateDoc(doc(db, 'orders', orderId), { ...allowed, updatedAt: serverTimestamp() })
  return { orderId, ...allowed }
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

export function getDeliveryMessage(order) {
  if (order.orderStatus === 'Delivered') return 'Your custom sensitivity setup has been delivered. Check your registered email and WhatsApp.'
  if (order.orderStatus === 'Processing') return 'Your payment is verified and your custom sensitivity setup is being prepared.'
  if (order.paymentStatus === 'Failed') return 'Payment verification failed. Contact support with your order ID and UPI transaction ID.'
  if (order.paymentStatus === 'Paid') return 'Payment verified. Your order will move to processing shortly.'
  return 'UPI payment submitted. An admin will verify the transaction before processing your order.'
}

function normalizeOrder(id, data) {
  const plan = String(data.plan || '').toLowerCase()
  return {
    id,
    ...data,
    orderId: data.orderId || id,
    uid: data.uid || data.userId || '',
    customerName: data.customerName || data.name || 'Unknown customer',
    phone: data.phone || data.whatsapp || '',
    plan,
    planName: data.planName || (plan === 'premium' ? 'Premium Sensi' : 'Normal Sensi'),
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

function timestampMillis(value) {
  if (value?.toMillis) return value.toMillis()
  if (value instanceof Date) return value.getTime()
  return 0
}
