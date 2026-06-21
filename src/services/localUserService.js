// Compatibility layer for older imports. All storage is owned by authService.js.
import { getUsers, saveUser, USERS_CHANGED_EVENT, USERS_STORAGE_KEY } from './authService'

export const LOCAL_AUTH_USERS_KEY = USERS_STORAGE_KEY
export const LOCAL_AUTH_USERS_EVENT = USERS_CHANGED_EVENT
export const getLocalAuthUsers = getUsers

export function upsertLocalAuthUser(user, profile = {}) {
  return saveUser({
    id: user?.id || user?.uid,
    name: profile.name || user?.name || user?.displayName,
    email: user?.email,
    phone: profile.phone || user?.phone,
    createdAt: profile.createdAt || user?.createdAt || user?.metadata?.creationTime,
  })
}

export function updateLocalAuthUser(email, changes = {}) {
  const existing = getUsers().find((user) => user.email === String(email || '').trim().toLowerCase())
  return existing ? saveUser({ ...existing, ...changes, email: existing.email }) : null
}
