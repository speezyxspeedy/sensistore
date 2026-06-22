import { CheckCircle2, Clock3, CreditCard, LoaderCircle, LogOut, PackageCheck, Plus, Target } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/auth-context'
import { getDeliveryMessage, getUserOrders } from '../services/orderService'

const orderStatusClass = { Pending: 'text-amber-300 bg-amber-400/10 border-amber-400/20', Processing: 'text-blue-300 bg-blue-400/10 border-blue-400/20', Delivered: 'text-lime bg-lime/10 border-lime/20' }
const paymentStatusClass = { Pending: 'text-amber-300', Paid: 'text-lime', Failed: 'text-red-300' }

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getUserOrders(user.email).then((data) => { if (active) setOrders(data) }).catch((error) => { console.error(error); toast.error(error.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user.email])

  const delivered = useMemo(() => orders.filter((order) => order.orderStatus === 'Delivered').length, [orders])
  return <section className="container-shell min-h-[calc(100vh-160px)] py-12 sm:py-16"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="eyebrow">Customer dashboard</span><h1 className="mt-4 font-display text-4xl font-bold uppercase text-white sm:text-6xl">Welcome, <span className="text-lime">{user.name?.split(' ')[0] || 'Player'}</span></h1><p className="mt-2 text-sm text-slate-500">Your Supabase order history and delivery status.</p></div><div className="flex gap-3"><button onClick={logout} className="btn-secondary !px-4 !py-2.5"><LogOut size={15} /> Sign out</button><Link to="/order" className="btn-primary !px-4 !py-2.5"><Plus size={15} /> New order</Link></div></div>
    <div className="mt-9 grid grid-cols-3 gap-3"><DashboardStat icon={Target} label="Total" value={orders.length} /><DashboardStat icon={PackageCheck} label="Active" value={orders.length - delivered} /><DashboardStat icon={CheckCircle2} label="Delivered" value={delivered} /></div>
    <div className="mt-7 overflow-hidden rounded-2xl border border-white/[0.08] bg-panel/80">{loading ? <div className="grid min-h-64 place-items-center"><LoaderCircle className="animate-spin text-lime" /></div> : orders.length === 0 ? <div className="grid min-h-72 place-items-center px-5 text-center"><div><Target className="mx-auto text-slate-700" size={40} /><h2 className="mt-4 font-display text-2xl font-bold uppercase text-white">No orders yet</h2><Link to="/pricing" className="btn-primary mt-6">View plans</Link></div></div> : <div className="divide-y divide-white/[0.06]">{orders.map((order) => <article key={order.id} className="p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-[1.1fr_1fr_.8fr_.8fr] sm:items-center"><div><p className="font-display text-lg font-bold text-white">{order.orderId}</p><p className="mt-1 text-[10px] text-slate-600">{formatDate(order.createdAt)}</p></div><div><p className="text-[9px] uppercase text-slate-600">Plan</p><p className="mt-1 text-sm text-slate-300">{order.planName} · ₹{order.amount}</p></div><p className={`flex items-center gap-1.5 text-xs font-semibold ${paymentStatusClass[order.paymentStatus]}`}><CreditCard size={13} /> {order.paymentStatus}</p><span className={`w-fit rounded-full border px-3 py-1.5 text-[10px] font-bold ${orderStatusClass[order.orderStatus]}`}>{order.orderStatus}</span></div><div className="mt-4 grid gap-2.5 sm:grid-cols-2"><div className="rounded-xl bg-white/[0.025] p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">UTR / Transaction ID</p><p className="mt-1 break-all font-mono text-xs text-slate-300">{order.paymentId || '—'}</p></div><div className="flex gap-2.5 rounded-xl bg-white/[0.025] p-3"><Clock3 size={14} className="mt-0.5 shrink-0 text-violet-300" /><p className="text-xs text-slate-400">{getDeliveryMessage(order)}</p></div></div></article>)}</div>}</div>
  </section>
}

function DashboardStat({ icon: Icon, label, value }) { return <div className="glass-panel rounded-xl p-4 sm:p-5"><Icon className="text-lime" size={17} /><p className="mt-3 font-display text-3xl font-bold text-white">{value}</p><p className="text-[9px] font-bold uppercase text-slate-600">{label} orders</p></div> }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Pending' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) }
