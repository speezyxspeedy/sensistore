import { AlertTriangle, CheckCircle2, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'

export default function PaymentReturn() {
  const [params] = useSearchParams()
  const { user } = useAuth()
  const [state, setState] = useState({ loading: true, status: 'PENDING', orderId: params.get('orderId') })

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const token = await user.getIdToken()
        const response = await fetch(`/api/payments/status?orderId=${encodeURIComponent(params.get('orderId') || '')}`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Status check failed')
        if (!cancelled) setState({ loading: false, ...data })
      } catch (error) { if (!cancelled) setState({ loading: false, status: 'ERROR', error: error.message }) }
    }
    check()
    const timer = setInterval(check, 4000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [params, user])

  const success = state.status === 'SUCCESS'
  const failed = ['FAILED', 'CANCELLED', 'ERROR'].includes(state.status)
  return <section className="container-shell grid min-h-[calc(100vh-160px)] place-items-center py-16"><div className="glass-panel w-full max-w-xl rounded-3xl p-8 text-center sm:p-12">{state.loading || (!success && !failed) ? <><LoaderCircle className="mx-auto animate-spin text-lime" size={48} /><p className="mt-6 text-xs font-bold uppercase tracking-widest text-lime">Verifying payment</p><h1 className="mt-3 font-display text-4xl font-bold uppercase text-white">Please stay on this page</h1><p className="mt-4 text-sm leading-6 text-slate-500">We are waiting for BharatPe to securely confirm your payment.</p></> : success ? <><CheckCircle2 className="mx-auto text-lime" size={58} /><p className="mt-6 text-xs font-bold uppercase tracking-widest text-lime">Payment Successful</p><h1 className="mt-3 font-display text-4xl font-bold uppercase text-white">Your order is confirmed</h1><p className="mt-4 text-sm text-slate-500">Order ID: <span className="font-bold text-white">{state.orderId}</span>. A confirmation email is on its way.</p><Link to="/dashboard" className="btn-primary mt-7 w-full">Track my order</Link></> : <><AlertTriangle className="mx-auto text-red-400" size={54} /><p className="mt-6 text-xs font-bold uppercase tracking-widest text-red-400">Payment not completed</p><h1 className="mt-3 font-display text-4xl font-bold uppercase text-white">No charge confirmed</h1><p className="mt-4 text-sm text-slate-500">{state.error || 'Please return to checkout and try again.'}</p><Link to="/order" className="btn-primary mt-7 w-full">Return to checkout</Link></>}</div></section>
}
