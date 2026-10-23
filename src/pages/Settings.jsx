
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Settings as SettingsIcon,
  ShieldCheck,
  Tags,
  Trash2,
  Wallet,
  ArrowRight,
  LoaderCircle,
  UserRound,
  Pencil,
  Save,
  X,
} from 'lucide-react'
import api from '../services/api'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const location = useLocation()

  const [profile, setProfile] = useState(null)
  const [username, setUsername] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = localStorage.getItem('fintrack_access_token')

  function handleLogout() {
    localStorage.removeItem('fintrack_access_token')
    localStorage.removeItem('fintrack_token_type')
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoadingProfile(true)
      setError('')

      try {
        const response = await api.get('/api/users/me')

        if (!active) return

        setProfile(response.data)
        setUsername(response.data.username || '')
      } catch (requestError) {
        if (!active) return

        const status = requestError.response?.status

        if (status === 401 || status === 403) {
          localStorage.removeItem('fintrack_access_token')
          localStorage.removeItem('fintrack_token_type')
          navigate('/login', { replace: true })
          return
        }

        setError(
          requestError.response?.data?.message ||
            'Profile load nahi ho saka. Please dobara try karo.',
        )
      } finally {
        if (active) setLoadingProfile(false)
      }
    }

    if (!token) {
      navigate('/login', { replace: true })
      return () => {
        active = false
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [navigate, token])

  async function handleUpdateUsername(event) {
    event.preventDefault()

    const trimmedUsername = username.trim()

    if (!trimmedUsername) {
      setError('Username khali nahi ho sakta.')
      return
    }

    if (trimmedUsername.length > 50) {
      setError('Username 50 characters se zyada nahi ho sakta.')
      return
    }

    if (trimmedUsername === profile?.username) {
      setEditingProfile(false)
      setError('')
      return
    }

    setSavingProfile(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.patch('/api/users/me', {
        username: trimmedUsername,
      })

      setProfile(response.data)
      setUsername(response.data.username || trimmedUsername)
      setEditingProfile(false)
      setSuccess('Username successfully update ho gaya.')
    } catch (requestError) {
      const status = requestError.response?.status

      if (status === 401 || status === 403) {
        localStorage.removeItem('fintrack_access_token')
        localStorage.removeItem('fintrack_token_type')
        navigate('/login', { replace: true })
        return
      }

      setError(
        requestError.response?.data?.message ||
          'Username update nahi ho saka. Please dobara try karo.',
      )
    } finally {
      setSavingProfile(false)
    }
  }

  function cancelProfileEdit() {
    setUsername(profile?.username || '')
    setEditingProfile(false)
    setError('')
  }

  async function handleDeleteAccount() {
    if (confirmation !== 'DELETE') return

    if (!localStorage.getItem('fintrack_access_token')) {
      navigate('/login', { replace: true })
      return
    }

    setDeleting(true)
    setError('')
    setSuccess('')

    try {
      await api.delete('/api/auth/me')

      localStorage.removeItem('fintrack_access_token')
      localStorage.removeItem('fintrack_token_type')

      navigate('/', {
        replace: true,
        state: { message: 'Your account has been closed successfully.' },
      })
    } catch (requestError) {
      const status = requestError.response?.status

      if (status === 401 || status === 403) {
        localStorage.removeItem('fintrack_access_token')
        localStorage.removeItem('fintrack_token_type')
        navigate('/login', { replace: true })
        return
      }

      setError(
        requestError.response?.data?.message ||
          'Account close nahi ho saka. Please dobara try karo.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="dashboard-page settings-page">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">
          <span className="dashboard-brand-mark">f</span>
          <span>
            fintrack<span className="dashboard-brand-dot">.</span>
          </span>
        </Link>

        <div className="dashboard-sidebar-caption">WORKSPACE</div>

        <nav className="dashboard-nav" aria-label="Main navigation">
          <Link
            to="/dashboard"
            className={`dashboard-nav-link ${
              location.pathname === '/dashboard' ? 'active' : ''
            }`}
          >
            <LayoutDashboard size={19} />
            <span>Overview</span>
          </Link>

          <Link
            to="/accounts"
            className={`dashboard-nav-link ${
              location.pathname === '/accounts' ? 'active' : ''
            }`}
          >
            <Wallet size={19} />
            <span>Accounts</span>
          </Link>

          <Link
            to="/transactions"
            className={`dashboard-nav-link ${
              location.pathname === '/transactions' ? 'active' : ''
            }`}
          >
            <ArrowLeftRight size={19} />
            <span>Transactions</span>
          </Link>

          <Link
            to="/categories"
            className={`dashboard-nav-link ${
              location.pathname === '/categories' ? 'active' : ''
            }`}
          >
            <Tags size={19} />
            <span>Categories</span>
          </Link>

          <Link
            to="/settings"
            className={`dashboard-nav-link ${
              location.pathname === '/settings' ? 'active' : ''
            }`}
          >
            <SettingsIcon size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user-mark">FT</div>
          <div className="dashboard-user-copy">
            <strong>{profile?.username || 'My FinTrack'}</strong>
            <span>Personal workspace</span>
          </div>
          <button
            className="dashboard-logout-icon"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="dashboard-main settings-main">
        <header className="dashboard-topbar settings-topbar">
          <div>
            <span className="dashboard-breadcrumb">
              WORKSPACE / SETTINGS
            </span>
            <h1>Settings</h1>
            <p>Manage your account and security preferences.</p>
          </div>
        </header>

        {success && (
          <div className="settings-alert settings-alert-success" role="status">
            <CheckCircle2 size={19} />
            {success}
          </div>
        )}

        {error && (
          <div className="settings-alert settings-alert-error" role="alert">
            <AlertTriangle size={19} />
            {error}
          </div>
        )}

        <section className="settings-welcome">
          <div className="settings-welcome-icon">
            <SettingsIcon size={25} />
          </div>
          <div>
            <span className="dashboard-section-kicker">YOUR WORKSPACE</span>
            <h2>Account &amp; security</h2>
            <p>
              Your financial workspace, account access and security options
              in one place.
            </p>
          </div>
          <span className="settings-status">
            <ShieldCheck size={16} />
            {token ? 'Session active' : 'Sign in required'}
          </span>
        </section>

        <section className="settings-section">
          <div className="settings-section-heading">
            <div>
              <span className="dashboard-section-kicker">PERSONAL</span>
              <h2>Profile information</h2>
              <p>View and manage your account profile.</p>
            </div>
            <UserRound size={22} />
          </div>

          <div className="settings-info-row">
            <div className="settings-info-icon">
              <UserRound size={19} />
            </div>

            <div className="settings-info-copy">
              <strong>Username and profile</strong>

              {loadingProfile ? (
                <span>Loading profile...</span>
              ) : editingProfile ? (
                <form
                  onSubmit={handleUpdateUsername}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginTop: '10px',
                    maxWidth: '380px',
                  }}
                >
                  <label htmlFor="settings-username">Username</label>
                  <input
                    id="settings-username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    maxLength={50}
                    required
                    autoComplete="username"
                    disabled={savingProfile}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      font: 'inherit',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="submit"
                      className="settings-action-link"
                      disabled={savingProfile}
                      style={{ cursor: savingProfile ? 'wait' : 'pointer' }}
                    >
                      {savingProfile ? (
                        <LoaderCircle
                          size={15}
                          className="settings-spin"
                        />
                      ) : (
                        <Save size={15} />
                      )}
                      {savingProfile ? 'Saving...' : 'Save changes'}
                    </button>

                    <button
                      type="button"
                      className="settings-cancel-button"
                      onClick={cancelProfileEdit}
                      disabled={savingProfile}
                    >
                      <X size={15} />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <span>
                  {profile?.username || 'Username not available'}
                </span>
              )}
            </div>

            {!loadingProfile && !editingProfile && (
              <button
                type="button"
                className="settings-action-link"
                onClick={() => {
                  setError('')
                  setSuccess('')
                  setUsername(profile?.username || '')
                  setEditingProfile(true)
                }}
                disabled={!profile}
              >
                <Pencil size={15} />
                Edit username
              </button>
            )}
          </div>

          <div className="settings-info-row">
            <div className="settings-info-icon">
              <Mail size={19} />
            </div>
            <div className="settings-info-copy">
              <strong>Email address</strong>
              <span>
                {loadingProfile
                  ? 'Loading email address...'
                  : profile?.email || 'Email address not available'}
              </span>
            </div>
            <span className="settings-coming-soon">Read only</span>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-heading">
            <div>
              <span className="dashboard-section-kicker">SECURITY</span>
              <h2>Login &amp; security</h2>
              <p>Keep your account access secure.</p>
            </div>
            <LockKeyhole size={22} />
          </div>

          <div className="settings-info-row">
            <div className="settings-info-icon">
              <LockKeyhole size={19} />
            </div>
            <div className="settings-info-copy">
              <strong>Password recovery</strong>
              <span>
                Request a password reset link through your registered email.
              </span>
            </div>
            <Link to="/forgot-password" className="settings-action-link">
              Reset password <ArrowRight size={15} />
            </Link>
          </div>

          <div className="settings-info-row">
            <div className="settings-info-icon">
              <ShieldCheck size={19} />
            </div>
            <div className="settings-info-copy">
              <strong>Change password</strong>
              <span>
                Forgot your current password? Request a secure reset link
                through your registered email.
              </span>
            </div>
            <Link to="/forgot-password" className="settings-action-link">
              Change password <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <section className="settings-section settings-danger-section">
          <div className="settings-section-heading">
            <div>
              <span className="settings-danger-kicker">DANGER ZONE</span>
              <h2>Close your account</h2>
              <p>
                Account closure may affect access to your FinTrack data.
              </p>
            </div>
            <Trash2 size={22} />
          </div>

          <div className="settings-danger-content">
            <div>
              <strong>Delete account</strong>
              <p>
                This sends a permanent account-closure request to the backend.
                Make sure you really want to continue.
              </p>
            </div>
            <button
              type="button"
              className="settings-delete-button"
              onClick={() => {
                setError('')
                setSuccess('')
                setConfirmation('')
                setShowDeleteConfirm((current) => !current)
              }}
              disabled={deleting}
            >
              <Trash2 size={16} />
              Delete account
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="settings-delete-confirm">
              <div className="settings-confirm-heading">
                <AlertTriangle size={21} />
                <div>
                  <strong>Are you absolutely sure?</strong>
                  <p>Type DELETE below to confirm account closure.</p>
                </div>
              </div>

              <label htmlFor="delete-confirmation">
                Type DELETE to continue
              </label>
              <input
                id="delete-confirmation"
                type="text"
                value={confirmation}
                onChange={(event) =>
                  setConfirmation(event.target.value.toUpperCase())
                }
                placeholder="DELETE"
                autoComplete="off"
                disabled={deleting}
              />

              <div className="settings-confirm-actions">
                <button
                  type="button"
                  className="settings-cancel-button"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setConfirmation('')
                    setError('')
                  }}
                  disabled={deleting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="settings-delete-button"
                  onClick={handleDeleteAccount}
                  disabled={deleting || confirmation !== 'DELETE'}
                >
                  {deleting ? (
                    <>
                      <LoaderCircle size={16} className="settings-spin" />
                      Closing account…
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Confirm deletion
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          <span>© {new Date().getFullYear()} FinTrack</span>
          <span>Clarity for your financial life.</span>
        </footer>
      </main>
    </div>
  )
}

export default Settings
