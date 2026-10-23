
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom'

import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import ConnectionTest from './pages/ConnectionTest'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Settings from './pages/Settings'

function NotFoundPage() {
  return (
    <main
      style={{
        width: '100%',
        maxWidth: '600px',
        margin: '80px auto',
        padding: '32px 24px',
        textAlign: 'center',
      }}
    >
      <h1>404 — Page not found</h1>

      <p>The page you're looking for doesn't exist.</p>

      <Link to="/">Back to home</Link>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Password recovery */}
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* FinTrack workspace */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/settings" element={<Settings />} />

        {/* API connection testing */}
        <Route
          path="/connection-test"
          element={<ConnectionTest />}
        />

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
