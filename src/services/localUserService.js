export const LOCAL_AUTH_USERS_KEY = 'sensiStoreAuthUsers'
export const LOCAL_AUTH_USERS_EVENT = 'sensi-store-auth-users-changed'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function normalizeUser(user) {
  const email = normalizeEmail(user?.email)
  if (!email) return null
  return {
    uid: String(user.uid || ''),
    name: String(user.name || user.displayName || '').trim(),
    email,
    phone: String(user.phone || '').trim(),
    joinedAt: user.joinedAt || user.createdAt || new Date().toISOString(),
  }
}

export function getLocalAuthUsers() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_AUTH_USERS_KEY) || '[]')
    const users = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.users) ? parsed.users : []
    const uniqueUsers = new Map()
    users.forEach((user) => {
      const normalized = normalizeUser(user)
      if (normalized) uniqueUsers.set(normalized.email, { ...uniqueUsers.get(normalized.email), ...normalized })
    })
    return [...uniqueUsers.values()]
  } catch {
    return []
  }
}

export function upsertLocalAuthUser(user, profile = {}) {
  if (typeof window === 'undefined' || !user?.email) return null
  const email = normalizeEmail(user.email)
  const users = getLocalAuthUsers()
  const existing = users.find((item) => item.email === email)
  const joinedAt = existing?.joinedAt
    || profile.joinedAt
    || user.metadata?.creationTime
    || new Date().toISOString()
  const nextUser = normalizeUser({
    ...existing,
    uid: user.uid || existing?.uid,
    name: profile.name || user.displayName || existing?.name,
    email,
    phone: profile.phone || existing?.phone,
    joinedAt,
  })
  const nextUsers = existing
    ? users.map((item) => item.email === email ? nextUser : item)
    : [...users, nextUser]
  window.localStorage.setItem(LOCAL_AUTH_USERS_KEY, JSON.stringify(nextUsers))
  window.dispatchEvent(new CustomEvent(LOCAL_AUTH_USERS_EVENT))
  return nextUser
}

export function updateLocalAuthUser(email, changes) {
  if (typeof window === 'undefined') return
  const normalizedEmail = normalizeEmail(email)
  const users = getLocalAuthUsers()
  const existing = users.find((user) => user.email === normalizedEmail)
  if (!existing) return
  const nextUsers = users.map((user) => user.email === normalizedEmail
    ? normalizeUser({ ...user, ...changes, email: normalizedEmail })
    : user)
  window.localStorage.setItem(LOCAL_AUTH_USERS_KEY, JSON.stringify(nextUsers))
  window.dispatchEvent(new CustomEvent(LOCAL_AUTH_USERS_EVENT))
}
