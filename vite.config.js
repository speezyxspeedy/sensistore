import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const ALLOWED_CLIENT_SUPABASE_VARIABLES = new Set(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'])
const SECRET_KEY_MESSAGE = 'Use Supabase Publishable/Public Key instead of Secret Key.'

function isSecretSupabaseKey(value) {
  const key = String(value || '').trim()
  if (key.toLowerCase().startsWith('sb_secret_')) return true

  try {
    const parts = key.split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return payload.role === 'service_role' || payload.role === 'supabase_admin'
  } catch {
    return false
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const unsupportedVariables = Object.keys(env).filter(
    (name) => name.startsWith('VITE_SUPABASE_') && !ALLOWED_CLIENT_SUPABASE_VARIABLES.has(name),
  )

  if (unsupportedVariables.length) {
    throw new Error(`Unsupported frontend Supabase variable(s): ${unsupportedVariables.join(', ')}.`)
  }
  if (isSecretSupabaseKey(env.VITE_SUPABASE_ANON_KEY)) throw new Error(SECRET_KEY_MESSAGE)

  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/framer-motion')) return 'motion'
            if (id.includes('node_modules/react')) return 'react-vendor'
          },
        },
      },
    },
  }
})
