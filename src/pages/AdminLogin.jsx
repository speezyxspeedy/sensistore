import { AlertTriangle, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/auth-context'
import { firebaseConfigurationMessage, getFirebaseErrorDetails, isFirebaseConfigured } from '../firebase'
import { ADMIN_EMAIL, isAdmin } from '../utils/adminAuth'

export default function AdminLogin() {
  const [form, setForm] = useState({ email: ADMIN_EMAIL, password: '' })
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState(null)
  const { user, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAdmin(user)) navigate('/admin', { replace: true })
  }, [user, navigate])

  const submit = async (event) => {
    event.preventDefault()
    setAuthError(null)
    if (!isFirebaseConfigured) {
      setAuthError({ code: 'firebase/missing-environment', friendly: firebaseConfigurationMessage, technical: 'Configure the host environment and redeploy.' })
      return
    }
    if (form.email.trim().toLowerCase() !== ADMIN_EMAIL) return toast.error('This email is not authorized for admin access.')
    setLoading(true)
    try {
      const authenticatedUser = await login(form.email, form.password)
      if (!isAdmin(authenticatedUser)) throw Object.assign(new Error('The signed-in Firebase user is not the configured administrator.'), { code: 'auth/unauthorized-admin' })
      toast.success('Admin access verified.')
      navigate('/admin', { replace: true })
    } catch (error) {
      console.error('Firebase admin login error:', error)
      const details = getFirebaseErrorDetails(error)
      setAuthError(details)
      toast.error(details.friendly)
    } finally {
      setLoading(false)
    }
  }

  return <section className="container-shell grid min-h-[calc(100vh-160px)] place-items-center py-14"><form onSubmit={submit} className="glass-panel w-full max-w-md rounded-3xl p-7 shadow-violet sm:p-10"><div className="grid size-12 place-items-center rounded-xl border border-lime/20 bg-lime/10 text-lime"><LockKeyhole size={23} /></div><p className="mt-6 text-[10px] font-bold uppercase tracking-[.22em] text-lime">Restricted area</p><h1 className="mt-2 font-display text-4xl font-bold uppercase text-white">Admin login</h1><p className="mt-2 text-sm leading-6 text-slate-500">Sign in with the authorized Firebase administrator account.</p>{authError && <div role="alert" className="mt-5 rounded-xl border border-red-400/25 bg-red-400/[0.07] p-4 text-xs leading-5 text-red-100"><p className="flex items-center gap-2 font-bold"><AlertTriangle size={14} /> {authError.friendly}</p><p className="mt-2 break-words font-mono text-[10px] text-red-200/65">{authError.code}: {authError.technical}</p></div>}<div className="mt-7 space-y-5"><div><label className="label">Admin email</label><input required type="email" autoComplete="username" className="input-field" value={form.email} readOnly /></div><div><label className="label">Password</label><input required minLength="6" type="password" autoComplete="current-password" className="input-field" placeholder="Enter admin password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div></div><button disabled={loading} className="btn-primary mt-7 w-full disabled:opacity-60">{loading ? 'Verifying…' : <><ShieldCheck size={16} /> Open dashboard</>}</button><p className="mt-4 text-center text-[10px] text-slate-700">Password verification is handled by Firebase Authentication.</p></form></section>
}
