import { motion } from 'framer-motion'
import { Check, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import UploadField from '../components/UploadField'
import { useAuth } from '../contexts/auth-context'
import { PLANS, PLAN_LIST } from '../data/plans'
import { firebaseConfigurationMessage, isFirebaseConfigured } from '../firebase'
import { createOrder, createOrderId } from '../services/orderService'
import { createPaymentOrder } from '../services/paymentService'
import { saveUser } from '../services/authService'

const RAM_OPTIONS = ['2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB+']
const GAMES = ['BGMI', 'PUBG Mobile', 'Free Fire', 'Free Fire MAX', 'COD Mobile', 'Other']

export default function Order() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const initialPlan = PLANS[params.get('plan')] ? params.get('plan') : 'premium'
  const [form, setForm] = useState({
    customerName: user.displayName || '', email: user.email || '', phone: '',
    deviceName: '', deviceModel: '', ram: '', androidVersion: '', gameName: '',
    gameUid: '', plan: initialPlan, paymentId: '',
  })
  const [hudScreenshot, setHudScreenshot] = useState(null)
  const [sensiScreenshot, setSensiScreenshot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const selectedPlan = useMemo(() => PLANS[form.plan], [form.plan])
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const placeOrder = async (event) => {
    event.preventDefault()
    if (!isFirebaseConfigured) return toast.error(firebaseConfigurationMessage)
    if (!hudScreenshot || !sensiScreenshot) return toast.error('Upload both required screenshots.')
    setSubmitting(true)
    try {
      const orderId = createOrderId()
      const payment = await createPaymentOrder({
        orderId,
        paymentId: form.paymentId,
        amount: selectedPlan.price,
        plan: selectedPlan.id,
        customerEmail: user.email,
      })
      const order = await createOrder({
        user,
        form,
        plan: selectedPlan,
        payment,
        hudScreenshot,
        sensiScreenshot,
        orderId,
      })
      saveUser({ id: user.uid, name: form.customerName, email: user.email, phone: form.phone, role: 'customer', createdAt: user.metadata?.creationTime })
      toast.success(`Order ${order.orderId} submitted for payment verification.`)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('Order submission failed:', error)
      const message = error.code === 'storage/unauthorized'
        ? 'Screenshot upload was blocked. Deploy the included Firebase Storage rules.'
        : error.code === 'permission-denied'
          ? 'Order saving was blocked. Deploy the included Firestore rules.'
          : error.message
      toast.error(message || 'The order could not be submitted. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <section className="relative py-14 sm:py-20">
    <div className="absolute left-0 top-20 size-80 rounded-full bg-violet-600/[0.08] blur-[120px]" />
    <div className="container-shell relative">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center">
        <span className="eyebrow"><LockKeyhole size={13} /> Secure manual checkout</span>
        <h1 className="mt-5 font-display text-5xl font-bold uppercase text-white sm:text-6xl">Tell us about your <span className="text-lime">setup</span></h1>
        <p className="mt-4 text-sm text-slate-500">Submit your setup and UPI reference. An admin verifies payment before work begins.</p>
      </motion.div>

      <form onSubmit={placeOrder} className="mx-auto mt-12 grid max-w-6xl items-start gap-7 lg:grid-cols-[1fr_340px]">
        <div className="space-y-7">
          <FormSection number="01" title="Customer details">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full Name" name="customerName" value={form.customerName} onChange={update} />
              <Field label="Email" name="email" type="email" value={form.email} readOnly />
              <Field label="WhatsApp Number" name="phone" type="tel" inputMode="tel" pattern="[0-9 +()-]{8,18}" value={form.phone} onChange={update} placeholder="+91 98765 43210" />
              <Field label="Device Name" name="deviceName" value={form.deviceName} onChange={update} placeholder="e.g. OnePlus" />
            </div>
          </FormSection>

          <FormSection number="02" title="Device and game">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Device Model" name="deviceModel" value={form.deviceModel} onChange={update} placeholder="e.g. Nord 4" />
              <Select label="RAM" name="ram" value={form.ram} onChange={update} options={RAM_OPTIONS} />
              <Field label="Android Version" name="androidVersion" value={form.androidVersion} onChange={update} placeholder="e.g. Android 15" />
              <Select label="Game Name" name="gameName" value={form.gameName} onChange={update} options={GAMES} />
              <Field label="Game UID (optional)" name="gameUid" value={form.gameUid} onChange={update} required={false} placeholder="Your in-game UID" />
            </div>
          </FormSection>

          <FormSection number="03" title="Current setup screenshots">
            <div className="grid gap-5 sm:grid-cols-2">
              <UploadField label="HUD Screenshot" value={hudScreenshot} onChange={setHudScreenshot} hint="Show the full controls/HUD layout." />
              <UploadField label="Sensitivity Screenshot" value={sensiScreenshot} onChange={setSensiScreenshot} hint="Show camera, ADS and gyro settings." />
            </div>
          </FormSection>

          <FormSection number="04" title="Manual UPI payment">
            <p className="mb-5 text-xs leading-5 text-slate-400">Pay the selected plan amount using the store UPI details, then enter the UPI transaction/reference ID. Your order remains Pending until an admin verifies it.</p>
            <Field label="UPI Transaction ID" name="paymentId" value={form.paymentId} onChange={update} minLength="6" maxLength="80" pattern="[A-Za-z0-9._-]{6,80}" placeholder="e.g. 426512345678" />
          </FormSection>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="glass-panel overflow-hidden rounded-2xl">
            <div className="border-b border-white/[0.07] p-5"><p className="text-xs font-bold uppercase tracking-widest text-white">Select plan</p></div>
            <div className="space-y-3 p-5">{PLAN_LIST.map((plan) => <label key={plan.id} className={`block cursor-pointer rounded-xl border p-4 transition ${form.plan === plan.id ? 'border-lime/40 bg-lime/[0.07]' : 'border-white/[0.08] bg-white/[0.02]'}`}>
              <input className="sr-only" type="radio" name="plan" value={plan.id} checked={form.plan === plan.id} onChange={update} />
              <div className="flex items-center justify-between"><div><p className="font-display text-lg font-bold uppercase text-white">{plan.name}</p><p className="text-xs text-slate-600">One-time payment</p></div><div className="text-right"><p className="font-display text-2xl font-bold text-white">₹{plan.price}</p>{form.plan === plan.id && <Check className="ml-auto text-lime" size={15} />}</div></div>
            </label>)}</div>
            <div className="border-t border-white/[0.07] p-5">
              <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Total</span><span className="font-display text-3xl font-bold text-lime">₹{selectedPlan.price}</span></div>
              <button disabled={submitting} className="btn-primary mt-5 w-full disabled:opacity-60">{submitting ? <><LoaderCircle className="animate-spin" size={16} /> Saving order…</> : <>Submit for review <ShieldCheck size={16} /></>}</button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-600"><ShieldCheck size={12} /> Payment is verified manually</p>
            </div>
          </div>
          <div className="rounded-xl border border-violet-400/15 bg-violet-500/[0.06] p-4 text-xs leading-5 text-slate-400">Delivery updates will appear in your dashboard and be sent to <span className="text-white">{user.email}</span>.</div>
        </aside>
      </form>
    </div>
  </section>
}

function FormSection({ number, title, children }) {
  return <section className="glass-panel rounded-2xl p-5 sm:p-8"><div className="mb-7 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-lime/10 font-display font-bold text-lime">{number}</span><h2 className="font-display text-xl font-bold uppercase text-white">{title}</h2></div>{children}</section>
}

function Field({ label, required = true, ...props }) {
  return <div><label className="label" htmlFor={props.name}>{label}{required && <span className="text-lime"> *</span>}</label><input id={props.name} required={required} minLength={props.minLength || (required ? 2 : undefined)} maxLength={props.maxLength || 120} className="input-field read-only:cursor-not-allowed read-only:opacity-60" {...props} /></div>
}

function Select({ label, options, ...props }) {
  return <div><label className="label" htmlFor={props.name}>{label}<span className="text-lime"> *</span></label><select id={props.name} required className="input-field appearance-none" {...props}><option value="" disabled>Select an option</option>{options.map((option) => <option key={option} className="bg-panel">{option}</option>)}</select></div>
}
