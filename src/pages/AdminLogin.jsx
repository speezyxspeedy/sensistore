import { AlertTriangle, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/auth-context'
import { isSupabaseConfigured, supabaseConfigurationMessage } from '../lib/supabase'
import { ADMIN_EMAIL, isAdmin } from '../utils/adminAuth'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (isAdmin(user)) navigate('/admin', { replace: true }) }, [user, navigate])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) return setError(supabaseConfigurationMessage)
    setLoading(true)
    try {
      const authenticatedUser = await login(ADMIN_EMAIL, password)
      if (!isAdmin(authenticatedUser)) throw new Error('This Supabase account is not authorized as administrator.')
      toast.success('Admin access verified.')
      navigate('/admin', { replace: true })
    } catch (authError) {
      setError(authError.message)
      toast.error(authError.message)
    } finally { setLoading(false) }
  }

  return <section className="container-shell grid min-h-[calc(100vh-160px)] place-items-center py-14"><form onSubmit={submit} className="glass-panel w-full max-w-md rounded-3xl p-7 shadow-violet sm:p-10"><div className="grid size-12 place-items-center rounded-xl border border-lime/20 bg-lime/10 text-lime"><LockKeyhole size={23} /></div><p className="mt-6 text-[10px] font-bold uppercase tracking-[.22em] text-lime">Restricted area</p><h1 className="mt-2 font-display text-4xl font-bold uppercase text-white">Admin login</h1><p className="mt-2 text-sm leading-6 text-slate-500">Sign in with the authorized store admin account.</p>{error && <div className="mt-5 flex gap-2 rounded-xl border border-red-400/25 bg-red-400/[0.07] p-4 text-xs text-red-100"><AlertTriangle size={14} /> {error}</div>}<div className="mt-7 space-y-5"><div><label className="label">Admin email</label><input className="input-field" value={ADMIN_EMAIL} readOnly /></div><div><label className="label">Password</label><input required minLength="10" type="password" autoComplete="current-password" className="input-field" value={password} onChange={(event) => setPassword(event.target.value)} /></div></div><button disabled={loading} className="btn-primary mt-7 w-full disabled:opacity-60">{loading ? 'Verifying…' : <><ShieldCheck size={16} /> Open dashboard</>}</button></form></section>
}
