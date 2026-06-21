import { Crosshair } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Sensi Store home">
      <span className="grid size-9 place-items-center rounded-lg border border-lime/30 bg-lime/10 text-lime transition group-hover:rotate-12">
        <Crosshair size={20} strokeWidth={2.4} />
      </span>
      <span className="font-display text-xl font-bold uppercase tracking-[0.08em] text-white">
        Sensi <span className="text-lime">Store</span>
      </span>
    </Link>
  )
}
