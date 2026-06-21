import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

const Order = lazy(() => import('./pages/Order'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Pricing = lazy(() => import('./pages/Pricing'))
const Account = lazy(() => import('./pages/Account'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const PaymentReturn = lazy(() => import('./pages/PaymentReturn'))
const Contact = lazy(() => import('./pages/Contact'))
const Legal = lazy(() => import('./pages/Legal'))

export default function App() {
  return (
    <div className="min-h-screen overflow-hidden bg-ink text-white">
      <div className="pointer-events-none fixed inset-0 bg-grid bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      <ScrollToTop />
      <Navbar />
      <main className="relative">
        <Suspense fallback={<div className="grid min-h-[70vh] place-items-center"><span className="size-7 animate-spin rounded-full border-2 border-lime/20 border-t-lime" /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/order" element={<ProtectedRoute><Order /></ProtectedRoute>} />
            <Route path="/payment/return" element={<ProtectedRoute><PaymentReturn /></ProtectedRoute>} />
            <Route path="/payment" element={<Navigate to="/order" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Legal type="terms" />} />
            <Route path="/refund-policy" element={<Legal type="refund" />} />
            <Route path="/privacy-policy" element={<Legal type="privacy" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
