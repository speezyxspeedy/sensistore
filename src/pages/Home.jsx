import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Check, ChevronRight, Crosshair, Gamepad2, MousePointer2, Quote, Smartphone, Target, Timer, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PLAN_LIST } from '../data/plans'

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.55 } }

function AimVisual() {
  return (
    <motion.div initial={{ opacity: 0, scale: .88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .8, delay: .15 }} className="relative mx-auto aspect-square w-full max-w-[470px]">
      <div className="absolute inset-[8%] rounded-full border border-white/[0.06]" />
      <div className="absolute inset-[21%] rounded-full border border-dashed border-lime/20 [animation:spin_18s_linear_infinite]" />
      <div className="absolute inset-[31%] rounded-full border border-white/10" />
      <div className="absolute left-1/2 top-[8%] h-[84%] w-px bg-gradient-to-b from-transparent via-lime/25 to-transparent" />
      <div className="absolute left-[8%] top-1/2 h-px w-[84%] bg-gradient-to-r from-transparent via-lime/25 to-transparent" />
      <div className="absolute inset-[39%] grid place-items-center rounded-full border border-lime/40 bg-lime/[0.08] shadow-[0_0_80px_rgba(34,211,238,.18)]">
        <Crosshair className="text-lime" size={58} strokeWidth={1.2} />
      </div>
      <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 4, repeat: Infinity }} className="glass-panel absolute right-[2%] top-[19%] rounded-xl p-3 shadow-xl">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500"><Target size={12} className="text-lime" /> Accuracy</div>
        <p className="font-display text-2xl font-bold text-white">+38<span className="text-lime">%</span></p>
      </motion.div>
      <motion.div animate={{ y: [8, -8, 8] }} transition={{ duration: 4.5, repeat: Infinity }} className="glass-panel absolute bottom-[12%] left-[2%] rounded-xl p-3 shadow-xl">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500"><MousePointer2 size={12} className="text-violet-400" /> Response</div>
        <p className="font-display text-2xl font-bold text-white">Ultra <span className="text-violet-400">Fast</span></p>
      </motion.div>
      <div className="absolute inset-x-[13%] top-[14%] h-px bg-lime/70 shadow-[0_0_12px_#22d3ee] scanline" />
    </motion.div>
  )
}

export default function Home() {
  return (
    <>
      <section className="noise relative min-h-[calc(100vh-74px)] overflow-hidden pb-16 pt-16 sm:pt-24">
        <div className="absolute -left-32 top-1/4 size-80 rounded-full bg-violet-600/10 blur-[110px]" />
        <div className="absolute right-0 top-1/4 size-96 rounded-full bg-lime/[0.07] blur-[130px]" />
        <div className="container-shell grid items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
          <motion.div initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7 }} className="relative z-10">
            <div className="eyebrow"><span className="pulse-dot size-1.5 rounded-full bg-lime" /> Custom tuned for your device</div>
            <h1 className="display-title mt-6 text-5xl sm:text-6xl lg:text-[86px]">
              Unlock Your<br /><span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">Perfect Sensitivity</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              Custom gaming sensitivity settings delivered within 24 hours.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/order?plan=normal" className="btn-primary">Order Now <ArrowRight size={17} /></Link>
              <Link to="/pricing" className="btn-secondary">Compare plans</Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-2"><BadgeCheck size={16} className="text-lime" /> Device optimized</span>
              <span className="flex items-center gap-2"><Timer size={16} className="text-lime" /> 24-hour delivery</span>
              <span className="flex items-center gap-2"><Gamepad2 size={16} className="text-lime" /> Player tested</span>
            </div>
          </motion.div>
          <AimVisual />
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.015] py-6">
        <div className="container-shell grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[['2', 'Focused plans'], ['24h', 'Fast delivery'], ['100%', 'Device tuned'], ['1:1', 'Personal setup']].map(([value, label]) => (
            <div key={label} className="text-center"><p className="font-display text-2xl font-bold text-white sm:text-3xl">{value}</p><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">{label}</p></div>
          ))}
        </div>
      </section>

      <section id="plans" className="relative py-24 sm:py-32">
        <div className="container-shell">
          <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Choose your upgrade</span>
            <h2 className="mt-5 font-display text-4xl font-bold uppercase leading-none text-white sm:text-6xl">Built for every <span className="text-lime">grind</span></h2>
            <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">One-time payment. Custom settings. No subscriptions or hidden fees.</p>
          </motion.div>
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-2">
            {PLAN_LIST.map((plan, index) => {
              const popular = plan.id === 'premium'
              return (
                <motion.article key={plan.id} {...reveal} transition={{ duration: .55, delay: index * .1 }} className={`relative overflow-hidden rounded-2xl p-7 sm:p-9 ${popular ? 'border border-lime/40 bg-gradient-to-br from-lime/[0.09] via-panel to-panel shadow-glow' : 'glass-panel'}`}>
                  {popular && <span className="absolute right-5 top-5 rounded-full bg-lime px-3 py-1 text-[10px] font-black uppercase tracking-widest text-ink">Most popular</span>}
                  <div className={`grid size-12 place-items-center rounded-xl ${popular ? 'bg-lime text-ink' : 'bg-white/[0.05] text-slate-300'}`}><Crosshair size={23} /></div>
                  <h3 className="mt-6 font-display text-3xl font-bold uppercase text-white">{plan.name}</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{plan.description}</p>
                  <div className="my-7 flex items-end gap-2"><span className="font-display text-6xl font-bold leading-none text-white">₹{plan.price}</span><span className="pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">one time</span></div>
                  <div className="h-px bg-white/[0.07]" />
                  <ul className="my-7 space-y-3.5">
                    {plan.features.map((feature) => <li key={feature} className="flex items-center gap-3 text-sm text-slate-300"><span className="grid size-5 place-items-center rounded-full bg-lime/10 text-lime"><Check size={12} strokeWidth={3} /></span>{feature}</li>)}
                  </ul>
                  <Link to={`/order?plan=${plan.id}`} className={popular ? 'btn-primary w-full' : 'btn-secondary w-full'}>Buy {plan.name} — ₹{plan.price} <ChevronRight size={16} /></Link>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="process" className="relative border-y border-white/[0.06] bg-white/[0.015] py-24">
        <div className="container-shell">
          <motion.div {...reveal} className="max-w-xl"><span className="eyebrow">Simple process</span><h2 className="mt-5 font-display text-4xl font-bold uppercase text-white sm:text-5xl">Ready in three <span className="text-lime">moves</span></h2></motion.div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              [Smartphone, '01', 'Share your setup', 'Tell us your device, RAM and game version so we can tune for your exact hardware.'],
              [Upload, '02', 'Upload screenshots', 'Send your current sensitivity and HUD layout for a precise, personalized analysis.'],
              [Target, '03', 'Receive & dominate', 'Your custom settings arrive by email within 24 hours, ready to apply and test.'],
            ].map(([Icon, number, title, text], index) => (
              <motion.div key={title} {...reveal} transition={{ duration: .5, delay: index * .1 }} className="glass-panel group rounded-2xl p-7 transition hover:-translate-y-1 hover:border-lime/20">
                <div className="flex items-start justify-between"><div className="grid size-11 place-items-center rounded-xl bg-lime/[0.07] text-lime"><Icon size={21} /></div><span className="font-display text-4xl font-bold text-white/[0.04] transition group-hover:text-lime/10">{number}</span></div>
                <h3 className="mt-6 font-display text-xl font-bold uppercase text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-shell">
          <motion.div {...reveal} className="mx-auto max-w-2xl text-center"><span className="eyebrow">Player feedback</span><h2 className="mt-5 font-display text-4xl font-bold uppercase text-white sm:text-5xl">Built for real <span className="text-lime">gameplay</span></h2></motion.div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ['Aarav K.', 'BGMI · OnePlus', 'My close-range tracking feels much more controlled. The settings were easy to apply and arrived the same day.'],
              ['Rehan M.', 'Free Fire MAX · Realme', 'The DPI and accessibility guide made a real difference. Everything was explained clearly.'],
              ['Dev S.', 'COD Mobile · Samsung', 'Premium was worth it for the full device setup. Support also helped me fine-tune one setting.'],
            ].map(([name, game, text]) => <motion.article key={name} {...reveal} className="glass-panel rounded-2xl p-6"><Quote className="text-lime" size={22} /><p className="mt-5 text-sm leading-6 text-slate-400">“{text}”</p><div className="mt-5 border-t border-white/[0.07] pt-4"><p className="text-sm font-bold text-white">{name}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">{game}</p></div></motion.article>)}
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-white/[0.06] bg-white/[0.015] py-24">
        <div className="container-shell grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
          <motion.div {...reveal}><span className="eyebrow">FAQ</span><h2 className="mt-5 font-display text-4xl font-bold uppercase text-white sm:text-5xl">Questions, <span className="text-lime">answered.</span></h2><p className="mt-4 text-sm leading-6 text-slate-500">Need anything else? Our support team is one message away.</p><Link to="/contact" className="btn-secondary mt-6">Contact support</Link></motion.div>
          <div className="space-y-3">{[
            ['How will I receive my sensitivity?', 'Your custom setup is manually prepared and delivered to the email used during checkout within 24 hours of successful payment.'],
            ['Which games and devices are supported?', 'We support popular Android games including BGMI, PUBG Mobile, Free Fire MAX and COD Mobile across a wide range of devices.'],
            ['What is included in Premium?', 'Premium includes every Normal feature, advanced optimization, five premium app setup/edit commands, priority delivery and extra support.'],
            ['Can I get a refund?', 'Because each order is custom digital work, refunds are limited. Read the Refund Policy for eligibility and contact us before delivery if you made an ordering mistake.'],
          ].map(([question, answer]) => <details key={question} className="group glass-panel rounded-xl p-5"><summary className="cursor-pointer list-none pr-6 text-sm font-bold text-white">{question}<span className="float-right text-lime transition group-open:rotate-45">+</span></summary><p className="mt-3 text-sm leading-6 text-slate-500">{answer}</p></details>)}</div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <motion.div {...reveal} className="container-shell">
          <div className="relative overflow-hidden rounded-3xl border border-lime/20 bg-gradient-to-r from-lime/[0.1] via-panel to-violet-500/[0.08] px-6 py-14 text-center sm:px-12 sm:py-20">
            <Crosshair className="absolute -right-14 -top-14 size-56 text-white/[0.025]" />
            <p className="text-xs font-bold uppercase tracking-[.22em] text-lime">Your next win starts here</p>
            <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-bold uppercase leading-none text-white sm:text-6xl">Turn every swipe into an advantage.</h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-slate-400">Get settings made for you—not the average player.</p>
            <Link to="/order?plan=premium" className="btn-primary mt-8">Build my sensitivity <ArrowRight size={17} /></Link>
          </div>
        </motion.div>
      </section>
    </>
  )
}
