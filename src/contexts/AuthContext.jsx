import { useCallback, useEffect, useMemo, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { AuthContext } from './auth-context'
import { isAdmin as checkIsAdmin } from '../utils/adminAuth'
import { registerUser } from '../services/authService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    if (nextUser && !checkIsAdmin(nextUser)) registerUser({
      id: nextUser.uid,
      name: nextUser.displayName || '',
      email: nextUser.email,
      phone: '',
      password: '',
      role: 'customer',
      createdAt: nextUser.metadata?.creationTime,
    })
    setUser(nextUser)
    setLoading(false)
  }, () => {
    setUser(null)
    setLoading(false)
  }), [])

  const signup = useCallback(async ({ name, email, phone, password }) => {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
    const cleanName = name.trim()
    await updateProfile(credential.user, { displayName: cleanName })
    if (!checkIsAdmin(credential.user)) registerUser({
      id: credential.user.uid,
      name: cleanName,
      email: credential.user.email,
      phone: String(phone || '').trim(),
      password: '',
      role: 'customer',
      createdAt: credential.user.metadata?.creationTime,
    })
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      name: cleanName,
      email: credential.user.email,
      phone: String(phone || '').trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return credential.user
  }, [])

  const login = useCallback(async (email, password) => (
    await signInWithEmailAndPassword(auth, email.trim(), password)
  ).user, [])
  const logout = useCallback(() => signOut(auth), [])
  const resetPassword = useCallback((email) => sendPasswordResetEmail(auth, email.trim()), [])

  const value = useMemo(() => {
    const admin = checkIsAdmin(user)
    return { user, loading, isAdmin: admin, role: admin ? 'Admin' : 'Customer', signup, login, logout, resetPassword }
  }, [user, loading, signup, login, logout, resetPassword])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
