import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, Clipboard, CreditCard, Download, Eye, Image, LoaderCircle, LogOut, PackageCheck, Search, ShieldCheck, Sparkles, UserRound, Users, WalletCards, X } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { auth } from '../firebase'
import { copyCustomerValue, getStoredOrders, ORDERS_CHANGED_EVENT, ORDERS_STORAGE_KEY, ORDER_STATUSES, PAYMENT_STATUSES, resolveScreenshotUrl, updateAdminOrder } from '../services/orderService'
import { getCurrentUser, getUsers, USERS_CHANGED_EVENT, USERS_STORAGE_KEY } from '../services/authService'
import { ADMIN_EMAIL } from '../utils/adminAuth'

const paymentStyles = { Pending: 'border-amber-400/20 bg-amber-400/10 text-amber-300', Paid: 'border-lime/20 bg-lime/10 text-lime', Failed: 'border-red-400/20 bg-red-400/10 text-red-300' }
const orderStyles = { Pending: 'border-slate-400/20 bg-slate-400/10 text-slate-300', Processing: 'border-blue-400/20 bg-blue-400/10 text-blue-300', Delivered: 'border-violet-400/20 bg-violet-400/10 text-violet-300' }

function loadUsersFromStorage() {
  const users = JSON.parse(localStorage.getItem("sensi_users") || "[]")
  console.log("sensi_users", localStorage.getItem("sensi_users"))
  console.log("loaded users", users)
  return getUsers()
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState(() => getStoredOrders())
  const [localUsers, setLocalUsers] = useState(() => loadUsersFromStorage())
  const [filters, setFilters] = useState({ search: '', payment: 'All', order: 'All', plan: 'All' })
  const [updating, setUpdating] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const refreshUsers = (event) => {
      if (!event?.key || event.key === USERS_STORAGE_KEY) setLocalUsers(loadUsersFromStorage())
    }
    getCurrentUser()
    window.addEventListener('storage', refreshUsers)
    window.addEventListener(USERS_CHANGED_EVENT, refreshUsers)
    return () => {
      window.removeEventListener('storage', refreshUsers)
      window.removeEventListener(USERS_CHANGED_EVENT, refreshUsers)
    }
  }, [])

  useEffect(() => {
    const refreshOrders = (event) => {
      if (!event?.key || event.key === ORDERS_STORAGE_KEY) setOrders(getStoredOrders())
    }
    window.addEventListener('storage', refreshOrders)
    window.addEventListener(ORDERS_CHANGED_EVENT, refreshOrders)
    return () => {
      window.removeEventListener('storage', refreshOrders)
      window.removeEventListener(ORDERS_CHANGED_EVENT, refreshOrders)
    }
  }, [])

  const filteredOrders = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return orders.filter((order) => {
      const searchable = [order.customerName, order.email, order.phone, order.orderId].some((value) => String(value || '').toLowerCase().includes(search))
      return (!search || searchable)
        && (filters.payment === 'All' || order.paymentStatus === filters.payment)
        && (filters.order === 'All' || order.orderStatus === filters.order)
        && (filters.plan === 'All' || order.plan === filters.plan)
    })
  }, [orders, filters])

  const users = useMemo(() => {
    const ordersByEmail = new Map()
    orders.forEach((order) => {
      const email = normalizeEmail(order.email)
      if (!email) return
      const userOrders = ordersByEmail.get(email) || []
      userOrders.push(order)
      ordersByEmail.set(email, userOrders)
    })
    return localUsers
      .filter((user) => normalizeEmail(user.email) !== ADMIN_EMAIL)
      .map((user) => {
        const userOrders = ordersByEmail.get(normalizeEmail(user.email)) || []
        const latestOrder = userOrders[0]
        return {
          ...user,
          name: user.name || latestOrder?.customerName || 'Customer',
          phone: user.phone || latestOrder?.phone || '',
          totalOrders: userOrders.length,
        }
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }, [localUsers, orders])

  const stats = useMemo(() => ({
    users: users.filter((user) => user.role !== 'admin').length,
    total: orders.length,
    paid: orders.filter((order) => order.paymentStatus === 'Paid').length,
    pending: orders.filter((order) => order.orderStatus === 'Pending').length,
    delivered: orders.filter((order) => order.orderStatus === 'Delivered').length,
    revenue: orders.filter((order) => order.paymentStatus === 'Paid').reduce((sum, order) => sum + Number(order.amount || (order.plan === 'premium' ? 499 : 199)), 0),
  }), [orders, users])

  const updateOrder = async (order, changes, type) => {
    const updateKey = `${order.id}:${type}`
    setUpdating(updateKey)
    try {
      await updateAdminOrder(order.id, changes)
      toast.success('Order updated successfully.')
      if (selectedOrder?.id === order.id) setSelectedOrder((current) => ({ ...current, ...changes }))
    } catch (error) { console.error(error); toast.error(error.message) }
    finally { setUpdating('') }
  }

  const logout = async () => { await signOut(auth); navigate('/admin/login', { replace: true }) }

  return <section id="admin-dashboard" className="min-h-[calc(100vh-150px)] scroll-mt-24 py-10 sm:py-14"><div className="container-shell"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="flex flex-wrap items-center gap-2"><span className="eyebrow"><ShieldCheck size={13} /> Admin only</span><span className="rounded-full border border-lime/25 bg-lime/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-lime">Role: Admin</span></div><h1 className="mt-4 font-display text-4xl font-bold uppercase text-white sm:text-6xl">Order <span className="text-lime">Command Center</span></h1><p className="mt-2 text-sm text-slate-500">Payments, pending deliveries and customer setup details in one place.</p></div><button onClick={logout} className="btn-secondary !py-2.5"><LogOut size={15} /> Sign out</button></div>
    <div id="revenue" className="mt-9 grid scroll-mt-24 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"><StatCard icon={Users} label="Total Users" value={stats.users} color="text-cyan-300" /><StatCard icon={UserRound} label="Total Orders" value={stats.total} /><StatCard icon={CreditCard} label="Paid Orders" value={stats.paid} color="text-lime" /><StatCard icon={WalletCards} label="Pending Orders" value={stats.pending} color="text-amber-300" /><StatCard icon={CheckCircle2} label="Delivered Orders" value={stats.delivered} color="text-violet-300" /><StatCard icon={Sparkles} label="Total Revenue" value={`₹${stats.revenue.toLocaleString('en-IN')}`} color="text-lime" /></div>
    <div id="orders" className="glass-panel mt-7 scroll-mt-24 overflow-hidden rounded-2xl"><div id="customers" className="grid scroll-mt-24 gap-3 border-b border-white/[0.07] p-4 sm:p-5 lg:grid-cols-[minmax(240px,1fr)_180px_180px_180px]"><div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} /><input className="input-field !py-2.5 !pl-10" placeholder="Search name, email, phone, order ID…" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></div><FilterSelect value={filters.payment} onChange={(value) => setFilters({ ...filters, payment: value })} label="Payment" options={PAYMENT_STATUSES} /><FilterSelect value={filters.order} onChange={(value) => setFilters({ ...filters, order: value })} label="Order status" options={ORDER_STATUSES} /><FilterSelect value={filters.plan} onChange={(value) => setFilters({ ...filters, plan: value })} label="Plan" options={[['normal', 'Normal Sensi'], ['premium', 'Premium Sensi']]} pairs /></div>
      {filteredOrders.length === 0 ? <EmptyState hasOrders={orders.length > 0} /> : <><div className="hidden overflow-x-auto xl:block"><table className="w-full min-w-[1500px] text-left"><thead><tr className="border-b border-white/[0.06] text-[9px] uppercase tracking-[.14em] text-slate-600">{['Order ID', 'Customer', 'Email', 'WhatsApp', 'Device', 'Plan', 'Amount', 'Payment', 'Order Status', 'Created', 'Actions'].map((column) => <th key={column} className="px-4 py-4 font-bold first:pl-5 last:pr-5">{column}</th>)}</tr></thead><tbody>{filteredOrders.map((order) => <OrderRow key={order.id} order={order} updating={updating} onUpdate={updateOrder} onView={setSelectedOrder} />)}</tbody></table></div><div className="divide-y divide-white/[0.06] xl:hidden">{filteredOrders.map((order) => <OrderCard key={order.id} order={order} updating={updating} onUpdate={updateOrder} onView={setSelectedOrder} />)}</div></>}
    </div><UsersTable users={users} /></div><AnimatePresence>{selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdate={updateOrder} updating={updating} />}</AnimatePresence></section>
}

function StatCard({ icon: Icon, label, value, color = 'text-white' }) { return <div className="rounded-xl border border-white/[0.07] bg-panel/80 p-4"><div className="flex items-center justify-between"><p className="text-[9px] font-bold uppercase tracking-[.13em] text-slate-600">{label}</p><Icon size={15} className={color} /></div><p className={`mt-3 font-display text-3xl font-bold ${color}`}>{value}</p></div> }

function UsersTable({ users }) { return <section id="users" className="glass-panel mt-7 scroll-mt-24 overflow-hidden rounded-2xl"><header className="flex items-center justify-between border-b border-white/[0.07] p-5 sm:p-6"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-300">Customer management</p><h2 className="mt-1 font-display text-2xl font-bold uppercase text-white">Registered users</h2></div><span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-bold text-cyan-300">{users.length} USERS</span></header>{users.length === 0 ? <div className="grid min-h-52 place-items-center px-5 text-center"><div><Users className="mx-auto text-slate-700" size={36} /><p className="mt-3 text-sm font-semibold text-slate-300">No users yet</p><p className="mt-1 text-xs text-slate-600">Customers appear after a successful signup or login in this browser.</p></div></div> : <><div className="hidden overflow-x-auto md:block"><table className="w-full text-left"><thead><tr className="border-b border-white/[0.06] text-[9px] uppercase tracking-[.14em] text-slate-600">{['Name', 'Email', 'Phone / WhatsApp', 'Joined Date', 'Total Orders'].map((column) => <th key={column} className="px-5 py-4 font-bold">{column}</th>)}</tr></thead><tbody>{users.map((user) => <tr key={user.email} className="border-b border-white/[0.05] text-xs transition last:border-0 hover:bg-white/[0.018]"><td className="px-5 py-4 font-semibold text-white">{user.name}</td><td className="px-5 py-4"><a href={`mailto:${user.email}`} className="text-slate-400 transition hover:text-cyan-300">{user.email}</a></td><td className="px-5 py-4">{user.phone ? <a href={`tel:${user.phone}`} className="text-slate-400 transition hover:text-lime">{user.phone}</a> : <span className="text-slate-700">Not available</span>}</td><td className="px-5 py-4 text-slate-500">{formatJoinedDate(user.createdAt)}</td><td className="px-5 py-4"><span className="inline-flex min-w-8 justify-center rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 font-bold text-violet-300">{user.totalOrders}</span></td></tr>)}</tbody></table></div><div className="divide-y divide-white/[0.06] md:hidden">{users.map((user) => <article key={user.email} className="p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-display text-lg font-bold text-white">{user.name}</p><a href={`mailto:${user.email}`} className="mt-1 block truncate text-xs text-cyan-300">{user.email}</a></div><span className="shrink-0 rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[10px] font-bold text-violet-300">{user.totalOrders} orders</span></div><div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-white/[0.025] p-3"><Info label="WhatsApp" value={user.phone || 'Not available'} /><Info label="Joined" value={formatJoinedDate(user.createdAt)} /></div></article>)}</div></>}</section> }

function FilterSelect({ value, onChange, label, options, pairs = false }) { return <div className="relative"><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="input-field appearance-none !py-2.5 pr-9"><option value="All">All {label}</option>{options.map((option) => { const [valueOption, labelOption] = pairs ? option : [option, option]; return <option key={valueOption} value={valueOption} className="bg-panel">{labelOption}</option> })}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} /></div> }

function OrderRow({ order, updating, onUpdate, onView }) { return <tr className="border-b border-white/[0.05] text-xs transition last:border-0 hover:bg-white/[0.018]"><td className="px-5 py-4"><p className="font-display text-sm font-bold text-white">{order.orderId}</p></td><td className="px-4 py-4 font-semibold text-slate-200">{order.customerName}</td><td className="max-w-48 truncate px-4 py-4 text-slate-500" title={order.email}>{order.email}</td><td className="px-4 py-4 text-slate-400">{order.phone}</td><td className="px-4 py-4"><p className="text-slate-300">{order.deviceName}</p><p className="mt-1 text-[9px] text-slate-600">{order.deviceModel}</p></td><td className="px-4 py-4 text-slate-300">{order.planName}</td><td className="px-4 py-4 font-bold text-white">₹{order.amount}</td><td className="px-4 py-4"><StatusSelect kind="payment" value={order.paymentStatus} options={PAYMENT_STATUSES} loading={updating === `${order.id}:payment`} onChange={(paymentStatus) => onUpdate(order, { paymentStatus }, 'payment')} /></td><td className="px-4 py-4"><StatusSelect kind="order" value={order.orderStatus} options={ORDER_STATUSES} loading={updating === `${order.id}:order`} onChange={(orderStatus) => onUpdate(order, { orderStatus }, 'order')} /></td><td className="px-4 py-4 text-[10px] text-slate-600">{formatDate(order.createdAt)}</td><td className="px-5 py-4"><button onClick={() => onView(order)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 font-bold text-slate-400 transition hover:border-lime/30 hover:text-lime"><Eye size={14} /> View</button></td></tr> }

function OrderCard({ order, updating, onUpdate, onView }) { return <article className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-display text-lg font-bold text-white">{order.orderId}</p><p className="mt-1 text-[10px] text-slate-600">{formatDate(order.createdAt)}</p></div><p className="font-display text-2xl font-bold text-lime">₹{order.amount}</p></div><div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-white/[0.025] p-3 text-xs"><Info label="Customer" value={order.customerName} /><Info label="Device" value={`${order.deviceName} ${order.deviceModel || ''}`} /><Info label="Plan" value={order.planName} /><Info label="WhatsApp" value={order.phone} /></div><div className="mt-4 grid grid-cols-2 gap-3"><StatusSelect kind="payment" value={order.paymentStatus} options={PAYMENT_STATUSES} loading={updating === `${order.id}:payment`} onChange={(paymentStatus) => onUpdate(order, { paymentStatus }, 'payment')} /><StatusSelect kind="order" value={order.orderStatus} options={ORDER_STATUSES} loading={updating === `${order.id}:order`} onChange={(orderStatus) => onUpdate(order, { orderStatus }, 'order')} /></div><button onClick={() => onView(order)} className="btn-secondary mt-4 w-full !py-2.5"><Eye size={15} /> View customer details</button></article> }

function StatusSelect({ kind, value, options, loading, onChange }) { const styles = kind === 'payment' ? paymentStyles : orderStyles; return <div className="relative"><select disabled={loading} value={value} onChange={(event) => onChange(event.target.value)} className={`w-full min-w-28 appearance-none rounded-lg border px-3 py-2 pr-8 text-[10px] font-bold outline-none disabled:opacity-50 ${styles[value]}`}>{options.map((status) => <option key={status} className="bg-panel text-white">{status}</option>)}</select>{loading ? <LoaderCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin" size={12} /> : <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" size={12} />}</div> }

function OrderDetails({ order, onClose, onUpdate, updating }) { const copy = async (value, label) => { try { toast.success(await copyCustomerValue(value, label)) } catch (error) { toast.error(error.message) } }; const details = [['Customer', order.customerName], ['Email', order.email], ['WhatsApp', order.phone], ['Device', `${order.deviceName} ${order.deviceModel || ''}`], ['RAM', order.ram], ['Android', order.androidVersion], ['Game', order.gameName], ['Payment ID', order.paymentId || 'Not available']]; return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="glass-panel mx-auto my-6 max-w-4xl rounded-2xl"><header className="flex items-center justify-between border-b border-white/[0.07] p-5 sm:p-6"><div><p className="text-[10px] font-bold uppercase tracking-widest text-lime">Order details</p><h2 className="mt-1 font-display text-2xl font-bold text-white">{order.orderId}</h2></div><button onClick={onClose} className="grid size-9 place-items-center rounded-lg border border-white/10 text-slate-400 hover:text-white"><X size={18} /></button></header><div className="p-5 sm:p-6"><div className="grid gap-3 sm:grid-cols-2"><StatusSelect kind="payment" value={order.paymentStatus} options={PAYMENT_STATUSES} loading={updating === `${order.id}:payment`} onChange={(paymentStatus) => onUpdate(order, { paymentStatus }, 'payment')} /><StatusSelect kind="order" value={order.orderStatus} options={ORDER_STATUSES} loading={updating === `${order.id}:order`} onChange={(orderStatus) => onUpdate(order, { orderStatus }, 'order')} /></div><div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 bg-panel p-4"><Info label={label} value={value} />{['Email', 'WhatsApp'].includes(label) && <button onClick={() => copy(value, label)} className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-500 hover:text-lime" aria-label={`Copy ${label}`}><Clipboard size={14} /></button>}</div>)}</div><h3 className="mb-3 mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white"><Image size={15} className="text-lime" /> Uploaded screenshots</h3><div className="grid gap-4 sm:grid-cols-2"><ScreenshotCard label="HUD Screenshot" value={order.hudScreenshotUrl} /><ScreenshotCard label="Sensitivity Screenshot" value={order.sensiScreenshotUrl} /></div></div></motion.div></motion.div> }

function ScreenshotCard({ label, value }) { const [url, setUrl] = useState(''); const [loading, setLoading] = useState(Boolean(value)); useEffect(() => { let active = true; if (value) resolveScreenshotUrl(value).then((result) => { if (active) setUrl(result) }).catch(() => {}).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [value]); if (loading) return <div className="grid min-h-48 place-items-center rounded-xl border border-white/10"><LoaderCircle className="animate-spin text-lime" /></div>; if (!url) return <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-white/10 text-xs text-slate-600">Screenshot unavailable</div>; return <div className="group relative min-h-52 overflow-hidden rounded-xl border border-white/10 bg-black"><img src={url} alt={label} className="absolute inset-0 size-full object-cover opacity-70 transition group-hover:scale-105 group-hover:opacity-90" /><div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4"><span className="text-xs font-bold text-white">{label}</span><div className="flex gap-2"><a href={url} target="_blank" rel="noreferrer" className="rounded-lg bg-black/70 px-3 py-2 text-[10px] font-bold text-lime">View</a><a href={url} download className="grid size-8 place-items-center rounded-lg bg-black/70 text-lime"><Download size={14} /></a></div></div></div> }

function Info({ label, value }) { return <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 truncate text-xs font-medium text-slate-300" title={value}>{value || '—'}</p></div> }
function EmptyState({ hasOrders }) { return <div className="grid min-h-72 place-items-center px-5 text-center"><div><PackageCheck className="mx-auto text-slate-700" size={40} /><h2 className="mt-4 font-display text-2xl font-bold uppercase text-white">{hasOrders ? 'No matching orders' : 'No orders yet'}</h2><p className="mt-2 text-xs text-slate-600">{hasOrders ? 'Try changing your search or filters.' : 'Orders saved in this browser will appear here.'}</p></div></div> }
function formatDate(timestamp) { return timestamp?.toDate ? timestamp.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now' }
function normalizeEmail(email) { return String(email || '').trim().toLowerCase() }
function formatJoinedDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString('en-IN', { dateStyle: 'medium' }) }
