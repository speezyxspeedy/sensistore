import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { CheckCircle2, Clock3, CreditCard, LoaderCircle, LogOut, PackageCheck, Plus, Target } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { auth, db } from '../firebase'
import { useAuth } from '../contexts/auth-context'

const statusClass = { Pending: 'text-amber-300 bg-amber-400/10 border-amber-400/20', Processing: 'text-blue-300 bg-blue-400/10 border-blue-400/20', Delivered: 'text-lime bg-lime/10 border-lime/20' }

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid))
    return onSnapshot(ordersQuery, (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setOrders(next); setLoading(false)
    }, () => setLoading(false))
  }, [user.uid])

  const delivered = useMemo(() => orders.filter((order) => order.orderStatus === 'Delivered').length, [orders])
  return <section className="container-shell min-h-[calc(100vh-160px)] py-12 sm:py-16"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="flex flex-wrap items-center gap-2"><span className="eyebrow">Customer dashboard</span><span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">Role: Customer</span></div><h1 className="mt-4 font-display text-4xl font-bold uppercase text-white sm:text-6xl">Welcome, <span className="text-lime">{user.displayName?.split(' ')[0] || 'Player'}</span></h1><p className="mt-2 text-sm text-slate-500">Track payment, preparation and delivery in real time.</p></div><div className="flex gap-3"><button onClick={() => signOut(auth)} className="btn-secondary !px-4 !py-2.5"><LogOut size={15} /> Sign out</button><Link to="/order" className="btn-primary !px-4 !py-2.5"><Plus size={15} /> New order</Link></div></div>
    <div className="mt-9 grid grid-cols-3 gap-3"><DashboardStat icon={Target} label="Total" value={orders.length} /><DashboardStat icon={PackageCheck} label="Active" value={orders.length - delivered} /><DashboardStat icon={CheckCircle2} label="Delivered" value={delivered} /></div>
    <div className="mt-7 overflow-hidden rounded-2xl border border-white/[0.08] bg-panel/80">{loading ? <div className="grid min-h-64 place-items-center"><LoaderCircle className="animate-spin text-lime" /></div> : orders.length === 0 ? <div className="grid min-h-72 place-items-center px-5 text-center"><div><Target className="mx-auto text-slate-700" size={40} /><h2 className="mt-4 font-display text-2xl font-bold uppercase text-white">No orders yet</h2><p className="mt-2 text-sm text-slate-500">Choose your plan and place your first custom sensitivity order.</p><Link to="/pricing" className="btn-primary mt-6">View plans</Link></div></div> : <div className="divide-y divide-white/[0.06]">{orders.map((order) => <article key={order.id} className="grid gap-4 p-5 transition hover:bg-white/[0.018] sm:grid-cols-[1.1fr_1fr_.8fr_.8fr] sm:items-center"><div><p className="font-display text-lg font-bold tracking-wide text-white">{order.orderId}</p><p className="mt-1 text-[10px] text-slate-600">{formatDate(order.createdAt)}</p></div><div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Plan</p><p className="mt-1 text-sm font-semibold text-slate-300">{order.planName}</p></div><div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Payment</p><p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-lime"><CreditCard size={13} /> {order.paymentStatus}</p></div><div className="sm:text-right"><span className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${statusClass[order.orderStatus] || statusClass.Pending}`}>{order.orderStatus}</span></div></article>)}</div>}</div>
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-violet-400/15 bg-violet-500/[0.06] p-4"><Clock3 size={18} className="mt-0.5 text-violet-400" /><p className="text-xs leading-5 text-slate-400">Every paid order is manually prepared and delivered to <span className="text-white">{user.email}</span> within 24 hours.</p></div>
  </section>
}

function DashboardStat({ icon: Icon, label, value }) { return <div className="glass-panel rounded-xl p-4 sm:p-5"><Icon className="text-lime" size={17} /><p className="mt-3 font-display text-3xl font-bold text-white">{value}</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{label} orders</p></div> }
function formatDate(timestamp) { return timestamp?.toDate ? timestamp.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Processing payment' }
