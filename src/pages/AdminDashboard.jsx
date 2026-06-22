import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  Clipboard,
  CreditCard,
  Eye,
  FileText,
  Filter,
  Gamepad2,
  LoaderCircle,
  LogOut,
  MessageSquareText,
  Package,
  PackageCheck,
  Save,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/auth-context'
import { PLAN_AMOUNTS } from '../config/paymentConfig'
import { getUsers } from '../services/authService'
import { copyCustomerValue, getAllOrders, updateAdminOrder } from '../services/orderService'

const PACKAGE_OPTIONS = [
  { value: 'all', label: 'All packages' },
  { value: 'normal', label: 'Normal Sensi' },
  { value: 'premium', label: 'Premium Sensi' },
]
const PAYMENT_OPTIONS = ['All payments', 'Pending', 'Paid', 'Failed']
const ORDER_OPTIONS = ['All order statuses', 'Pending', 'Processing', 'Delivered']
const paymentStyles = {
  Pending: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  Paid: 'border-lime/20 bg-lime/10 text-lime',
  Failed: 'border-red-400/20 bg-red-400/10 text-red-300',
}
const orderStyles = {
  Pending: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
  Processing: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
  Delivered: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [packageFilter, setPackageFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('All payments')
  const [orderFilter, setOrderFilter] = useState('All order statuses')
  const [updating, setUpdating] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    Promise.allSettled([getUsers(), getAllOrders()])
      .then(([usersResult, ordersResult]) => {
        if (!active) return
        if (ordersResult.status === 'rejected') throw ordersResult.reason
        const orderRows = ordersResult.value
        console.log("Loaded orders:", orderRows)
        setOrders(orderRows)
        if (usersResult.status === 'fulfilled') {
          setUsers(usersResult.value.filter((user) => user.role !== 'admin'))
        } else {
          console.warn('Users could not be loaded:', usersResult.reason)
        }
      })
      .catch((error) => {
        console.error(error)
        toast.error(error.message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filteredOrders = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesSearch = !needle || [
        order.orderId,
        order.customerName,
        order.email,
        order.phone,
        order.deviceName,
        order.deviceModel,
        order.gameName,
        order.paymentId,
      ].some((value) => String(value || '').toLowerCase().includes(needle))
      return matchesSearch
        && (packageFilter === 'all' || order.plan === packageFilter)
        && (paymentFilter === 'All payments' || order.paymentStatus === paymentFilter)
        && (orderFilter === 'All order statuses' || order.orderStatus === orderFilter)
    })
  }, [orders, search, packageFilter, paymentFilter, orderFilter])

  const customerRows = useMemo(() => users.map((user) => ({
    ...user,
    totalOrders: orders.filter((order) => order.email.toLowerCase() === user.email.toLowerCase()).length,
  })), [users, orders])

  const stats = useMemo(() => ({
    users: users.length,
    total: orders.length,
    normal: orders.filter((order) => order.plan === 'normal').length,
    premium: orders.filter((order) => order.plan === 'premium').length,
    pendingPayments: orders.filter((order) => order.paymentStatus === 'Pending').length,
    revenue: orders
      .filter((order) => order.paymentStatus === 'Paid')
      .reduce((sum, order) => sum + (order.amount ?? PLAN_AMOUNTS[order.plan] ?? 0), 0),
  }), [users.length, orders])

  const updateOrder = async (order, changes, type) => {
    setUpdating(`${order.id}:${type}`)
    try {
      const updated = await updateAdminOrder(order.id, changes)
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item))
      setSelectedOrder((current) => current?.id === updated.id ? updated : current)
      toast.success(type === 'notes' ? 'Admin notes saved.' : 'Order updated successfully.')
      return updated
    } catch (error) {
      toast.error(error.message)
      return null
    } finally {
      setUpdating('')
    }
  }

  const clearFilters = () => {
    setPackageFilter('all')
    setPaymentFilter('All payments')
    setOrderFilter('All order statuses')
  }
  const hasFilters = packageFilter !== 'all' || paymentFilter !== 'All payments' || orderFilter !== 'All order statuses'
  const signOut = async () => { await logout(); navigate('/admin/login', { replace: true }) }

  return (
    <section className="min-h-[calc(100vh-150px)] py-8 sm:py-14">
      <div className="container-shell">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow"><ShieldCheck size={13} /> Supabase admin</span>
            <h1 className="mt-4 font-display text-4xl font-bold uppercase text-white sm:text-6xl">Order <span className="text-lime">Command Center</span></h1>
            <p className="mt-2 text-sm text-slate-500">Manage packages, payments, fulfilment, and customer notes.</p>
          </div>
          <button onClick={signOut} className="btn-secondary w-fit !py-2.5"><LogOut size={15} /> Sign out</button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard icon={Users} label="Total Users" value={stats.users} color="text-cyan-300" />
          <StatCard icon={UserRound} label="Total Orders" value={stats.total} />
          <StatCard icon={Package} label="Normal Sensi Orders" value={stats.normal} color="text-blue-300" />
          <StatCard icon={Sparkles} label="Premium Sensi Orders" value={stats.premium} color="text-violet-300" />
          <StatCard icon={WalletCards} label="Pending Payments" value={stats.pendingPayments} color="text-amber-300" />
          <StatCard icon={CreditCard} label="Total Revenue" value={`₹${stats.revenue.toLocaleString('en-IN')}`} color="text-lime" />
        </div>

        <section id="orders" className="glass-panel mt-7 overflow-hidden rounded-2xl">
          <header className="border-b border-white/[0.07] p-4 sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input className="input-field !py-2.5 !pl-10" placeholder="Search order, customer, device, game, or UTR…" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:w-[660px]">
                <FilterSelect value={packageFilter} onChange={setPackageFilter} options={PACKAGE_OPTIONS} />
                <FilterSelect value={paymentFilter} onChange={setPaymentFilter} options={PAYMENT_OPTIONS} />
                <FilterSelect value={orderFilter} onChange={setOrderFilter} options={ORDER_OPTIONS} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <span className="flex items-center gap-1.5"><Filter size={12} /> Showing {filteredOrders.length} of {orders.length} orders</span>
              {hasFilters && <button onClick={clearFilters} className="text-lime hover:text-white">Clear filters</button>}
            </div>
          </header>

          {loading ? <LoadingState /> : filteredOrders.length === 0 ? <EmptyState label="No matching orders" /> : (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[2650px] text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[9px] uppercase tracking-[.12em] text-slate-600">
                      {['Order ID', 'Customer Name', 'Email', 'WhatsApp Number', 'Device Name', 'Device Model', 'RAM', 'Android Version', 'Game Name', 'Selected Plan', 'Sensi Package', 'Amount', 'UTR / Transaction ID', 'Payment Status', 'Order Status', 'Order Date', 'Actions'].map((column) => <th key={column} className="whitespace-nowrap px-4 py-4">{column}</th>)}
                    </tr>
                  </thead>
                  <tbody>{filteredOrders.map((order) => <OrderRow key={order.id} order={order} onView={setSelectedOrder} />)}</tbody>
                </table>
              </div>
              <div className="divide-y divide-white/[0.06] xl:hidden">
                {filteredOrders.map((order) => <OrderCard key={order.id} order={order} onView={setSelectedOrder} />)}
              </div>
            </>
          )}
        </section>

        <UsersTable users={customerRows} loading={loading} />
      </div>

      <AnimatePresence>
        {selectedOrder && <OrderDetails order={selectedOrder} updating={updating} onUpdate={updateOrder} onClose={() => setSelectedOrder(null)} />}
      </AnimatePresence>
    </section>
  )
}

function StatCard({ icon: Icon, label, value, color = 'text-white' }) {
  return <div className="rounded-xl border border-white/[0.07] bg-panel/80 p-4"><div className="flex justify-between gap-2"><p className="text-[9px] font-bold uppercase tracking-[.12em] text-slate-600">{label}</p><Icon size={15} className={color} /></div><p className={`mt-3 font-display text-3xl font-bold ${color}`}>{value}</p></div>
}

function FilterSelect({ value, onChange, options }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="input-field !py-2.5 text-xs">{options.map((option) => { const item = typeof option === 'string' ? { value: option, label: option } : option; return <option key={item.value} value={item.value} className="bg-panel">{item.label}</option> })}</select>
}

function StatusBadge({ type, value }) {
  const styles = type === 'payment' ? paymentStyles : orderStyles
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-bold ${styles[value] || 'border-white/10 bg-white/5 text-slate-500'}`}>{displayValue(value)}</span>
}

function PackageBadge({ order }) {
  if (!order.plan) return <span className="text-slate-600">-</span>
  const premium = order.plan === 'premium'
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-bold ${premium ? 'border-violet-400/25 bg-violet-400/10 text-violet-300' : 'border-blue-400/25 bg-blue-400/10 text-blue-300'}`}>{packageLabel(order)}</span>
}

function OrderRow({ order, onView }) {
  return (
    <tr className="border-b border-white/[0.05] text-xs hover:bg-white/[0.02]">
      <td className="whitespace-nowrap px-4 py-4 font-bold text-white">{displayValue(order.orderId)}</td>
      <td className="px-4 py-4 text-slate-200">{displayValue(order.customerName)}</td>
      <td className="px-4 py-4 text-cyan-300">{displayValue(order.email)}</td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-400">{displayValue(order.phone)}</td>
      <td className="px-4 py-4 text-slate-300">{displayValue(order.deviceName)}</td>
      <td className="px-4 py-4 text-slate-300">{displayValue(order.deviceModel)}</td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-400">{displayValue(order.ram)}</td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-400">{displayValue(order.androidVersion)}</td>
      <td className="px-4 py-4 text-slate-300">{displayValue(order.gameName)}</td>
      <td className="capitalize px-4 py-4 text-slate-400">{displayValue(order.plan)}</td>
      <td className="whitespace-nowrap px-4 py-4"><PackageBadge order={order} /></td>
      <td className="px-4 py-4 font-bold text-lime">{formatAmount(order.amount)}</td>
      <td className="px-4 py-4 font-mono text-slate-300">{displayValue(order.paymentId)}</td>
      <td className="px-4 py-4"><StatusBadge type="payment" value={order.paymentStatus} /></td>
      <td className="px-4 py-4"><StatusBadge type="order" value={order.orderStatus} /></td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-500">{formatDate(order.createdAt)}</td>
      <td className="px-4 py-4"><button onClick={() => onView(order)} className="btn-secondary whitespace-nowrap !px-3 !py-2"><Eye size={14} /> View Order</button></td>
    </tr>
  )
}

function OrderCard({ order, onView }) {
  return (
    <article className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="font-display text-lg font-bold text-white">{displayValue(order.orderId)}</p><p className="mt-1 text-xs text-slate-500">{displayValue(order.customerName)} · {formatDate(order.createdAt)}</p></div>
        <p className="font-display text-2xl font-bold text-lime">{formatAmount(order.amount)}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <MobileField label="Package" value={packageLabel(order)} />
        <MobileField label="Device" value={[order.deviceName, order.deviceModel].filter(Boolean).join(' ')} />
        <MobileField label="Game / RAM" value={[order.gameName, order.ram].filter(Boolean).join(' · ')} />
        <MobileField label="Android Version" value={order.androidVersion} />
        <MobileField label="UTR / Transaction ID" value={order.paymentId} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><StatusBadge type="payment" value={order.paymentStatus} /><StatusBadge type="order" value={order.orderStatus} /></div>
      <button onClick={() => onView(order)} className="btn-secondary mt-4 w-full !py-2.5"><Eye size={15} /> View Order</button>
    </article>
  )
}

function MobileField({ label, value }) {
  return <div className="rounded-lg bg-white/[0.025] p-3"><p className="text-[9px] font-bold uppercase text-slate-600">{label}</p><p className="mt-1 break-words text-slate-300">{displayValue(value)}</p></div>
}

function OrderDetails({ order, updating, onUpdate, onClose }) {
  const [notes, setNotes] = useState(order.notes || '')
  useEffect(() => { setNotes(order.notes || '') }, [order.id, order.notes])
  const busy = updating.startsWith(`${order.id}:`)
  const copy = async (value, label) => {
    try { toast.success(await copyCustomerValue(value, label)) }
    catch (error) { toast.error(error.message) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="glass-panel mx-auto my-3 max-w-5xl overflow-hidden rounded-2xl sm:my-8">
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.07] p-5 sm:p-7">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-lime">Order details</p><h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">{displayValue(order.orderId)}</h2><p className="mt-1 text-xs text-slate-500">Placed {formatDate(order.createdAt)}</p></div>
          <button onClick={onClose} aria-label="Close order details" className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white"><X size={18} /></button>
        </header>

        <div className="grid gap-5 p-4 sm:p-7 lg:grid-cols-2">
          <InfoSection icon={FileText} title="Order Information" items={[
            ['Order ID', order.orderId],
            ['Order Date', formatDate(order.createdAt)],
          ]} onCopy={copy} />
          <InfoSection icon={UserRound} title="Customer Information" items={[
            ['Name', order.customerName],
            ['Email', order.email, true],
            ['WhatsApp', order.phone, true],
          ]} onCopy={copy} />
          <InfoSection icon={Smartphone} title="Device Information" items={[
            ['Device Name', order.deviceName],
            ['Device Model', order.deviceModel],
            ['RAM', order.ram],
            ['Android Version', order.androidVersion],
          ]} onCopy={copy} />
          <InfoSection icon={Gamepad2} title="Game Information" items={[["Game Name", order.gameName]]} onCopy={copy} />
          <InfoSection icon={Package} title="Package Information" items={[
            ['Selected Package', packageLabel(order)],
            ['Amount', formatAmount(order.amount)],
          ]} onCopy={copy} />
          <InfoSection icon={CreditCard} title="Payment Information" items={[
            ['UTR / Transaction ID', order.paymentId, true],
            ['Payment Status', order.paymentStatus],
          ]} onCopy={copy} />
          <InfoSection icon={PackageCheck} title="Delivery Information" items={[
            ['Order Status', order.orderStatus],
            ['Notes', order.notes],
          ]} onCopy={copy} />
        </div>

        <section className="border-t border-white/[0.07] p-4 sm:p-7">
          <div className="flex items-center gap-2"><MessageSquareText size={17} className="text-lime" /><h3 className="font-display text-lg font-bold uppercase text-white">Admin Notes</h3></div>
          <p className="mt-1 text-xs text-slate-500">Add fulfilment context such as recoil issues, device-specific packages, or play-style preferences.</p>
          <textarea maxLength="2000" rows="4" value={notes} onChange={(event) => setNotes(event.target.value)} className="input-field mt-4 resize-y" placeholder="Example: High recoil issue · iPhone package · Aggressive headshot settings" />
          <div className="mt-2 flex justify-between text-[10px] text-slate-600"><span>Visible to administrators</span><span>{notes.length}/2000</span></div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <ActionButton disabled={busy} onClick={() => onUpdate(order, { paymentStatus: 'Paid' }, 'payment')} color="lime"><CheckCircle2 size={15} /> Mark Paid</ActionButton>
            <ActionButton disabled={busy} onClick={() => onUpdate(order, { paymentStatus: 'Failed' }, 'payment')} color="red"><X size={15} /> Mark Failed</ActionButton>
            <ActionButton disabled={busy} onClick={() => onUpdate(order, { orderStatus: 'Processing' }, 'order')} color="blue"><LoaderCircle size={15} /> Mark Processing</ActionButton>
            <ActionButton disabled={busy} onClick={() => onUpdate(order, { orderStatus: 'Delivered' }, 'order')} color="violet"><PackageCheck size={15} /> Mark Delivered</ActionButton>
            <ActionButton disabled={busy || notes.trim() === order.notes} onClick={() => onUpdate(order, { notes }, 'notes')} color="neutral">{updating === `${order.id}:notes` ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />} Save Notes</ActionButton>
          </div>
        </section>
      </motion.div>
    </motion.div>
  )
}

function InfoSection({ icon: Icon, title, items, onCopy }) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
      <header className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3"><Icon size={15} className="text-lime" /><h3 className="text-[10px] font-bold uppercase tracking-[.15em] text-white">{title}</h3></header>
      <div className="divide-y divide-white/[0.05]">{items.map(([label, value, copyable]) => <div key={label} className="flex items-start justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="text-[9px] font-bold uppercase text-slate-600">{label}</p><p className="mt-1 break-words text-xs leading-5 text-slate-300">{displayValue(value)}</p></div>{copyable && value && <button onClick={() => onCopy(value, label)} className="shrink-0 rounded-md p-1.5 text-slate-600 hover:bg-white/5 hover:text-lime"><Clipboard size={13} /></button>}</div>)}</div>
    </section>
  )
}

function ActionButton({ children, disabled, onClick, color }) {
  const colors = {
    lime: 'border-lime/25 bg-lime/10 text-lime hover:bg-lime/20',
    red: 'border-red-400/25 bg-red-400/10 text-red-300 hover:bg-red-400/20',
    blue: 'border-blue-400/25 bg-blue-400/10 text-blue-300 hover:bg-blue-400/20',
    violet: 'border-violet-400/25 bg-violet-400/10 text-violet-300 hover:bg-violet-400/20',
    neutral: 'border-white/10 bg-white/5 text-white hover:bg-white/10',
  }
  return <button disabled={disabled} onClick={onClick} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[10px] font-bold uppercase transition disabled:cursor-not-allowed disabled:opacity-40 ${colors[color]}`}>{children}</button>
}

function UsersTable({ users, loading }) {
  return <section id="users" className="glass-panel mt-7 overflow-hidden rounded-2xl"><header className="border-b border-white/[0.07] p-5"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-300">Customer management</p><h2 className="mt-1 font-display text-2xl font-bold uppercase text-white">Registered users</h2></header>{loading ? <LoadingState /> : users.length === 0 ? <EmptyState label="No users yet" /> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-white/[0.06] text-[9px] uppercase text-slate-600">{['Name', 'Email', 'Phone', 'Joined Date', 'Total Orders'].map((column) => <th key={column} className="px-5 py-4">{column}</th>)}</tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-white/[0.05] text-xs"><td className="px-5 py-4 font-semibold text-white">{user.name || 'Customer'}</td><td className="px-5 py-4 text-cyan-300">{user.email}</td><td className="px-5 py-4 text-slate-400">{user.phone || '—'}</td><td className="px-5 py-4 text-slate-500">{formatDate(user.createdAt)}</td><td className="px-5 py-4 font-bold text-violet-300">{user.totalOrders}</td></tr>)}</tbody></table></div>}</section>
}

function LoadingState() {
  return <div className="grid min-h-52 place-items-center"><LoaderCircle className="animate-spin text-lime" /></div>
}

function EmptyState({ label }) {
  return <div className="grid min-h-52 place-items-center text-center"><div><FileText className="mx-auto text-slate-700" size={36} /><p className="mt-3 text-sm text-slate-400">{label}</p></div></div>
}

function packageLabel(order) {
  if (order.plan === 'premium') return `Premium Sensi ₹${PLAN_AMOUNTS.premium}`
  if (order.plan === 'normal') return `Normal Sensi ₹${PLAN_AMOUNTS.normal}`
  return '-'
}

function displayValue(value) {
  return value === null || value === undefined || String(value).trim() === '' ? '-' : value
}

function formatAmount(value) {
  return Number.isFinite(value) ? `₹${value.toLocaleString('en-IN')}` : '-'
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}
