import { assertSupabaseConfigured, supabase } from '../lib/supabase'
import { PLAN_AMOUNTS } from '../config/paymentConfig'

export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed']
export const ORDER_STATUSES = ['Pending', 'Processing', 'Delivered']

export function createOrderId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const suffix = globalThis.crypto?.randomUUID?.().replaceAll('-', '').slice(0, 8).toUpperCase()
    || Math.random().toString(36).slice(2, 10).toUpperCase()
  return `SS-${date}-${suffix}`
}

export async function createOrder({ user, form, plan, orderId = createOrderId() }) {
  assertSupabaseConfigured()
  if (!user?.email) throw new Error('Sign in before placing an order.')
  if (!plan?.id || !Object.prototype.hasOwnProperty.call(PLAN_AMOUNTS, plan.id)) throw new Error('Select a valid plan before submitting your order.')

  const requiredFields = [
    ['Full name', form.customerName],
    ['WhatsApp number', form.phone],
    ['Device name', form.deviceName],
    ['Device model', form.deviceModel],
    ['RAM', form.ram],
    ['Android version', form.androidVersion],
    ['Game name', form.gameName],
  ]
  const missingField = requiredFields.find(([, value]) => !String(value || '').trim())
  if (missingField) throw new Error(`${missingField[0]} is required.`)

  const transactionId = String(form.paymentId || '').trim()
  if (!/^[A-Za-z0-9._-]{6,80}$/.test(transactionId)) throw new Error('Enter a valid UTR / Transaction ID with 6 to 80 letters or numbers.')
  const customerEmail = user.email.trim().toLowerCase()

  const orderData = {
    order_id: orderId,
    email: customerEmail,
    user_email: customerEmail,
    customer_name: form.customerName.trim(),
    phone: form.phone.trim(),
    device_name: form.deviceName.trim(),
    device_model: form.deviceModel.trim(),
    ram: form.ram.trim(),
    android_version: form.androidVersion.trim(),
    game_name: form.gameName.trim(),
    plan: plan.id,
    amount: PLAN_AMOUNTS[plan.id],
    payment_id: transactionId,
    payment_status: 'Pending',
    order_status: 'Pending',
    created_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.schema('public').from('orders').insert(orderData).select('*').single()
  if (error) throw error
  if (!data) throw new Error('Supabase did not return the created order.')
  return normalizeOrder(data)
}

export async function getUserOrders(email) {
  assertSupabaseConfigured()
  if (!email?.trim()) throw new Error('A customer email is required to load orders.')
  const { data, error } = await supabase.schema('public').from('orders').select('*').eq('email', email.trim().toLowerCase()).order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizeOrder)
}

export async function getAllOrders() {
  assertSupabaseConfigured()
  const { data, error } = await supabase.schema('public').from('orders').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizeOrder)
}

export async function updateAdminOrder(id, changes) {
  assertSupabaseConfigured()
  const payload = { updated_at: new Date().toISOString() }
  if (changes.paymentStatus && PAYMENT_STATUSES.includes(changes.paymentStatus)) payload.payment_status = changes.paymentStatus
  if (changes.orderStatus && ORDER_STATUSES.includes(changes.orderStatus)) payload.order_status = changes.orderStatus
  if (Object.prototype.hasOwnProperty.call(changes, 'notes')) payload.notes = String(changes.notes || '').trim().slice(0, 2000)
  if (Object.keys(payload).length === 1) throw new Error('No valid order changes were provided.')
  const { data, error } = await supabase.schema('public').from('orders').update(payload).eq('id', id).select('*').single()
  if (error) throw error
  return normalizeOrder(data)
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

export function normalizeOrder(row) {
  const rawPlan = String(row.plan || '').trim().toLowerCase()
  const plan = ['normal', 'premium'].includes(rawPlan) ? rawPlan : ''
  const numericAmount = Number(row.amount)
  return {
    id: row.id,
    orderId: row.order_id || '',
    email: row.email || row.user_email || '',
    customerName: row.customer_name || '',
    phone: row.phone || '',
    deviceName: row.device_name || '',
    deviceModel: row.device_model || '',
    ram: row.ram || '',
    androidVersion: row.android_version || '',
    gameName: row.game_name || '',
    plan,
    planName: plan === 'premium' ? 'Premium Sensi' : plan === 'normal' ? 'Normal Sensi' : '',
    amount: row.amount !== null && row.amount !== undefined && Number.isFinite(numericAmount) ? numericAmount : null,
    paymentId: row.payment_id || '',
    paymentStatus: row.payment_status || '',
    orderStatus: row.order_status || '',
    notes: row.notes || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  }
}
