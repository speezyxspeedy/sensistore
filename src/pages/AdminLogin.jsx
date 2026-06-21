import { signInWithEmailAndPassword } from 'firebase/auth'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { auth, isFirebaseConfigured } from '../firebase'
import { ADMIN_EMAIL, isAdmin } from '../utils/adminAuth'

export default function AdminLogin() {
  const [form, setForm] = useState({ email: ADMIN_EMAIL, password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const login = async (event) => {
    event.preventDefault()
    if (!isFirebaseConfigured) return toast.error('Firebase is not configured.')
    if (form.email.trim().toLowerCase() !== ADMIN_EMAIL) return toast.error('This email is not authorized for admin access.')
    setLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, form.email.trim(), form.password)
      if (!isAdmin(credential.user)) { navigate('/dashboard', { replace: true }); return }
      toast.success('Admin access verified.')
      navigate('/admin', { replace: true })
    } catch (error) {
      console.error(error)
      toast.error('Invalid admin email or password.')
    } finally { setLoading(false) }
  }

  return <section className="container-shell grid min-h-[calc(100vh-160px)] place-items-center py-14"><form onSubmit={login} className="glass-panel w-full max-w-md rounded-3xl p-7 shadow-violet sm:p-10"><div className="grid size-12 place-items-center rounded-xl border border-lime/20 bg-lime/10 text-lime"><LockKeyhole size={23} /></div><p className="mt-6 text-[10px] font-bold uppercase tracking-[.22em] text-lime">Restricted area</p><h1 className="mt-2 font-display text-4xl font-bold uppercase text-white">Admin login</h1><p className="mt-2 text-sm leading-6 text-slate-500">Sign in with the authorized Firebase administrator account.</p><div className="mt-7 space-y-5"><div><label className="label">Admin email</label><input required type="email" autoComplete="username" className="input-field" value={form.email} readOnly /></div><div><label className="label">Password</label><input required minLength="6" type="password" autoComplete="current-password" className="input-field" placeholder="Enter admin password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div></div><button disabled={loading} className="btn-primary mt-7 w-full disabled:opacity-60">{loading ? 'Verifying…' : <><ShieldCheck size={16} /> Open dashboard</>}</button><p className="mt-4 text-center text-[10px] text-slate-700">Password verification is handled by Firebase Authentication.</p></form></section>
}
