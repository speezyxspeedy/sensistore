import { createClient } from '@supabase/supabase-js'

const SECRET_KEY_MESSAGE = 'Use Supabase Publishable/Public Key instead of Secret Key.'
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function validateUrl(value) {
  const candidate = String(value || '').trim()
  if (!candidate) return { error: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.' }

  try {
    const parsed = new URL(candidate)
    const isRootUrl = parsed.pathname === '/' && !parsed.search && !parsed.hash
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || !isRootUrl) {
      throw new Error('Invalid Supabase URL')
    }
    return { value: parsed.origin }
  } catch {
    return { error: 'VITE_SUPABASE_URL must be a valid HTTPS project URL.' }
  }
}

function readLegacyJwtRole(key) {
  const parts = key.split('.')
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))
    return typeof payload.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}

function validateAnonKey(value) {
  const candidate = String(value || '').trim()
  if (!candidate) return { error: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.' }
  if (candidate.toLowerCase().startsWith('sb_secret_')) return { error: SECRET_KEY_MESSAGE, type: 'secret' }
  if (candidate.startsWith('sb_publishable_') && candidate.length > 'sb_publishable_'.length) {
    return { value: candidate, type: 'publishable' }
  }

  const legacyRole = readLegacyJwtRole(candidate)
  if (legacyRole === 'anon') return { value: candidate, type: 'legacy-anon' }
  if (legacyRole === 'service_role' || legacyRole === 'supabase_admin') {
    return { error: SECRET_KEY_MESSAGE, type: 'secret' }
  }
  return { error: 'VITE_SUPABASE_ANON_KEY must be a Supabase Publishable/Public or legacy anon key.', type: 'invalid' }
}

const urlValidation = validateUrl(rawSupabaseUrl)
const keyValidation = validateAnonKey(rawSupabaseAnonKey)
const supabaseUrl = urlValidation.value
const supabaseAnonKey = keyValidation.value

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabaseConfigurationMessage = urlValidation.error || keyValidation.error || ''

if (import.meta.env.DEV) {
  console.info('[Supabase] configuration check', {
    urlValid: Boolean(supabaseUrl),
    anonKeyValid: Boolean(supabaseAnonKey),
    anonKeyType: keyValidation.type || 'missing',
  })
}

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) throw new Error(supabaseConfigurationMessage)
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
)
