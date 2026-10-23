
import { useCallback, useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tags,
  Settings,
  Plus,
  Search,
  RefreshCw,
  Tag,
  X,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import api from '../services/api'
import './Categories.css'

function Categories() {
  const [categories, setCategories] = useState([])
  const [categoryName, setCategoryName] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/api/categories')
      setCategories(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Categories load nahi ho paayi. Connection aur login check karo.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const name = categoryName.trim()

    if (!name) {
      setError('Category ka naam enter karo.')
      return
    }

    if (name.length > 50) {
      setError('Category ka naam maximum 50 characters ka ho sakta hai.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/api/categories/create', { name })

      setCategoryName('')
      setShowForm(false)
      setSuccess(`"${name}" category successfully add ho gayi.`)
      await loadCategories()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Category create nahi hui. Please dobara try karo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const filteredCategories = categories.filter((category) =>
    String(category.name || '')
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  )

  const formatDate = (dateValue) => {
    if (!dateValue) return '—'

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) return '—'

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="categories-layout">
      <aside className="categories-sidebar">
        <NavLink to="/" className="categories-brand">
          <span className="categories-brand-icon">
            <Wallet size={22} />
          </span>
          <span>
            <strong>FinTrack</strong>
            <small>Personal Finance</small>
          </span>
        </NavLink>

        <div className="categories-nav-label">WORKSPACE</div>

        <nav className="categories-nav">
          <NavLink to="/dashboard" className="categories-nav-link">
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/accounts" className="categories-nav-link">
            <Wallet size={19} />
            <span>Accounts</span>
          </NavLink>

          <NavLink to="/transactions" className="categories-nav-link">
            <ArrowLeftRight size={19} />
            <span>Transactions</span>
          </NavLink>

          <NavLink to="/categories" className="categories-nav-link">
            <Tags size={19} />
            <span>Categories</span>
          </NavLink>

          <NavLink to="/settings" className="categories-nav-link">
            <Settings size={19} />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="categories-sidebar-bottom">
          <span className="categories-status-dot" />
          <div>
            <strong>Stay organized</strong>
            <p>Every expense has a place.</p>
          </div>
        </div>
      </aside>

      <main className="categories-main">
        <header className="categories-topbar">
          <div>
            <span className="categories-eyebrow">FINANCIAL ORGANIZATION</span>
            <p className="categories-breadcrumb">Workspace / Categories</p>
          </div>

          <button
            type="button"
            className="categories-refresh-button"
            onClick={loadCategories}
            disabled={loading}
            aria-label="Refresh categories"
            title="Refresh categories"
          >
            <RefreshCw size={17} className={loading ? 'categories-spin' : ''} />
            <span>Refresh</span>
          </button>
        </header>

        <section className="categories-heading">
          <div>
            <h1>Categories</h1>
            <p>
              Apni income aur expenses ko organize karne ke liye categories
              manage karo.
            </p>
          </div>

          <button
            type="button"
            className="categories-primary-button"
            onClick={() => {
              setError('')
              setSuccess('')
              setShowForm(true)
            }}
          >
            <Plus size={19} />
            Add category
          </button>
        </section>

        {error && (
          <div className="categories-alert categories-alert-error" role="alert">
            <AlertCircle size={19} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div
            className="categories-alert categories-alert-success"
            role="status"
          >
            <CheckCircle2 size={19} />
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess('')}
              aria-label="Dismiss success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="categories-summary">
          <div className="categories-summary-icon">
            <Tags size={23} />
          </div>
          <div className="categories-summary-copy">
            <span>Total categories</span>
            <strong>{categories.length}</strong>
            <p>Categories available in your account</p>
          </div>
          <div className="categories-summary-decoration">
            <Tag size={66} strokeWidth={1} />
          </div>
        </section>

        <section className="categories-list-panel">
          <div className="categories-list-heading">
            <div>
              <h2>Your categories</h2>
              <p>Manage and search your saved category names.</p>
            </div>

            <label className="categories-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search categories..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search categories"
              />
            </label>
          </div>

          {loading ? (
            <div className="categories-state">
              <RefreshCw size={24} className="categories-spin" />
              <p>Loading categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="categories-state">
              <span className="categories-empty-icon">
                <Tags size={27} />
              </span>
              <h3>
                {search ? 'No matching categories' : 'No categories yet'}
              </h3>
              <p>
                {search
                  ? 'Search term change karke dobara try karo.'
                  : 'Apni first category add karke shuru karo.'}
              </p>
              {!search && (
                <button
                  type="button"
                  className="categories-secondary-button"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={17} />
                  Add your first category
                </button>
              )}
            </div>
          ) : (
            <div className="categories-table-wrap">
              <table className="categories-table">
                <thead>
                  <tr>
                    <th>Category name</th>
                    <th>Category ID</th>
                    <th>Created on</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <div className="categories-name-cell">
                          <span className="categories-row-icon">
                            <Tag size={17} />
                          </span>
                          <strong>{category.name}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="categories-id">#{category.id}</span>
                      </td>
                      <td>
                        <span className="categories-date">
                          <CalendarDays size={15} />
                          {formatDate(category.createdAt)}
                        </span>
                      </td>
                      <td>
                        <span className="categories-active-status">
                          <span />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="categories-table-footer">
                Showing <strong>{filteredCategories.length}</strong> of{' '}
                <strong>{categories.length}</strong> categories
              </div>
            </div>
          )}
        </section>

        {showForm && (
          <div
            className="categories-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !submitting) {
                setShowForm(false)
              }
            }}
          >
            <section
              className="categories-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="categories-modal-title"
            >
              <div className="categories-modal-heading">
                <div className="categories-modal-icon">
                  <Tag size={22} />
                </div>
                <button
                  type="button"
                  className="categories-modal-close"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                  aria-label="Close form"
                >
                  <X size={20} />
                </button>
              </div>

              <h2 id="categories-modal-title">Add new category</h2>
              <p className="categories-modal-description">
                Category ka naam enter karo. Tum ise transactions mein use
                kar sakte ho.
              </p>

              <form onSubmit={handleSubmit}>
                <label htmlFor="category-name">Category name</label>
                <input
                  id="category-name"
                  name="name"
                  type="text"
                  placeholder="e.g. Groceries, Salary, Travel"
                  value={categoryName}
                  onChange={(event) => {
                    setCategoryName(event.target.value)
                    setError('')
                  }}
                  maxLength={50}
                  autoFocus
                  required
                />
                <span className="categories-input-hint">
                  Maximum 50 characters
                </span>

                <div className="categories-modal-actions">
                  <button
                    type="button"
                    className="categories-cancel-button"
                    onClick={() => setShowForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="categories-primary-button"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save category'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default Categories
