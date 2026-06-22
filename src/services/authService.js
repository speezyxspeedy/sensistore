import { assertSupabaseConfigured, supabase } from '../lib/supabase'
import { ADMIN_EMAIL } from '../utils/adminAuth'

const SESSION_KEY = 'sensi_session'
const PROFILE_COLUMNS = 'id,name,email,phone,role,created_at'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function normalizeUser(profile, authUser) {
  const email = normalizeEmail(profile?.email || authUser?.email)
  const name = profile?.name || authUser?.user_metadata?.name || ''
  return {
    id: profile?.id || authUser?.id,
    uid: profile?.id || authUser?.id,
    name,
    displayName: name,
    email,
    phone: profile?.phone || authUser?.user_metadata?.phone || '',
    role: email === ADMIN_EMAIL ? 'admin' : profile?.role || 'customer',
    createdAt: profile?.created_at || authUser?.created_at || new Date().toISOString(),
  }
}

function storeSession(user) {
  if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  else window.localStorage.removeItem(SESSION_KEY)
}

async function fetchProfile(authUser) {
  const { data, error } = await supabase.from('users').select(PROFILE_COLUMNS).eq('id', authUser.id).maybeSingle()
  if (error) throw error
  return data
}

async function createProfile(authUser, input = {}) {
  const email = normalizeEmail(authUser.email || input.email)
  const payload = {
    id: authUser.id,
    name: String(input.name || authUser.user_metadata?.name || '').trim(),
    email,
    phone: String(input.phone || authUser.user_metadata?.phone || '').trim(),
    role: email === ADMIN_EMAIL ? 'admin' : 'customer',
  }
  const { data, error } = await supabase.from('users').insert(payload).select(PROFILE_COLUMNS).single()
  if (error) throw error
  return data
}

export async function registerUser({ name, email, phone, password }) {
  assertSupabaseConfigured()
  const cleanEmail = normalizeEmail(email)
  if (cleanEmail === ADMIN_EMAIL) throw new Error('The admin email cannot be registered as a customer.')
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: { data: { name: name.trim(), phone: phone.trim(), role: 'customer' } },
  })
  if (error) throw error
  if (!data.user) throw new Error('Supabase did not create the user account.')
  const fallback = normalizeUser(null, data.user)
  if (!data.session) return { ...fallback, emailConfirmationRequired: true }
  const profile = await fetchProfile(data.user) || await createProfile(data.user, { name, email: cleanEmail, phone })
  const user = normalizeUser(profile, data.user)
  storeSession(user)
  return user
}

export async function loginUser(email, password) {
  assertSupabaseConfigured()
  const { data, error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password })
  if (error) throw error
  const profile = await fetchProfile(data.user)
  if (!profile) {
    await supabase.auth.signOut()
    throw new Error('No Sensi Store user profile was found. Run supabase/schema.sql and try again.')
  }
  const user = normalizeUser(profile, data.user)
  storeSession(user)
  return user
}

export async function restoreSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.user) {
    storeSession(null)
    return null
  }
  const profile = await fetchProfile(data.session.user)
  if (!profile) {
    await supabase.auth.signOut()
    storeSession(null)
    return null
  }
  const user = normalizeUser(profile, data.session.user)
  storeSession(user)
  return user
}

export function getCurrentUser() {
  try { return JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null') }
  catch { return null }
}

export async function getUsers() {
  assertSupabaseConfigured()
  const { data, error } = await supabase.from('users').select(PROFILE_COLUMNS).order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((profile) => normalizeUser(profile))
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  storeSession(null)
  if (error) throw error
}

export async function sendPasswordReset(email) {
  assertSupabaseConfigured()
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), { redirectTo: `${window.location.origin}/account` })
  if (error) throw error
}
