import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const exposesSecretKey = supabaseAnonKey?.startsWith('sb_secret_')

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !exposesSecretKey)
export const supabaseConfigurationMessage = exposesSecretKey
  ? 'VITE_SUPABASE_ANON_KEY contains a secret key. Rotate it and use the Supabase publishable/anon key instead.'
  : !supabaseUrl || !supabaseAnonKey
    ? 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.'
    : ''

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) throw new Error(supabaseConfigurationMessage)
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey && !exposesSecretKey ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sensi-store-supabase-auth',
    },
  },
)
