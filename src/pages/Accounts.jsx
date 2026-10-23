import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  Landmark,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ArrowLeftRight,
  LayoutDashboard,
  Tags,
  Settings,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import api from '../services/api'
import './Accounts.css'

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

function getErrorMessage(error) {
  if (error.response?.status === 401) {
    return 'Your session may have expired. Please sign in again.'
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to view these accounts.'
  }

  if (!error.response) {
    return 'Cannot connect to the server. Check that your backend is running.'
  }

  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    'Something went wrong. Please try again.'
  )
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState('BANK')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadAccounts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    setError('')

    try {
      const response = await api.get('/api/accounts')
      const data = response.data
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const totalBalance = useMemo(
    () =>
      accounts.reduce(
        (total, account) =>
          total +
          Number(
            account.balance ??
              account.currentBalance ??
              account.availableBalance ??
              0,
          ),
        0,
      ),
    [accounts],
  )

  async function handleCreateAccount(event) {
    event.preventDefault()
    setFormError('')
    setSuccessMessage('')

    const name = accountName.trim()

    if (!name) {
      setFormError('Please enter an account name.')
      return
    }

    if (name.length > 50) {
      setFormError('Account name cannot exceed 50 characters.')
      return
    }

    setSaving(true)

    try {
      await api.post('/api/accounts/create', {
        name,
        type: accountType,
      })

      setAccountName('')
      setAccountType('BANK')
      setModalOpen(false)
      setSuccessMessage('Account created successfully.')
      await loadAccounts(true)
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="accounts-page">
      <aside className="accounts-sidebar">
        <Link to="/" className="accounts-brand" aria-label="FinTrack home">
          <span className="accounts-brand-mark">f</span>
          <span>fintrack.</span>
        </Link>

        <div className="accounts-nav-label">WORKSPACE</div>

        <nav className="accounts-navigation" aria-label="Main navigation">
          <Link to="/dashboard" className="accounts-nav-link">
            <LayoutDashboard size={19} />
            <span>Overview</span>
          </Link>

          <Link to="/accounts" className="accounts-nav-link active">
            <Wallet size={19} />
            <span>Accounts</span>
          </Link>

          <Link to="/transactions" className="accounts-nav-link">
            <ArrowLeftRight size={19} />
            <span>Transactions</span>
          </Link>

          <Link to="/categories" className="accounts-nav-link">
            <Tags size={19} />
            <span>Categories</span>
          </Link>

          <Link to="/settings" className="accounts-nav-link">
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="accounts-sidebar-footer">
          <span className="accounts-avatar">FT</span>
          <div>
            <strong>My FinTrack</strong>
            <small>Personal workspace</small>
          </div>
        </div>
      </aside>

      <main className="accounts-main">
        <header className="accounts-topbar">
          <div>
            <div className="accounts-eyebrow">WORKSPACE / ACCOUNTS</div>
            <h1>My accounts</h1>
            <p>Keep your cash and bank accounts organized in one place.</p>
          </div>

          <button
            type="button"
            className="accounts-refresh-button"
            onClick={() => loadAccounts(true)}
            disabled={loading || refreshing}
            aria-label="Refresh accounts"
          >
            <RefreshCw size={17} className={refreshing ? 'accounts-spinning' : ''} />
            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </header>

        {successMessage && (
          <div className="accounts-alert accounts-alert-success" role="status">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="accounts-summary-grid">
          <article className="accounts-summary-card accounts-summary-primary">
            <div className="accounts-summary-icon">
              <Wallet size={21} />
            </div>
            <span>Total account balance</span>
            <strong>
              {loading ? 'Loading…' : formatCurrency(totalBalance)}
            </strong>
            <small>Combined balance across returned accounts</small>
          </article>

          <article className="accounts-summary-card">
            <div className="accounts-summary-icon">
              <Landmark size={21} />
            </div>
            <span>Bank accounts</span>
            <strong>
              {loading
                ? '—'
                : accounts.filter(
                    (account) => account.type?.toUpperCase() === 'BANK',
                  ).length}
            </strong>
            <small>Accounts marked as bank</small>
          </article>

          <article className="accounts-summary-card">
            <div className="accounts-summary-icon">
              <Wallet size={21} />
            </div>
            <span>Cash accounts</span>
            <strong>
              {loading
                ? '—'
                : accounts.filter(
                    (account) => account.type?.toUpperCase() === 'CASH',
                  ).length}
            </strong>
            <small>Accounts marked as cash</small>
          </article>
        </section>

        <section className="accounts-list-section">
          <div className="accounts-section-heading">
            <div>
              <h2>Your accounts</h2>
              <p>View the accounts returned by your FinTrack backend.</p>
            </div>

            <button
              type="button"
              className="accounts-add-button"
              onClick={() => {
                setFormError('')
                setAccountName('')
                setAccountType('BANK')
                setModalOpen(true)
              }}
            >
              <Plus size={18} />
              Add account
            </button>
          </div>

          {error && (
            <div className="accounts-alert accounts-alert-error" role="alert">
              <AlertCircle size={19} />
              <div>
                <strong>Could not load accounts</strong>
                <p>{error}</p>
                <button type="button" onClick={() => loadAccounts()}>
                  Try again
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="accounts-state">
              <RefreshCw size={25} className="accounts-spinning" />
              <p>Loading your accounts…</p>
            </div>
          ) : !error && accounts.length === 0 ? (
            <div className="accounts-empty">
              <span className="accounts-empty-icon">
                <Wallet size={28} />
              </span>
              <h3>Your accounts will appear here</h3>
              <p>Create your first cash or bank account to get started.</p>
              <button
                type="button"
                className="accounts-add-button"
                onClick={() => setModalOpen(true)}
              >
                <Plus size={18} />
                Create your first account
              </button>
            </div>
          ) : (
            !error && (
              <div className="accounts-card-grid">
                {accounts.map((account) => {
                  const isBank = account.type?.toUpperCase() === 'BANK'
                  const balance =
                    account.balance ??
                    account.currentBalance ??
                    account.availableBalance

                  return (
                    <article
                      className="account-card"
                      key={account.id}
                    >
                      <div className="account-card-top">
                        <span
                          className={`account-type-icon ${isBank ? 'bank' : 'cash'}`}
                        >
                          {isBank ? (
                            <Landmark size={22} />
                          ) : (
                            <Wallet size={22} />
                          )}
                        </span>
                        <span className="account-type-badge">
                          {account.type || 'Account'}
                        </span>
                      </div>

                      <h3>{account.name || 'Unnamed account'}</h3>
                      <p>
                        {isBank ? 'Bank account' : 'Cash account'}
                        {account.id != null ? ` · ID ${account.id}` : ''}
                      </p>

                      <div className="account-card-divider" />

                      <div className="account-balance-row">
                        <span>Current balance</span>
                        <strong>
                          {balance == null
                            ? 'Not provided by API'
                            : formatCurrency(balance)}
                        </strong>
                      </div>

                      <div className="account-card-bottom">
                        <span>Account details</span>
                        <ArrowUpRight size={17} />
                      </div>
                    </article>
                  )
                })}
              </div>
            )
          )}
        </section>

        <footer className="accounts-footer">
          <span>© {new Date().getFullYear()} FinTrack</span>
          <span>Clarity for your financial life.</span>
        </footer>
      </main>

      {modalOpen && (
        <div
          className="accounts-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false)
            }
          }}
        >
          <section
            className="accounts-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accounts-modal-title"
          >
            <div className="accounts-modal-heading">
              <div>
                <div className="accounts-eyebrow">NEW ACCOUNT</div>
                <h2 id="accounts-modal-title">Add an account</h2>
                <p>Choose a name and account type.</p>
              </div>

              <button
                type="button"
                className="accounts-modal-close"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="accounts-alert accounts-alert-error" role="alert">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="accounts-form">
              <label htmlFor="account-name">Account name</label>
              <input
                id="account-name"
                type="text"
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
                placeholder="e.g. Main bank account"
                maxLength={50}
                autoFocus
                required
                disabled={saving}
              />

              <label htmlFor="account-type">Account type</label>
              <select
                id="account-type"
                value={accountType}
                onChange={(event) => setAccountType(event.target.value)}
                disabled={saving}
              >
                <option value="BANK">Bank</option>
                <option value="CASH">Cash</option>
              </select>

              <p className="accounts-form-note">
                The account will be created using the account details supported
                by your backend.
              </p>

              <div className="accounts-form-actions">
                <button
                  type="button"
                  className="accounts-cancel-button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="accounts-add-button"
                  disabled={saving}
                >
                  {saving ? 'Creating…' : 'Create account'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
