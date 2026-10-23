import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import api from '../services/api'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState(
    location.state?.registeredEmail ?? '',
  )
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [errors, setErrors] = useState({})

  const signupSuccess = location.state?.signupSuccess

  function validate() {
    const nextErrors = {}

    if (!email.trim()) {
      nextErrors.email = 'Enter your email address.'
    } else if (
      email.trim().length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = 'Enter your password.'
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)
    setApiError('')

    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)

    try {
      const response = await api.post('/api/auth/login', {
        email: email.trim(),
        password,
      })

      const accessToken = response.data?.accessToken

      if (!accessToken) {
        setApiError(
          'Login response did not contain an access token. Please try again.',
        )
        return
      }

      localStorage.setItem('fintrack_access_token', accessToken)
      localStorage.setItem(
        'fintrack_token_type',
        response.data?.tokenType || 'Bearer',
      )

      navigate('/dashboard', { replace: true })
    } catch (error) {
      const status = error.response?.status
      const data = error.response?.data

      if (!error.response) {
        setApiError(
          'Could not connect to FinTrack. Check that the backend is running.',
        )
      } else if (status === 401 || status === 403) {
        setApiError('Email or password is incorrect. Please try again.')
      } else if (status === 400) {
        setApiError(
          data?.detail ||
            data?.message ||
            'Please check your email and password.',
        )
      } else {
        setApiError(
          data?.detail ||
            data?.message ||
            'Something went wrong. Please try again.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mercury-login">
      <header className="ml-header">
        <Link
          className="ml-brand"
          to="/"
          aria-label="FinTrack home"
        >
          <span className="ml-brand-mark">f</span>
          <span>fintrack</span>
        </Link>

        <div className="ml-header-right">
          <span>New to FinTrack?</span>
          <Link to="/signup" className="ml-header-link">
            Create account <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>

      <main className="ml-main">
        <section className="ml-intro">
          <div className="ml-overline">
            <span className="ml-overline-dot" />
            YOUR FINANCES, MORE CLEARLY
          </div>

          <h1>
            Good to have
            <br />
            you <span>back.</span>
          </h1>

          <p className="ml-subtitle">
            Pick up where you left off. Sign in to see your accounts,
            track your activity, and stay on top of your money.
          </p>
        </section>

        <div className="ml-layout">
          <aside className="ml-aside">
            <p className="ml-aside-title">
              Your financial picture, all in one place.
            </p>

            <div className="ml-benefit">
              <span className="ml-check">
                <ShieldCheck size={16} />
              </span>
              <div>
                <strong>Your accounts, organized</strong>
                <p>Keep track of the accounts you manage.</p>
              </div>
            </div>

            <div className="ml-benefit">
              <span className="ml-check">
                <ArrowRight size={16} />
              </span>
              <div>
                <strong>Know where money goes</strong>
                <p>Review income, expenses, and transfers.</p>
              </div>
            </div>

            <div className="ml-note">
              <LockKeyhole size={16} />
              <span>
                Your sign-in is verified securely by the FinTrack backend.
              </span>
            </div>
          </aside>

          <section className="ml-form-card">
            <div className="ml-form-heading">
              <span className="ml-form-label">WELCOME BACK</span>
              <h2>Sign in to FinTrack</h2>
              <p>Enter your details to access your account.</p>
            </div>

            {signupSuccess && (
              <div className="ml-success-banner" role="status">
                Account created successfully. You can now sign in.
              </div>
            )}

            {apiError && (
              <div className="ml-error-banner" role="alert">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="ml-field">
                <label htmlFor="login-email">Email address</label>

                <div
                  className={`ml-input ${
                    errors.email ? 'is-invalid' : ''
                  }`}
                >
                  <Mail size={17} />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    maxLength={255}
                    disabled={loading}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setErrors((previous) => ({
                        ...previous,
                        email: '',
                      }))
                      setApiError('')
                    }}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? 'login-email-error' : undefined
                    }
                  />
                </div>

                {errors.email && (
                  <small id="login-email-error">
                    {errors.email}
                  </small>
                )}
              </div>

              <div className="ml-field">
                <div className="ml-password-label">
                  <label htmlFor="login-password">Password</label>
                  <Link to="/forgot-password" className="ml-forgot-link">
                    Forgot password?
                  </Link>
                </div>

                <div
                  className={`ml-input ${
                    errors.password ? 'is-invalid' : ''
                  }`}
                >
                  <LockKeyhole size={17} />

                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    disabled={loading}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setErrors((previous) => ({
                        ...previous,
                        password: '',
                      }))
                      setApiError('')
                    }}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? 'login-password-error' : undefined
                    }
                  />

                  <button
                    type="button"
                    className="ml-eye"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <small id="login-password-error">
                    {errors.password}
                  </small>
                )}
              </div>

              <button
                type="submit"
                className="ml-submit"
                disabled={loading}
              >
                <span>
                  {loading ? 'Signing in…' : 'Sign in to your account'}
                </span>

                {loading ? (
                  <span className="ml-loader" />
                ) : (
                  <ArrowRight size={17} />
                )}
              </button>

              <p className="ml-terms">
                By signing in, you agree to use FinTrack responsibly and
                keep your account credentials private.
              </p>
            </form>

            <div className="ml-bottom-link">
              Don't have an account? <Link to="/signup">Create one</Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="ml-footer">
        <span>© {new Date().getFullYear()} FinTrack</span>
        <span>Clarity for your money.</span>
      </footer>
    </div>
  )
}

export default Login