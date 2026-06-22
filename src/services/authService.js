import { assertSupabaseConfigured, supabase } from '../lib/supabase'
import { ADMIN_EMAIL } from '../utils/adminAuth'

const SESSION_KEY = 'sensi_session'
const PROFILE_COLUMNS = 'id,name,email,phone,role,created_at'
const PASSWORD_ITERATIONS = 210_000

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function normalizeUser(profile) {
  if (!profile) return null
  const email = normalizeEmail(profile.email)
  const name = String(profile.name || '').trim()
  return {
    id: profile.id,
    uid: profile.id,
    name,
    displayName: name,
    email,
    phone: String(profile.phone || '').trim(),
    role: email === ADMIN_EMAIL ? 'admin' : profile.role || 'customer',
    createdAt: profile.created_at || profile.createdAt || new Date().toISOString(),
  }
}

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes))
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

async function derivePassword(password, salt, iterations = PASSWORD_ITERATIONS) {
  const material = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    256,
  )
  return new Uint8Array(bits)
}

async function hashPassword(password) {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivePassword(password, salt)
  return `pbkdf2$${PASSWORD_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`
}

async function verifyPassword(password, storedPassword) {
  if (storedPassword?.startsWith('pbkdf2$')) {
    const [, iterations, salt, expected] = storedPassword.split('$')
    if (!iterations || !salt || !expected) return false
    const actual = await derivePassword(password, base64ToBytes(salt), Number(iterations))
    return bytesToBase64(actual) === expected
  }
  if (storedPassword?.startsWith('sha256:')) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
    const actual = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    return `sha256:${actual}` === storedPassword
  }
  return storedPassword === password
}

function storeSession(user) {
  if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  else window.localStorage.removeItem(SESSION_KEY)
}

export async function registerUser({ name, email, phone, password }) {
  assertSupabaseConfigured()
  const cleanEmail = normalizeEmail(email)
  if (cleanEmail === ADMIN_EMAIL) throw new Error('This email is reserved for the administrator.')

  const { data, error } = await supabase
    .from('users')
    .insert({
      name: String(name || '').trim(),
      email: cleanEmail,
      phone: String(phone || '').trim(),
      password: await hashPassword(String(password || '')),
      role: 'customer',
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('An account with this email already exists.')
    throw error
  }
  const user = normalizeUser(data)
  storeSession(user)
  return user
}

export async function loginUser(email, password) {
  assertSupabaseConfigured()
  const cleanEmail = normalizeEmail(email)
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', cleanEmail)
    .single()

  if (error || !data || !(await verifyPassword(String(password || ''), data.password))) {
    throw new Error('Invalid email or password.')
  }
  const user = normalizeUser(data)
  storeSession(user)
  return user
}

export async function restoreSession() {
  return getCurrentUser()
}

export function getCurrentUser() {
  try {
    return normalizeUser(JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null'))
  } catch {
    return null
  }
}

export async function getUsers() {
  assertSupabaseConfigured()
  const { data, error } = await supabase.from('users').select(PROFILE_COLUMNS).order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizeUser)
}

export async function logoutUser() {
  storeSession(null)
}
