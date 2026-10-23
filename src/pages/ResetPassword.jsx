
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, LockKeyhole, CheckCircle2 } from 'lucide-react'
import api from '../services/api'
import './PasswordReset.css'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!token.trim()) {
      setError('Reset token missing hai. Email wala reset link open karein.')
      return
    }

    if (password.length < 8 || password.length > 72) {
      setError('Password 8 se 72 characters ka hona chahiye.')
      return
    }

    if (password !== confirmPassword) {
      setError('Dono passwords match nahi kar rahe.')
      return
    }

    setLoading(true)

    try {
      await api.post('/api/auth/reset-password', {
        token,
        newPassword: password,
      })

      setSuccess(true)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.detail ||
          'Password reset nahi ho saka. Link expire ho gaya ho sakta hai.',
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
        <span className="password-header-note">ACCOUNT SECURITY</span>
      </header>

      <section className="password-content">
        <div className="password-card">
          <div className="password-icon">
            {success ? (
              <CheckCircle2 size={28} />
            ) : (
              <LockKeyhole size={27} />
            )}
          </div>

          {success ? (
            <>
              <span className="password-eyebrow">ALL SET</span>
              <h1>Password updated</h1>
              <p className="password-description">
                Your password has been changed successfully. You can now
                sign in using your new password.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
              >
                Continue to sign in
              </button>
            </>
          ) : (
            <>
              <span className="password-eyebrow">NEW PASSWORD</span>
              <h1>Create a new password</h1>
              <p className="password-description">
                Choose a new password for your FinTrack account. Use at
                least 8 characters.
              </p>

              {error && (
                <div className="password-alert password-error" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  maxLength={72}
                  required
                />

                <label htmlFor="confirm-new-password">
                  Confirm new password
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  maxLength={72}
                  required
                />

                <button type="submit" disabled={loading}>
                  {loading ? 'Updating password...' : 'Reset password'}
                </button>
              </form>
            </>
          )}

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

export default ResetPassword
