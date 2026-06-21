import { Instagram, Mail, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.07] bg-[#04060a] py-10">
      <div className="container-shell grid gap-8 text-center md:grid-cols-[1.2fr_1fr_1fr] md:text-left">
        <div>
          <Logo />
          <p className="mt-3 text-xs text-slate-600">Precision settings. Built for your device.</p>
        </div>
        <div><p className="text-xs font-bold uppercase tracking-widest text-white">Company</p><div className="mt-4 grid gap-2 text-xs text-slate-500"><Link to="/contact" className="hover:text-lime">Contact</Link><Link to="/terms" className="hover:text-lime">Terms & Conditions</Link><Link to="/refund-policy" className="hover:text-lime">Refund Policy</Link><Link to="/privacy-policy" className="hover:text-lime">Privacy Policy</Link></div></div>
        <div><p className="text-xs font-bold uppercase tracking-widest text-white">Community</p><div className="mt-4 flex justify-center gap-2 md:justify-start"><a href={import.meta.env.VITE_DISCORD_URL || '#'} className="grid size-9 place-items-center rounded-lg border border-white/[0.07] text-slate-500 transition hover:border-lime/30 hover:text-lime" aria-label="Discord"><MessageCircle size={16} /></a><a href={import.meta.env.VITE_INSTAGRAM_URL || '#'} className="grid size-9 place-items-center rounded-lg border border-white/[0.07] text-slate-500 transition hover:border-lime/30 hover:text-lime" aria-label="Instagram"><Instagram size={16} /></a><Link to="/contact" className="grid size-9 place-items-center rounded-lg border border-white/[0.07] text-slate-500 transition hover:border-lime/30 hover:text-lime" aria-label="Email"><Mail size={16} /></Link></div><p className="mt-4 text-xs text-slate-600">© {new Date().getFullYear()} Sensi Store.</p></div>
      </div>
    </footer>
  )
}
