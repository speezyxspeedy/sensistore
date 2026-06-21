import crypto from 'node:crypto'

function configuration() {
  const values = { merchantId: process.env.BHARATPE_MERCHANT_ID, apiKey: process.env.BHARATPE_API_KEY, createUrl: process.env.BHARATPE_CREATE_PAYMENT_URL, statusUrl: process.env.BHARATPE_PAYMENT_STATUS_URL, webhookSecret: process.env.BHARATPE_WEBHOOK_SECRET }
  if (Object.values(values).some((value) => !value)) throw Object.assign(new Error('BharatPe is not configured. Complete merchant onboarding and add the gateway credentials.'), { statusCode: 503 })
  return values
}

async function gatewayRequest(url, payload) {
  const config = configuration()
  const body = JSON.stringify(payload)
  const signature = crypto.createHmac('sha256', process.env.BHARATPE_REQUEST_SECRET || config.apiKey).update(body).digest('hex')
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey, 'x-merchant-id': config.merchantId, 'x-signature': signature }, body, signal: AbortSignal.timeout(15000) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw Object.assign(new Error(data.message || 'BharatPe rejected the request.'), { statusCode: 502 })
  return data
}

export async function createBharatPePayment({ orderId, amount, customer, returnUrl, webhookUrl }) {
  const config = configuration()
  const data = await gatewayRequest(config.createUrl, {
    merchantId: config.merchantId, merchantTransactionId: orderId,
    amount: process.env.BHARATPE_AMOUNT_UNIT === 'paise' ? amount * 100 : amount,
    currency: 'INR', customer: { name: customer.name, email: customer.email, phone: customer.phone },
    returnUrl, callbackUrl: webhookUrl,
  })
  const paymentUrl = data.paymentUrl || data.redirectUrl || data.data?.paymentUrl || data.data?.redirectUrl
  if (!paymentUrl || !/^https:\/\//.test(paymentUrl)) throw Object.assign(new Error('BharatPe did not return a valid payment URL.'), { statusCode: 502 })
  return { paymentUrl, gatewayPaymentId: data.paymentId || data.transactionId || data.data?.paymentId || null }
}

export async function getBharatPePayment(orderId) {
  const config = configuration()
  const data = await gatewayRequest(config.statusUrl, { merchantId: config.merchantId, merchantTransactionId: orderId })
  const payment = data.data || data
  return { status: String(payment.status || payment.paymentStatus || '').toUpperCase(), paymentId: payment.paymentId || payment.transactionId, amount: Number(payment.amount) }
}

export function verifyBharatPeWebhook(rawBody, signature) {
  const { webhookSecret } = configuration()
  if (!signature) return false
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
  const received = String(signature).replace(/^sha256=/, '')
  return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))
}
