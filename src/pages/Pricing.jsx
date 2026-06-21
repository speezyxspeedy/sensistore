import { motion } from 'framer-motion'
import { Check, Crown, ShieldCheck, Target, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PLAN_LIST } from '../data/plans'

export default function Pricing() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="absolute left-1/2 top-12 size-[420px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[150px]" />
      <div className="container-shell relative">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center"><span className="eyebrow">Simple one-time pricing</span><h1 className="mt-5 font-display text-5xl font-bold uppercase text-white sm:text-7xl">Choose your <span className="text-lime">advantage</span></h1><p className="mt-5 text-sm leading-6 text-slate-400 sm:text-base">No subscription. No hidden charge. Just a custom setup built for your device.</p></motion.div>
        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-2">
          {PLAN_LIST.map((plan, index) => {
            const premium = plan.id === 'premium'
            return <motion.article key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .1 }} className={`relative rounded-3xl p-7 sm:p-9 ${premium ? 'border border-lime/40 bg-gradient-to-br from-lime/10 via-panel to-violet-500/[0.06] shadow-glow' : 'glass-panel'}`}>
              {premium && <div className="absolute right-6 top-6 rounded-full bg-lime px-3 py-1 text-[10px] font-black uppercase tracking-widest text-ink">Best value</div>}
              <div className={`grid size-12 place-items-center rounded-xl ${premium ? 'bg-lime text-ink' : 'bg-white/5 text-white'}`}>{premium ? <Crown size={22} /> : <Target size={22} />}</div>
              <h2 className="mt-6 font-display text-3xl font-bold uppercase text-white">{plan.name}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{plan.description}</p>
              <div className="my-7"><span className="font-display text-6xl font-bold text-white">₹{plan.price}</span><span className="ml-2 text-xs uppercase tracking-wider text-slate-600">one time</span></div>
              <ul className="space-y-3.5 border-t border-white/[0.07] pt-7">{plan.features.map((feature) => <li key={feature} className="flex items-center gap-3 text-sm text-slate-300"><span className="grid size-5 place-items-center rounded-full bg-lime/10 text-lime"><Check size={12} strokeWidth={3} /></span>{feature}</li>)}</ul>
              <Link to={`/order?plan=${plan.id}`} className={`${premium ? 'btn-primary' : 'btn-secondary'} mt-8 w-full`}>Order {plan.name}</Link>
            </motion.article>
          })}
        </div>
        <div className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-3">{[[ShieldCheck, 'Secure payment'], [Timer, 'Delivered in 24 hours'], [Target, 'Built for your device']].map(([Icon, text]) => <div key={text} className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs font-medium text-slate-500"><Icon size={15} className="text-lime" />{text}</div>)}</div>
      </div>
    </section>
  )
}
