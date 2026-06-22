import { motion } from 'framer-motion'
import { AlertTriangle, Database, LockKeyhole, LogIn, Mail, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/auth-context'
import { isSupabaseConfigured, supabaseConfigurationMessage } from '../lib/supabase'
import { isAdmin } from '../utils/adminAuth'

export default function Account() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const { user, signup, login, resetPassword } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    const requestedPath = searchParams.get('redirect')
    navigate(isAdmin(user) ? '/admin' : requestedPath?.startsWith('/') ? requestedPath : '/dashboard', { replace: true })
  }, [user, navigate, searchParams])

  const submit = async (event) => {
    event.preventDefault()
    setAuthError('')
    if (!isSupabaseConfigured) return setAuthError(supabaseConfigurationMessage)
    setLoading(true)
    try {
      const authenticatedUser = mode === 'register'
        ? await signup(form)
        : await login(form.email, form.password)
      if (authenticatedUser.emailConfirmationRequired) {
        toast.success('Account created. Check your email to confirm the account, then sign in.')
        setMode('login')
        return
      }
      toast.success(mode === 'register' ? 'Account created successfully.' : 'Signed in successfully.')
      navigate(isAdmin(authenticatedUser) ? '/admin' : '/dashboard', { replace: true })
    } catch (error) {
      console.error('Supabase authentication error:', error)
      setAuthError(error.message || 'Authentication failed.')
      toast.error(error.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  const sendReset = async () => {
    if (!form.email.trim()) return toast.info('Enter your email address first.')
    try {
      await resetPassword(form.email)
      toast.success('Password reset email sent.')
    } catch (error) {
      setAuthError(error.message)
      toast.error(error.message)
    }
  }

  return <section className="container-shell grid min-h-[calc(100vh-160px)] place-items-center py-14"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-white/[0.08] bg-panel/90 shadow-2xl md:grid-cols-[.9fr_1.1fr]">
    <div className="relative hidden overflow-hidden border-r border-white/[0.07] bg-gradient-to-br from-cyan-400/10 via-panel to-violet-500/15 p-10 md:flex md:flex-col md:justify-between"><div><span className="eyebrow">Player account</span><h1 className="mt-6 font-display text-5xl font-bold uppercase leading-none text-white">Your orders.<br /><span className="text-lime">Always in sight.</span></h1><p className="mt-5 text-sm leading-6 text-slate-400">Secure accounts and order history powered by Supabase.</p></div><LockKeyhole className="absolute -bottom-12 -right-12 size-56 text-white/[0.025]" /><p className="relative flex items-center gap-2 text-xs text-slate-600"><Database size={13} /> Supabase Authentication</p></div>
    <form onSubmit={submit} className="p-7 sm:p-10"><div className="grid size-11 place-items-center rounded-xl bg-lime/10 text-lime">{mode === 'login' ? <LogIn size={21} /> : <UserPlus size={21} />}</div><h2 className="mt-6 font-display text-4xl font-bold uppercase text-white">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2><p className="mt-2 text-sm text-slate-500">{mode === 'login' ? 'Sign in to order and track delivery.' : 'Create your secure customer dashboard.'}</p>
      {!isSupabaseConfigured && <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-4 text-xs leading-5 text-amber-100"><strong>Supabase setup required:</strong> {supabaseConfigurationMessage}</div>}
      {authError && <div role="alert" className="mt-5 flex gap-2 rounded-xl border border-red-400/25 bg-red-400/[0.07] p-4 text-xs leading-5 text-red-100"><AlertTriangle className="mt-0.5 shrink-0" size={14} /><span>{authError}</span></div>}
      <div className="mt-7 space-y-5">{mode === 'register' && <><Field label="Full name" autoComplete="name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="Your name" /><Field label="Phone / WhatsApp" type="tel" autoComplete="tel" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="+91 98765 43210" pattern="[0-9 +()-]{8,18}" /></>}<Field label="Email address" type="email" autoComplete="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="you@example.com" /><div><div className="flex justify-between"><label className="label">Password</label>{mode === 'login' && <button type="button" onClick={sendReset} className="mb-2 text-[10px] font-bold uppercase tracking-wider text-lime">Forgot password?</button>}</div><input required minLength="6" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="input-field" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Minimum 6 characters" /></div></div>
      <button disabled={loading} className="btn-primary mt-7 w-full disabled:opacity-60">{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button><div className="mt-5 text-center text-xs text-slate-500">{mode === 'login' ? 'New to Sensi Store?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setAuthError('') }} className="font-bold text-lime">{mode === 'login' ? 'Create account' : 'Sign in'}</button></div><p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-slate-700"><Mail size={11} /> Your email is used for order delivery.</p>
    </form>
  </motion.div></section>
}

function Field({ label, onChange, ...props }) {
  return <div><label className="label">{label}</label><input required minLength="2" className="input-field" onChange={(event) => onChange(event.target.value)} {...props} /></div>
}
