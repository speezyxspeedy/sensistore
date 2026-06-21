import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const env = import.meta.env

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: env.VITE_FIREBASE_APP_ID?.trim(),
}

const firebaseEnvKeys = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
}

export const missingFirebaseEnvVars = Object.entries(firebaseEnvKeys)
  .filter(([configKey]) => !firebaseConfig[configKey])
  .map(([, envKey]) => envKey)

export const isFirebaseConfigured = missingFirebaseEnvVars.length === 0
export const firebaseConfigurationMessage = isFirebaseConfigured
  ? ''
  : `Missing Firebase environment variables: ${missingFirebaseEnvVars.join(', ')}`

// A complete VITE_FIREBASE_* configuration is used unchanged. The placeholders only
// keep the React tree renderable long enough to show a precise configuration error.
const safeConfig = {
  apiKey: firebaseConfig.apiKey || 'missing-api-key',
  authDomain: firebaseConfig.authDomain || 'missing.firebaseapp.com',
  projectId: firebaseConfig.projectId || 'missing-project',
  storageBucket: firebaseConfig.storageBucket || 'missing-project.appspot.com',
  messagingSenderId: firebaseConfig.messagingSenderId || '0',
  appId: firebaseConfig.appId || 'missing-app-id',
}

export const app = getApps().length ? getApp() : initializeApp(safeConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

const friendlyAuthErrors = {
  'auth/operation-not-allowed': 'Email/password sign-in is disabled. Enable it in Firebase Console > Authentication > Sign-in method.',
  'auth/configuration-not-found': 'Firebase Authentication is not initialized for this project. Open Firebase Console and enable Authentication.',
  'auth/invalid-api-key': 'The Firebase API key is invalid. Check VITE_FIREBASE_API_KEY in this deployment environment and redeploy.',
  'auth/unauthorized-domain': 'This hostname is not authorized. Add it in Firebase Console > Authentication > Settings > Authorized domains.',
  'auth/email-already-in-use': 'An account already exists with this email address.',
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/user-not-found': 'No account exists with this email address.',
  'auth/wrong-password': 'The email or password is incorrect.',
  'auth/weak-password': 'Use a password with at least 6 characters.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/network-request-failed': 'Firebase could not be reached. Check the connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment before trying again.',
}

export function getFirebaseErrorDetails(error) {
  const code = error?.code || 'firebase/unknown-error'
  const technical = error?.message || String(error || 'Unknown Firebase error')
  const friendly = friendlyAuthErrors[code] || 'Firebase could not complete this request.'
  return { code, friendly, technical, display: `${friendly} ${code}: ${technical}` }
}
