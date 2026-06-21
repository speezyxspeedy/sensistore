import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'

export default function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) return <div className="grid min-h-[70vh] place-items-center"><span className="size-8 animate-spin rounded-full border-2 border-lime/20 border-t-lime" /></div>
  if (!user) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}
