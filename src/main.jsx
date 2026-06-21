import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import App from './App'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ToastContainer
          position="bottom-right"
          theme="dark"
          autoClose={3500}
          toastClassName="!bg-panel !border !border-white/10 !rounded-xl"
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
