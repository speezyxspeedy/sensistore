import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth-context'
import { getCurrentUser, loginUser, logoutUser, registerUser, restoreSession } from '../services/authService.js'
import { isAdmin as checkIsAdmin } from '../utils/adminAuth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    restoreSession()
      .then((nextUser) => { if (active) setUser(nextUser) })
      .catch((error) => {
        console.error('Supabase session restore failed:', error)
        if (active) setUser(null)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const signup = useCallback(async (form) => {
    const nextUser = await registerUser(form)
    setUser(nextUser)
    return nextUser
  }, [])
  const login = useCallback(async (email, password) => {
    const nextUser = await loginUser(email, password)
    setUser(nextUser)
    return nextUser
  }, [])
  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
  }, [])
  const value = useMemo(() => {
    const admin = checkIsAdmin(user)
    return { user, loading, isAdmin: admin, role: admin ? 'Admin' : 'Customer', signup, login, logout }
  }, [user, loading, signup, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
