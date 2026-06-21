import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function serviceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
}

if (!getApps().length) initializeApp({ credential: cert(serviceAccount()), storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET })

export const adminAuth = getAuth()
export const adminDb = getFirestore()
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'bglspeedy@gmail.com').toLowerCase()

export async function requireUser(request) {
  const authorization = request.headers.authorization || ''
  if (!authorization.startsWith('Bearer ')) throw Object.assign(new Error('Authentication required.'), { statusCode: 401 })
  try { return await adminAuth.verifyIdToken(authorization.slice(7)) }
  catch { throw Object.assign(new Error('Invalid or expired session.'), { statusCode: 401 }) }
}

export async function requireAdmin(request) {
  const user = await requireUser(request)
  if (user.email?.toLowerCase() !== ADMIN_EMAIL) throw Object.assign(new Error('Admin access required.'), { statusCode: 403 })
  return user
}
