
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import api from '../services/api'
import './PasswordReset.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/api/auth/forgot-password', {
        email: email.trim(),
      })

      setMessage(
        response.data?.message ||
          'If an account exists for this email, a password reset link will be sent.',
      )
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.detail ||
          'Unable to process your request. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="password-page">
      <header className="password-header">
        <Link to="/" className="password-brand">
          <span className="password-brand-mark">f</span>
          <span>fintrack<span className="password-brand-dot">.</span></span>
        </Link>
        <span className="password-header-note">ACCOUNT RECOVERY</span>
      </header>

      <section className="password-content">
        <div className="password-card">
          <div className="password-icon">
            <Mail size={27} />
          </div>

          <span className="password-eyebrow">PASSWORD RECOVERY</span>
          <h1>Forgot your password?</h1>
          <p className="password-description">
            Enter the email address associated with your FinTrack account.
            We’ll send you a link to reset your password.
          </p>

          {message && (
            <div className="password-alert password-success" role="status">
              {message}
            </div>
          )}

          {error && (
            <div className="password-alert password-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="recovery-email">Email address</label>
            <input
              id="recovery-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={255}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Sending request...' : 'Send reset link'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <Link to="/login" className="password-back-link">
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>

        <p className="password-footer">
          YOUR FINANCES, MORE CLEARLY
        </p>
      </section>
    </main>
  )
}

export default ForgotPassword
