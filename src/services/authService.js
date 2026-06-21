import { ADMIN_EMAIL } from '../utils/adminAuth'
import { auth } from '../firebase'

export const USERS_STORAGE_KEY = 'sensi_users'
export const USERS_CHANGED_EVENT = 'sensi-users-changed'

const LEGACY_USER_KEYS = [
  'users',
  'registeredUsers',
  'authUsers',
  'sensiStoreUsers',
  'sensiStoreAuthUsers',
]

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function readUsersFromKey(key) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : Array.isArray(parsed?.users) ? parsed.users : []
  } catch {
    return []
  }
}

function normalizeUser(user) {
  const email = normalizeEmail(user?.email)
  if (!email || email === ADMIN_EMAIL || String(user?.role || '').toLowerCase() === 'admin') return null
  return {
    id: String(user.id || user.uid || email),
    name: String(user.name || user.displayName || '').trim(),
    email,
    phone: String(user.phone || user.whatsapp || '').trim(),
    // Firebase owns password verification. Never persist a plaintext password.
    password: '',
    role: 'customer',
    createdAt: user.createdAt || user.joinedAt || new Date().toISOString(),
  }
}

function mergeUser(existing, incoming) {
  if (!existing) return incoming
  return {
    id: incoming.id || existing.id,
    name: incoming.name || existing.name,
    email: incoming.email,
    phone: incoming.phone || existing.phone,
    password: '',
    role: 'customer',
    createdAt: existing.createdAt || incoming.createdAt,
  }
}

function migrateUsers() {
  if (typeof window === 'undefined') return []
  const usersByEmail = new Map()
  for (const key of [...LEGACY_USER_KEYS, USERS_STORAGE_KEY]) {
    for (const rawUser of readUsersFromKey(key)) {
      const user = normalizeUser(rawUser)
      if (user) usersByEmail.set(user.email, mergeUser(usersByEmail.get(user.email), user))
    }
  }
  const users = [...usersByEmail.values()]
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  LEGACY_USER_KEYS.forEach((key) => window.localStorage.removeItem(key))
  return users
}

export function getUsers() {
  if (typeof window === 'undefined') return []
  migrateUsers()
  const users = JSON.parse(localStorage.getItem("sensi_users") || "[]")
  console.log("sensi_users", localStorage.getItem("sensi_users"))
  console.log("loaded users", users)
  return Array.isArray(users) ? users.filter((user) => user.role !== 'admin' && normalizeEmail(user.email) !== ADMIN_EMAIL) : []
}

export function saveUser(user) {
  if (typeof window === 'undefined') return null
  const normalizedUser = normalizeUser(user)
  if (!normalizedUser) return null
  const users = getUsers()
  const existing = users.find((item) => item.email === normalizedUser.email)
  const savedUser = mergeUser(existing, normalizedUser)
  const nextUsers = existing
    ? users.map((item) => item.email === savedUser.email ? savedUser : item)
    : [...users, savedUser]
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers))
  window.dispatchEvent(new CustomEvent(USERS_CHANGED_EVENT))
  return savedUser
}

export function registerUser(user) {
  return saveUser({
    ...user,
    role: 'customer',
    password: '',
    createdAt: user.createdAt || new Date().toISOString(),
  })
}

export function getCurrentUser() {
  const firebaseUser = auth.currentUser
  if (!firebaseUser?.email) return null
  return getUsers().find((user) => user.email === normalizeEmail(firebaseUser.email)) || firebaseUser
}
