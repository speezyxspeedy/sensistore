import { motion } from 'framer-motion'
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { LockKeyhole, LogIn, Mail, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/auth-context'
import { auth, isFirebaseConfigured } from '../firebase'
import { isAdmin } from '../utils/adminAuth'

export default function Account() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate(isAdmin(user) ? '/admin' : '/dashboard', { replace: true }) }, [user, navigate])

  const submit = async (event) => {
    event.preventDefault()
    if (!isFirebaseConfigured) return toast.error('Firebase is not configured yet.')
    setLoading(true)
    try {
      let authenticatedUser
      if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password)
        await updateProfile(result.user, { displayName: form.name.trim() })
        authenticatedUser = result.user
        toast.success('Account created successfully.')
      } else authenticatedUser = (await signInWithEmailAndPassword(auth, form.email.trim(), form.password)).user
      navigate(isAdmin(authenticatedUser) ? '/admin' : '/dashboard', { replace: true })
    } catch (error) {
      console.error(error)
      const messages = { 'auth/email-already-in-use': 'An account already exists with this email.', 'auth/invalid-credential': 'Incorrect email or password.', 'auth/weak-password': 'Use a password with at least 6 characters.' }
      toast.error(messages[error.code] || 'Could not continue. Please check your details.')
    } finally { setLoading(false) }
  }

  const resetPassword = async () => {
    if (!form.email.trim()) return toast.info('Enter your email address first.')
    try { await sendPasswordResetEmail(auth, form.email.trim()); toast.success('Password reset email sent.') }
    catch { toast.error('Could not send reset email.') }
  }

  return <section className="container-shell grid min-h-[calc(100vh-160px)] place-items-center py-14"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-white/[0.08] bg-panel/90 shadow-2xl md:grid-cols-[.9fr_1.1fr]">
    <div className="relative hidden overflow-hidden border-r border-white/[0.07] bg-gradient-to-br from-cyan-400/10 via-panel to-violet-500/15 p-10 md:flex md:flex-col md:justify-between"><div><span className="eyebrow">Player account</span><h1 className="mt-6 font-display text-5xl font-bold uppercase leading-none text-white">Your orders.<br /><span className="text-lime">Always in sight.</span></h1><p className="mt-5 text-sm leading-6 text-slate-400">Track every purchase from payment through delivery in one secure place.</p></div><LockKeyhole className="absolute -bottom-12 -right-12 size-56 text-white/[0.025]" /><p className="relative text-xs text-slate-600">Protected by Firebase Authentication</p></div>
    <form onSubmit={submit} className="p-7 sm:p-10"><div className="grid size-11 place-items-center rounded-xl bg-lime/10 text-lime">{mode === 'login' ? <LogIn size={21} /> : <UserPlus size={21} />}</div><h2 className="mt-6 font-display text-4xl font-bold uppercase text-white">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2><p className="mt-2 text-sm text-slate-500">{mode === 'login' ? 'Sign in to order and track delivery.' : 'Create your secure customer dashboard.'}</p>
      <div className="mt-7 space-y-5">{mode === 'register' && <div><label className="label">Full name</label><input required minLength="2" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></div>}<div><label className="label">Email address</label><input required type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></div><div><div className="flex justify-between"><label className="label">Password</label>{mode === 'login' && <button type="button" onClick={resetPassword} className="mb-2 text-[10px] font-bold uppercase tracking-wider text-lime">Forgot password?</button>}</div><input required minLength="6" type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" /></div></div>
      <button disabled={loading} className="btn-primary mt-7 w-full disabled:opacity-60">{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button><div className="mt-5 text-center text-xs text-slate-500">{mode === 'login' ? 'New to Sensi Store?' : 'Already have an account?'} <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-bold text-lime">{mode === 'login' ? 'Create account' : 'Sign in'}</button></div><p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-slate-700"><Mail size={11} /> Your email is used for order delivery.</p>
    </form>
  </motion.div></section>
}
