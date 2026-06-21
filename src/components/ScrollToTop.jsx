import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView(), 0)
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}
