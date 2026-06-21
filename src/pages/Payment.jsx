import { ArrowLeft, CreditCard, LockKeyhole, ShieldCheck, Timer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/auth-context'

export default function Payment() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const draft = useMemo(() => { try { return JSON.parse(sessionStorage.getItem('sensiOrderDraft')) } catch { return null } }, [])

  if (!draft) return <section className="container-shell grid min-h-[70vh] place-items-center"><div className="glass-panel max-w-md rounded-2xl p-8 text-center"><CreditCard className="mx-auto text-slate-600" size={38} /><h1 className="mt-5 font-display text-3xl font-bold uppercase text-white">No order ready</h1><p className="mt-2 text-sm text-slate-500">Complete your device details before payment.</p><Link to="/order" className="btn-primary mt-6">Start order</Link></div></section>

  const pay = async () => {
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/payments/create', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(draft) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Payment could not be started.')
      sessionStorage.removeItem('sensiOrderDraft')
      window.location.assign(data.paymentUrl)
    } catch (error) { toast.error(error.message); setLoading(false) }
  }

  return <section className="container-shell py-14 sm:py-20"><div className="mx-auto max-w-4xl"><div className="text-center"><span className="eyebrow"><LockKeyhole size={13} /> Secure checkout · Step 2 of 2</span><h1 className="mt-5 font-display text-5xl font-bold uppercase text-white sm:text-6xl">Review and <span className="text-lime">pay</span></h1></div><div className="mt-12 grid gap-6 md:grid-cols-[1fr_340px]"><div className="glass-panel rounded-2xl p-6 sm:p-8"><h2 className="font-display text-2xl font-bold uppercase text-white">Order summary</h2><div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2">{[['Name', draft.customerName], ['Email', draft.email], ['Device', `${draft.deviceName} ${draft.deviceModel}`], ['Game', draft.gameName], ['RAM', draft.ram], ['Android', draft.androidVersion]].map(([label, value]) => <div key={label} className="bg-panel p-4"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-sm text-slate-300">{value}</p></div>)}</div><Link to="/order" className="btn-secondary mt-6"><ArrowLeft size={15} /> Edit details</Link></div><aside><div className="overflow-hidden rounded-2xl border border-lime/25 bg-gradient-to-b from-lime/[0.08] to-panel shadow-glow"><div className="p-6"><p className="text-xs font-bold uppercase tracking-widest text-lime">{draft.planName}</p><div className="mt-4 flex items-end justify-between"><span className="text-sm text-slate-400">Total payable</span><span className="font-display text-5xl font-bold text-white">₹{draft.amount}</span></div><button onClick={pay} disabled={loading} className="btn-primary mt-7 w-full disabled:opacity-60">{loading ? 'Opening BharatPe…' : <>Pay Now <CreditCard size={16} /></>}</button><div className="mt-5 space-y-2 text-[10px] text-slate-600"><p className="flex items-center gap-2"><ShieldCheck size={12} className="text-lime" /> Payment verified server-side</p><p className="flex items-center gap-2"><Timer size={12} className="text-lime" /> Delivery within 24 hours</p></div></div></div></aside></div></div></section>
}
