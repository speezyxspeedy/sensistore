import { Image, UploadCloud, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const MAX_FILE_SIZE = 5 * 1024 * 1024

export default function UploadField({ label, hint, value, onChange, required = true }) {
  const [preview, setPreview] = useState('')

  useEffect(() => {
    if (!value) {
      setPreview('')
      return undefined
    }
    const objectUrl = URL.createObjectURL(value)
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [value])

  const chooseFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.')
      event.target.value = ''
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be smaller than 5 MB.')
      event.target.value = ''
      return
    }
    onChange(file)
  }

  return (
    <div>
      <label className="label">{label} {required && <span className="text-lime">*</span>}</label>
      <label className={`group relative flex min-h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed transition ${value ? 'border-lime/35 bg-lime/[0.025]' : 'border-white/15 bg-white/[0.02] hover:border-lime/40 hover:bg-lime/[0.02]'}`}>
        <input type="file" accept="image/png,image/jpeg,image/webp" required={required} onChange={chooseFile} className="sr-only" />
        {preview ? (
          <>
            <img src={preview} alt={`${label} preview`} className="absolute inset-0 size-full object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/50 to-transparent" />
            <div className="relative z-10 flex flex-col items-center px-4 text-center">
              <Image size={25} className="text-lime" />
              <p className="mt-2 max-w-[230px] truncate text-xs font-semibold text-white">{value.name}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Click to replace</p>
            </div>
            <button type="button" onClick={(event) => { event.preventDefault(); onChange(null) }} className="absolute right-2 top-2 z-20 grid size-7 place-items-center rounded-full bg-black/70 text-white hover:bg-red-500" aria-label="Remove file"><X size={14} /></button>
          </>
        ) : (
          <div className="flex flex-col items-center px-4 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-white/[0.05] text-slate-400 transition group-hover:bg-lime/10 group-hover:text-lime"><UploadCloud size={20} /></span>
            <p className="mt-3 text-xs font-semibold text-slate-300">Tap to upload screenshot</p>
            <p className="mt-1 text-[10px] text-slate-600">PNG, JPG or WEBP · Max 5 MB</p>
          </div>
        )}
      </label>
      {hint && <p className="mt-2 text-[11px] leading-4 text-slate-600">{hint}</p>}
    </div>
  )
}
