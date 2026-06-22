import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, Clipboard, CreditCard, Eye, LoaderCircle, LogOut, PackageCheck, Search, ShieldCheck, Sparkles, UserRound, Users, WalletCards, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/auth-context'
import { getUsers } from '../services/authService'
import { copyCustomerValue, getAllOrders, ORDER_STATUSES, PAYMENT_STATUSES, updateAdminOrder } from '../services/orderService'

const paymentStyles = { Pending: 'border-amber-400/20 bg-amber-400/10 text-amber-300', Paid: 'border-lime/20 bg-lime/10 text-lime', Failed: 'border-red-400/20 bg-red-400/10 text-red-300' }
const orderStyles = { Pending: 'border-slate-400/20 bg-slate-400/10 text-slate-300', Processing: 'border-blue-400/20 bg-blue-400/10 text-blue-300', Delivered: 'border-violet-400/20 bg-violet-400/10 text-violet-300' }

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    Promise.all([getUsers(), getAllOrders()]).then(([userRows, orderRows]) => {
      if (!active) return
      setUsers(userRows.filter((user) => user.role !== 'admin'))
      setOrders(orderRows)
    }).catch((error) => { console.error(error); toast.error(error.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filteredOrders = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return orders.filter((order) => !needle || [order.orderId, order.customerName, order.email, order.phone].some((value) => String(value || '').toLowerCase().includes(needle)))
  }, [orders, search])

  const customerRows = useMemo(() => users.map((user) => ({
    ...user,
    totalOrders: orders.filter((order) => order.email.toLowerCase() === user.email.toLowerCase()).length,
  })), [users, orders])

  const stats = useMemo(() => ({
    users: users.length,
    total: orders.length,
    paid: orders.filter((order) => order.paymentStatus === 'Paid').length,
    pending: orders.filter((order) => order.orderStatus === 'Pending').length,
    delivered: orders.filter((order) => order.orderStatus === 'Delivered').length,
    revenue: orders.filter((order) => order.paymentStatus === 'Paid').reduce((sum, order) => sum + order.amount, 0),
  }), [users.length, orders])

  const updateOrder = async (order, changes, type) => {
    setUpdating(`${order.id}:${type}`)
    try {
      const updated = await updateAdminOrder(order.id, changes)
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item))
      if (selectedOrder?.id === updated.id) setSelectedOrder(updated)
      toast.success('Order updated successfully.')
    } catch (error) { toast.error(error.message) }
    finally { setUpdating('') }
  }

  const signOut = async () => { await logout(); navigate('/admin/login', { replace: true }) }

  return <section className="min-h-[calc(100vh-150px)] py-10 sm:py-14"><div className="container-shell"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="eyebrow"><ShieldCheck size={13} /> Supabase admin</span><h1 className="mt-4 font-display text-4xl font-bold uppercase text-white sm:text-6xl">Order <span className="text-lime">Command Center</span></h1><p className="mt-2 text-sm text-slate-500">Customers, payments and delivery status from Supabase.</p></div><button onClick={signOut} className="btn-secondary !py-2.5"><LogOut size={15} /> Sign out</button></div>
    <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"><StatCard icon={Users} label="Total Users" value={stats.users} color="text-cyan-300" /><StatCard icon={UserRound} label="Total Orders" value={stats.total} /><StatCard icon={CreditCard} label="Paid Orders" value={stats.paid} color="text-lime" /><StatCard icon={WalletCards} label="Pending Orders" value={stats.pending} color="text-amber-300" /><StatCard icon={CheckCircle2} label="Delivered Orders" value={stats.delivered} color="text-violet-300" /><StatCard icon={Sparkles} label="Total Revenue" value={`₹${stats.revenue.toLocaleString('en-IN')}`} color="text-lime" /></div>
    <section id="orders" className="glass-panel mt-7 overflow-hidden rounded-2xl"><div className="border-b border-white/[0.07] p-4 sm:p-5"><div className="relative max-w-lg"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} /><input className="input-field !py-2.5 !pl-10" placeholder="Search orders, customers, email or phone…" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>{loading ? <LoadingState /> : filteredOrders.length === 0 ? <EmptyState label="No orders yet" /> : <><div className="hidden overflow-x-auto xl:block"><table className="w-full min-w-[1500px] text-left"><thead><tr className="border-b border-white/[0.06] text-[9px] uppercase tracking-[.14em] text-slate-600">{['Order ID', 'Customer', 'Email', 'WhatsApp', 'Device', 'Plan', 'Amount', 'Payment', 'Order Status', 'Created', 'Actions'].map((column) => <th key={column} className="px-4 py-4">{column}</th>)}</tr></thead><tbody>{filteredOrders.map((order) => <OrderRow key={order.id} order={order} updating={updating} onUpdate={updateOrder} onView={setSelectedOrder} />)}</tbody></table></div><div className="divide-y divide-white/[0.06] xl:hidden">{filteredOrders.map((order) => <OrderCard key={order.id} order={order} updating={updating} onUpdate={updateOrder} onView={setSelectedOrder} />)}</div></>}</section>
    <UsersTable users={customerRows} loading={loading} />
  </div><AnimatePresence>{selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />}</AnimatePresence></section>
}

function StatCard({ icon: Icon, label, value, color = 'text-white' }) { return <div className="rounded-xl border border-white/[0.07] bg-panel/80 p-4"><div className="flex justify-between"><p className="text-[9px] font-bold uppercase tracking-[.13em] text-slate-600">{label}</p><Icon size={15} className={color} /></div><p className={`mt-3 font-display text-3xl font-bold ${color}`}>{value}</p></div> }
function StatusSelect({ kind, value, loading, onChange }) { const options = kind === 'payment' ? PAYMENT_STATUSES : ORDER_STATUSES; const styles = kind === 'payment' ? paymentStyles : orderStyles; return <div className="relative"><select disabled={loading} value={value} onChange={(event) => onChange(event.target.value)} className={`w-full min-w-28 appearance-none rounded-lg border px-3 py-2 pr-8 text-[10px] font-bold outline-none ${styles[value]}`}>{options.map((status) => <option key={status} className="bg-panel text-white">{status}</option>)}</select>{loading ? <LoaderCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin" size={12} /> : <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2" size={12} />}</div> }
function OrderRow({ order, updating, onUpdate, onView }) { return <tr className="border-b border-white/[0.05] text-xs"><td className="px-4 py-4 font-bold text-white">{order.orderId}</td><td className="px-4 py-4 text-slate-200">{order.customerName}</td><td className="px-4 py-4 text-slate-500">{order.email}</td><td className="px-4 py-4 text-slate-400">{order.phone}</td><td className="px-4 py-4 text-slate-300">{order.deviceName} {order.deviceModel}</td><td className="px-4 py-4">{order.planName}</td><td className="px-4 py-4 font-bold">₹{order.amount}</td><td className="px-4 py-4"><StatusSelect kind="payment" value={order.paymentStatus} loading={updating === `${order.id}:payment`} onChange={(paymentStatus) => onUpdate(order, { paymentStatus }, 'payment')} /></td><td className="px-4 py-4"><StatusSelect kind="order" value={order.orderStatus} loading={updating === `${order.id}:order`} onChange={(orderStatus) => onUpdate(order, { orderStatus }, 'order')} /></td><td className="px-4 py-4 text-slate-600">{formatDate(order.createdAt)}</td><td className="px-4 py-4"><button onClick={() => onView(order)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-lime"><Eye size={15} /></button></td></tr> }
function OrderCard({ order, updating, onUpdate, onView }) { return <article className="p-5"><div className="flex justify-between"><div><p className="font-display text-lg font-bold text-white">{order.orderId}</p><p className="text-xs text-slate-500">{order.customerName}</p></div><p className="font-display text-2xl font-bold text-lime">₹{order.amount}</p></div><div className="mt-4 grid grid-cols-2 gap-3"><StatusSelect kind="payment" value={order.paymentStatus} loading={updating === `${order.id}:payment`} onChange={(paymentStatus) => onUpdate(order, { paymentStatus }, 'payment')} /><StatusSelect kind="order" value={order.orderStatus} loading={updating === `${order.id}:order`} onChange={(orderStatus) => onUpdate(order, { orderStatus }, 'order')} /></div><button onClick={() => onView(order)} className="btn-secondary mt-4 w-full !py-2.5"><Eye size={15} /> View details</button></article> }
function UsersTable({ users, loading }) { return <section id="users" className="glass-panel mt-7 overflow-hidden rounded-2xl"><header className="border-b border-white/[0.07] p-5"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-300">Customer management</p><h2 className="mt-1 font-display text-2xl font-bold uppercase text-white">Registered users</h2></header>{loading ? <LoadingState /> : users.length === 0 ? <EmptyState label="No users yet" /> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-white/[0.06] text-[9px] uppercase text-slate-600">{['Name', 'Email', 'Phone', 'Joined Date', 'Total Orders'].map((column) => <th key={column} className="px-5 py-4">{column}</th>)}</tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-white/[0.05] text-xs"><td className="px-5 py-4 font-semibold text-white">{user.name || 'Customer'}</td><td className="px-5 py-4 text-cyan-300">{user.email}</td><td className="px-5 py-4 text-slate-400">{user.phone || '—'}</td><td className="px-5 py-4 text-slate-500">{formatDate(user.createdAt)}</td><td className="px-5 py-4 font-bold text-violet-300">{user.totalOrders}</td></tr>)}</tbody></table></div>}</section> }
function OrderDetails({ order, onClose }) { const copy = async (value, label) => { try { toast.success(await copyCustomerValue(value, label)) } catch (error) { toast.error(error.message) } }; return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="glass-panel mx-auto my-8 max-w-2xl rounded-2xl p-6"><div className="flex justify-between"><div><p className="text-xs text-lime">ORDER DETAILS</p><h2 className="font-display text-2xl font-bold text-white">{order.orderId}</h2></div><button onClick={onClose}><X /></button></div><div className="mt-6 grid gap-px overflow-hidden rounded-xl bg-white/[0.07] sm:grid-cols-2">{[['Customer', order.customerName], ['Email', order.email], ['WhatsApp', order.phone], ['Device', `${order.deviceName} ${order.deviceModel}`], ['RAM', order.ram], ['Android', order.androidVersion], ['Game', order.gameName], ['Payment ID', order.paymentId]].map(([label, value]) => <div key={label} className="flex justify-between bg-panel p-4"><div><p className="text-[9px] uppercase text-slate-600">{label}</p><p className="mt-1 text-xs text-slate-300">{value || '—'}</p></div>{['Email', 'WhatsApp'].includes(label) && <button onClick={() => copy(value, label)}><Clipboard size={14} /></button>}</div>)}</div></motion.div></motion.div> }
function LoadingState() { return <div className="grid min-h-52 place-items-center"><LoaderCircle className="animate-spin text-lime" /></div> }
function EmptyState({ label }) { return <div className="grid min-h-52 place-items-center text-center"><div><PackageCheck className="mx-auto text-slate-700" size={36} /><p className="mt-3 text-sm text-slate-400">{label}</p></div></div> }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { dateStyle: 'medium' }) }
