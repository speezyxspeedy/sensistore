import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { AuthContext } from './auth-context'
import { isAdmin as checkIsAdmin } from '../utils/adminAuth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    const admin = checkIsAdmin(nextUser)
    console.log('Current user email:', nextUser?.email || 'Not signed in')
    console.log('Is admin:', admin)
    setUser(nextUser)
    setLoading(false)
  }), [])

  const value = useMemo(() => {
    const admin = checkIsAdmin(user)
    return { user, loading, isAdmin: admin, role: admin ? 'Admin' : 'Customer' }
  }, [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
