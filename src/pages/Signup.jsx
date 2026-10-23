
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  Check,
  ShieldCheck,
} from 'lucide-react'
import api from '../services/api'
import './Signup.css'

function Signup() {
  const navigate = useNavigate()

  const [values, setValues] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setValues((previous) => ({
      ...previous,
      [name]: value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }))

    setApiError('')
  }

  function validate() {
    const nextErrors = {}
    const username = values.username.trim()
    const email = values.email.trim()

    if (!username) {
      nextErrors.username = 'Please enter your username.'
    } else if (username.length > 50) {
      nextErrors.username = 'Username must be 50 characters or fewer.'
    }

    if (!email) {
      nextErrors.email = 'Please enter your email address.'
    } else if (
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!values.password) {
      nextErrors.password = 'Please create a password.'
    } else if (
      values.password.length < 8 ||
      values.password.length > 72
    ) {
      nextErrors.password = 'Password must contain 8–72 characters.'
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = 'Your passwords do not match.'
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)
    setApiError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/api/auth/register', {
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
      })

      navigate('/login', {
        replace: true,
        state: {
          signupSuccess: true,
          registeredEmail:
            response.data?.email ?? values.email.trim(),
        },
      })
    } catch (error) {
      const status = error.response?.status
      const data = error.response?.data

      if (status === 409) {
        setApiError(
          data?.detail ||
            data?.message ||
            data?.error ||
            'An account with this username or email already exists.',
        )
      } else if (status === 400) {
        setApiError(
          data?.detail ||
            data?.message ||
            'Some details are invalid. Please review the form.',
        )
      } else if (!error.response) {
        setApiError(
          'Could not connect to FinTrack. Please check whether the backend is running.',
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
    <div className="signup-page">
      <header className="signup-header">
        <Link className="signup-brand" to="/" aria-label="FinTrack home">
          <span className="signup-brand-mark">f</span>
          <span>
            fintrack<span className="signup-brand-dot">.</span>
          </span>
        </Link>

        <div className="signup-header-right">
          <span>Already have an account?</span>
          <Link to="/login" className="signup-signin-link">
            Sign in <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>

      <main className="signup-main">
        <section className="signup-intro">
          <span className="signup-eyebrow">
            <span className="signup-eyebrow-dot" />
            A CLEARER VIEW OF YOUR MONEY
          </span>

          <h1>
            Take control of
            <br />
            your <span>financial life.</span>
          </h1>

          <p>
            Bring your accounts, income and expenses together.
            Understand your money and make more informed decisions.
          </p>
        </section>

        <section className="signup-layout">
          <aside className="signup-benefits">
            <span className="signup-benefits-label">WHY FINTRACK</span>

            <h2>
              Your finances,
              <br />
              all in one place.
            </h2>

            <p className="signup-benefits-description">
              A simpler way to see what comes in, what goes out,
              and where your money stands.
            </p>

            <div className="signup-benefit">
              <span className="signup-check">
                <Check size={15} />
              </span>
              <div>
                <strong>Organize your accounts</strong>
                <p>Keep your financial accounts structured in one place.</p>
              </div>
            </div>

            <div className="signup-benefit">
              <span className="signup-check">
                <Check size={15} />
              </span>
              <div>
                <strong>Track income and expenses</strong>
                <p>Record transactions and understand your spending.</p>
              </div>
            </div>

            <div className="signup-benefit">
              <span className="signup-check">
                <Check size={15} />
              </span>
              <div>
                <strong>Review your financial overview</strong>
                <p>See useful summaries through your dashboard.</p>
              </div>
            </div>

            <div className="signup-security-note">
              <ShieldCheck size={19} />
              <div>
                <strong>Your account, protected</strong>
                <p>
                  Your password is securely hashed by the backend.
                  Never share your password with anyone.
                </p>
              </div>
            </div>
          </aside>

          <section className="signup-card">
            <div className="signup-card-heading">
              <span className="signup-card-label">GET STARTED</span>
              <h2>Create your account</h2>
              <p>Set up your FinTrack account in a few simple steps.</p>
            </div>

            {apiError && (
              <div className="signup-error-banner" role="alert">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="signup-field">
                <label htmlFor="signup-username">Username</label>

                <div
                  className={`signup-input ${
                    errors.username ? 'has-error' : ''
                  }`}
                >
                  <UserRound size={18} aria-hidden="true" />

                  <input
                    id="signup-username"
                    name="username"
                    type="text"
                    value={values.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    autoComplete="username"
                    maxLength={50}
                    aria-invalid={Boolean(errors.username)}
                    aria-describedby={
                      errors.username ? 'signup-username-error' : undefined
                    }
                    disabled={loading}
                  />
                </div>

                {errors.username && (
                  <small id="signup-username-error">
                    {errors.username}
                  </small>
                )}
              </div>

              <div className="signup-field">
                <label htmlFor="signup-email">Email address</label>

                <div
                  className={`signup-input ${
                    errors.email ? 'has-error' : ''
                  }`}
                >
                  <Mail size={18} aria-hidden="true" />

                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    maxLength={255}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? 'signup-email-error' : undefined
                    }
                    disabled={loading}
                  />
                </div>

                {errors.email && (
                  <small id="signup-email-error">{errors.email}</small>
                )}
              </div>

              <div className="signup-field">
                <label htmlFor="signup-password">Password</label>

                <div
                  className={`signup-input ${
                    errors.password ? 'has-error' : ''
                  }`}
                >
                  <LockKeyhole size={18} aria-hidden="true" />

                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    maxLength={72}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? 'signup-password-error' : undefined
                    }
                    disabled={loading}
                  />

                  <button
                    className="signup-eye"
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <small id="signup-password-error">
                    {errors.password}
                  </small>
                )}
              </div>

              <div className="signup-field">
                <label htmlFor="signup-confirm-password">
                  Confirm password
                </label>

                <div
                  className={`signup-input ${
                    errors.confirmPassword ? 'has-error' : ''
                  }`}
                >
                  <LockKeyhole size={18} aria-hidden="true" />

                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={values.confirmPassword}
                    onChange={handleChange}
                    placeholder="Enter your password again"
                    autoComplete="new-password"
                    maxLength={72}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={
                      errors.confirmPassword
                        ? 'signup-confirm-password-error'
                        : undefined
                    }
                    disabled={loading}
                  />

                  <button
                    className="signup-eye"
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((previous) => !previous)
                    }
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirmation password'
                        : 'Show confirmation password'
                    }
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <small id="signup-confirm-password-error">
                    {errors.confirmPassword}
                  </small>
                )}
              </div>

              <button
                className="signup-submit"
                type="submit"
                disabled={loading}
              >
                <span>
                  {loading ? 'Creating your account…' : 'Create account'}
                </span>

                {loading ? (
                  <span className="signup-spinner" aria-label="Loading" />
                ) : (
                  <ArrowRight size={18} />
                )}
              </button>

              <p className="signup-terms">
                By creating an account, you agree to keep your login
                credentials private and use FinTrack responsibly.
              </p>
            </form>

            <div className="signup-card-footer">
              <LockKeyhole size={14} />
              <span>Your password is never sent as plain text storage.</span>
            </div>
          </section>
        </section>
      </main>

      <footer className="signup-footer">
        <span>© {new Date().getFullYear()} FinTrack</span>
        <Link to="/">Back to home</Link>
        <span>Clarity for your financial life.</span>
      </footer>
    </div>
  )
}

export default Signup
