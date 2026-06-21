import { IndianRupee, LayoutDashboard, LogIn, Menu, PackageSearch, ShieldCheck, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../contexts/auth-context'

const publicLinks = [
  { label: 'Home', to: '/' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'FAQ', to: '/#faq' },
  { label: 'Contact', to: '/contact' },
]

const adminLinks = [
  { label: 'Admin Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Orders', to: '/admin#orders', icon: PackageSearch },
  { label: 'Revenue', to: '/admin#revenue', icon: IndianRupee },
  { label: 'Customer Management', to: '/admin#users', icon: Users },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, isAdmin, role } = useAuth()
  const visibleLinks = isAdmin ? adminLinks : publicLinks

  return (
    <header className="relative z-50 border-b border-white/[0.06] bg-ink/80 backdrop-blur-xl">
      <div className="container-shell flex h-[74px] items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {visibleLinks.map((link) => (
            <NavLink key={link.label} to={link.to} className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 transition hover:text-white">
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user && <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${isAdmin ? 'border-lime/25 bg-lime/10 text-lime' : 'border-violet-400/20 bg-violet-400/10 text-violet-300'}`}>Role: {role}</span>}
          <Link to={user ? (isAdmin ? '/admin' : '/dashboard') : '/account'} className="flex items-center gap-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-white">
            {user ? (isAdmin ? <ShieldCheck size={15} /> : <LayoutDashboard size={15} />) : <LogIn size={15} />} {user ? (isAdmin ? 'Admin' : 'My orders') : 'Sign in'}
          </Link>
          {!isAdmin && <Link to="/order" className="btn-primary !px-4 !py-2.5">Get your sensi</Link>}
        </div>
        <button onClick={() => setOpen(!open)} className="grid size-10 place-items-center rounded-lg border border-white/10 text-white md:hidden" aria-label="Toggle navigation">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="absolute left-0 top-full w-full border-b border-white/10 bg-panel px-5 py-5 shadow-2xl md:hidden">
          <div className="flex flex-col gap-1">
            {user && <span className={`mb-2 w-fit rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${isAdmin ? 'border-lime/25 bg-lime/10 text-lime' : 'border-violet-400/20 bg-violet-400/10 text-violet-300'}`}>Role: {role}</span>}
            {visibleLinks.map((link) => (
              <Link key={link.label} to={link.to} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5">{link.icon && <link.icon size={15} className="text-lime" />}{link.label}</Link>
            ))}
            <Link to={user ? (isAdmin ? '/admin' : '/dashboard') : '/account'} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5">{user ? (isAdmin ? 'Admin Dashboard' : 'My orders') : 'Sign in'}</Link>
            {!isAdmin && <Link to="/order" onClick={() => setOpen(false)} className="btn-primary mt-3">Get your sensi</Link>}
          </div>
        </div>
      )}
    </header>
  )
}
