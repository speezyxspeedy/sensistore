import { motion } from 'framer-motion'
import { Check, Clipboard, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/auth-context'
import { PAYMENT_QR_IMAGE, UPI_ID } from '../config/paymentConfig'
import { PLANS, PLAN_LIST } from '../data/plans'
import { createOrder, createOrderId } from '../services/orderService'

const RAM_OPTIONS = ['2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB+']
const GAMES = ['BGMI', 'PUBG Mobile', 'Free Fire', 'Free Fire MAX', 'COD Mobile', 'Other']

export default function Order() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const initialPlan = PLANS[params.get('plan')] ? params.get('plan') : ''
  const [form, setForm] = useState({ customerName: user.name || '', email: user.email || '', phone: user.phone || '', deviceName: '', deviceModel: '', ram: '', androidVersion: '', gameName: '', paymentId: '', plan: initialPlan })
  const [submitting, setSubmitting] = useState(false)
  const selectedPlan = useMemo(() => PLANS[form.plan], [form.plan])
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID)
      toast.success('UPI ID copied.')
    } catch {
      toast.error(`Could not copy automatically. UPI ID: ${UPI_ID}`)
    }
  }

  const placeOrder = async (event) => {
    event.preventDefault()
    if (!selectedPlan) {
      toast.error('Select a plan before submitting your order.')
      return
    }
    setSubmitting(true)
    try {
      const orderId = createOrderId()
      const order = await createOrder({ user, form, plan: selectedPlan, orderId })
      toast.success(`Order ${order.orderId} submitted for payment verification.`)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('Supabase order error:', error)
      toast.error(error.message || 'The order could not be submitted.')
    } finally { setSubmitting(false) }
  }

  return <section className="relative py-14 sm:py-20"><div className="absolute left-0 top-20 size-80 rounded-full bg-violet-600/[0.08] blur-[120px]" /><div className="container-shell relative"><motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center"><span className="eyebrow"><LockKeyhole size={13} /> Secure checkout</span><h1 className="mt-5 font-display text-5xl font-bold uppercase text-white sm:text-6xl">Tell us about your <span className="text-lime">setup</span></h1><p className="mt-4 text-sm text-slate-500">Your order is stored securely in Supabase and appears in both dashboards.</p></motion.div>
    <form onSubmit={placeOrder} className="mx-auto mt-12 grid max-w-6xl items-start gap-7 lg:grid-cols-[1fr_340px]"><div className="space-y-7"><FormSection number="01" title="Customer details"><div className="grid gap-5 sm:grid-cols-2"><Field label="Full Name" name="customerName" value={form.customerName} onChange={update} /><Field label="Email" name="email" type="email" value={form.email} readOnly /><Field label="WhatsApp Number" name="phone" type="tel" pattern="[0-9 +()-]{8,18}" value={form.phone} onChange={update} /><Field label="Device Name" name="deviceName" value={form.deviceName} onChange={update} placeholder="e.g. OnePlus" /></div></FormSection>
      <FormSection number="02" title="Device and game"><div className="grid gap-5 sm:grid-cols-2"><Field label="Device Model" name="deviceModel" value={form.deviceModel} onChange={update} placeholder="e.g. Nord 4" /><Select label="RAM" name="ram" value={form.ram} onChange={update} options={RAM_OPTIONS} /><Field label="Android Version" name="androidVersion" value={form.androidVersion} onChange={update} placeholder="e.g. Android 15" /><Select label="Game Name" name="gameName" value={form.gameName} onChange={update} options={GAMES} /></div></FormSection>
      <FormSection number="03" title="Manual UPI payment">
        <p className="mb-5 text-xs leading-5 text-slate-400">Scan the QR code and pay the exact selected-plan amount. Then enter the UTR/reference number shown by your UPI app. Your order stays Pending until an admin verifies it.</p>
        <div className="grid items-center gap-6 sm:grid-cols-[220px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white p-2">
            <img src={PAYMENT_QR_IMAGE} alt={`UPI payment QR code for ${UPI_ID}`} className="aspect-[23/32] w-full object-contain" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Amount to pay</p>
            <p className="mt-1 font-display text-4xl font-bold text-lime">{selectedPlan ? `₹${selectedPlan.price}` : 'Select a plan'}</p>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-slate-600">UPI ID</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-white">{UPI_ID}</code>
              <button type="button" onClick={copyUpiId} className="btn-secondary shrink-0 !px-3 !py-2.5"><Clipboard size={14} /> Copy UPI ID</button>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-white/[0.07] pt-6">
          <Field label="UTR / Transaction ID" name="paymentId" value={form.paymentId} onChange={update} minLength="6" maxLength="80" pattern="[A-Za-z0-9._-]{6,80}" placeholder="Enter after completing payment" />
        </div>
      </FormSection></div>
      <aside className="space-y-5 lg:sticky lg:top-6"><div className="glass-panel overflow-hidden rounded-2xl"><div className="border-b border-white/[0.07] p-5"><p className="text-xs font-bold uppercase tracking-widest text-white">Select plan <span className="text-lime">*</span></p></div><div className="space-y-3 p-5">{PLAN_LIST.map((plan) => <label key={plan.id} className={`block cursor-pointer rounded-xl border p-4 transition ${form.plan === plan.id ? 'border-lime/40 bg-lime/[0.07]' : 'border-white/[0.08] bg-white/[0.02]'}`}><input className="sr-only" type="radio" name="plan" value={plan.id} checked={form.plan === plan.id} onChange={update} required /><div className="flex items-center justify-between"><div><p className="font-display text-lg font-bold uppercase text-white">{plan.name}</p><p className="text-xs text-slate-600">One-time payment</p></div><div className="text-right"><p className="font-display text-2xl font-bold text-white">₹{plan.price}</p>{form.plan === plan.id && <Check className="ml-auto text-lime" size={15} />}</div></div></label>)}</div><div className="border-t border-white/[0.07] p-5"><div className="flex items-center justify-between gap-3"><span className="text-sm text-slate-400">Total</span><span className="text-right font-display text-3xl font-bold text-lime">{selectedPlan ? `₹${selectedPlan.price}` : '—'}</span></div><button disabled={submitting || !selectedPlan} className="btn-primary mt-5 w-full disabled:opacity-60">{submitting ? <><LoaderCircle className="animate-spin" size={16} /> Saving order…</> : <>Submit for review <ShieldCheck size={16} /></>}</button></div></div></aside>
    </form></div></section>
}

function FormSection({ number, title, children }) { return <section className="glass-panel rounded-2xl p-5 sm:p-8"><div className="mb-7 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-lime/10 font-display font-bold text-lime">{number}</span><h2 className="font-display text-xl font-bold uppercase text-white">{title}</h2></div>{children}</section> }
function Field({ label, required = true, ...props }) { return <div><label className="label" htmlFor={props.name}>{label}{required && <span className="text-lime"> *</span>}</label><input id={props.name} required={required} minLength={props.minLength || (required ? 2 : undefined)} maxLength={props.maxLength || 120} className="input-field read-only:cursor-not-allowed read-only:opacity-60" {...props} /></div> }
function Select({ label, options, ...props }) { return <div><label className="label" htmlFor={props.name}>{label}<span className="text-lime"> *</span></label><select id={props.name} required className="input-field appearance-none" {...props}><option value="" disabled>Select an option</option>{options.map((option) => <option key={option} className="bg-panel">{option}</option>)}</select></div> }
