import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return <div className="grid min-h-[70vh] place-items-center"><span className="size-7 animate-spin rounded-full border-2 border-lime/20 border-t-lime" /></div>
  if (!user) return <Navigate to={`/account?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  return children
}
