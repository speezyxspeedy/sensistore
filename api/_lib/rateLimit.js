import crypto from 'node:crypto'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from './firebaseAdmin.js'

export async function rateLimit(key, { limit = 5, windowSeconds = 600 } = {}) {
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  const reference = adminDb.doc(`rateLimits/${hash}`)
  const now = Date.now()
  const allowed = await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference)
    const data = snapshot.data()
    const windowStartedAt = data?.windowStartedAt?.toMillis?.() || 0
    if (!data || now - windowStartedAt >= windowSeconds * 1000) {
      transaction.set(reference, { count: 1, windowStartedAt: Timestamp.fromMillis(now), expiresAt: Timestamp.fromMillis(now + (windowSeconds * 2 * 1000)) })
      return true
    }
    if (data.count >= limit) return false
    transaction.update(reference, { count: data.count + 1 })
    return true
  })
  if (!allowed) throw Object.assign(new Error('Too many requests. Please wait and try again.'), { statusCode: 429 })
}
