import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tags,
  Settings,
  Plus,
  RefreshCw,
  Search,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight as TransferIcon,
  CalendarDays,
  ReceiptText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import api from '../services/api'
import './Transactions.css'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const today = () => new Date().toISOString().slice(0, 10)

const firstDayOfMonth = () => {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().slice(0, 10)
}

const getErrorMessage = (error) => {
  if (error.response?.status === 401) {
    return 'Session expired. Please sign in again.'
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to access these transactions.'
  }

  if (!error.response) {
    return 'Backend se connection nahi ho pa raha. Check karo backend running hai ya nahi.'
  }

  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    'Request failed. Please try again.'
  )
}

function normalizePage(data) {
  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
    }
  }

  return {
    content: Array.isArray(data?.content) ? data.content : [],
    totalElements: Number(data?.totalElements ?? 0),
    totalPages: Number(data?.totalPages ?? 1),
  }
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [auxiliaryError, setAuxiliaryError] = useState('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(today)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [form, setForm] = useState({
    type: 'EXPENSE',
    amount: '',
    fromAccountId: '',
    toAccountId: '',
    categoryId: '',
    transactionDate: today(),
    description: '',
  })

  const loadTransactions = useCallback(async (isRefresh = false, targetPage = page) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    setError('')

    try {
      const params = {
        page: targetPage,
        size: 20,
      }

      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate

      const response = await api.get('/api/transactions', { params })
      const result = normalizePage(response.data)

      setTransactions(result.content)
      setTotalPages(Math.max(result.totalPages, 1))
      setTotalElements(result.totalElements)
    } catch (err) {
      setError(getErrorMessage(err))
      setTransactions([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [fromDate, toDate, page])

  const loadFormOptions = useCallback(async () => {
    setAuxiliaryError('')

    const [accountsResult, categoriesResult] = await Promise.allSettled([
      api.get('/api/accounts'),
      api.get('/api/categories'),
    ])

    if (accountsResult.status === 'fulfilled') {
      const data = accountsResult.value.data
      setAccounts(Array.isArray(data) ? data : [])
    } else {
      setAuxiliaryError(
        'Accounts load nahi hue. Account selection aur transaction creation fail ho sakta hai.',
      )
    }

    if (categoriesResult.status === 'fulfilled') {
      const data = categoriesResult.value.data
      setCategories(Array.isArray(data) ? data : [])
    } else {
      setAuxiliaryError((previous) =>
        `${previous ? `${previous} ` : ''}Categories load nahi hui.`,
      )
    }
  }, [])

  useEffect(() => {
    loadTransactions(false, page)
  }, [loadTransactions, page])

  useEffect(() => {
    loadFormOptions()
  }, [loadFormOptions])

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return transactions.filter((transaction) => {
      const matchesType =
        typeFilter === 'ALL' ||
        transaction.type?.toUpperCase() === typeFilter

      const matchesQuery =
        !normalizedQuery ||
        String(transaction.description ?? '')
          .toLowerCase()
          .includes(normalizedQuery) ||
        String(transaction.id ?? '').includes(normalizedQuery) ||
        String(transaction.categoryName ?? '')
          .toLowerCase()
          .includes(normalizedQuery)

      return matchesType && matchesQuery
    })
  }, [transactions, typeFilter, query])

  const summary = useMemo(() => {
    return transactions.reduce(
      (totals, transaction) => {
        const amount = Number(transaction.amount) || 0
        const type = transaction.type?.toUpperCase()

        if (type === 'INCOME') totals.income += amount
        if (type === 'EXPENSE') totals.expense += amount
        if (type === 'TRANSFER') totals.transfer += amount

        return totals
      },
      { income: 0, expense: 0, transfer: 0 },
    )
  }, [transactions])

  function updateForm(field, value) {
    setForm((previous) => {
      const next = { ...previous, [field]: value }

      if (field === 'type') {
        if (value === 'INCOME') next.fromAccountId = ''
        if (value === 'EXPENSE') next.toAccountId = ''
        if (value === 'TRANSFER') next.categoryId = ''
      }

      return next
    })
  }

  function openCreateModal() {
    setFormError('')
    setForm({
      type: 'EXPENSE',
      amount: '',
      fromAccountId: '',
      toAccountId: '',
      categoryId: '',
      transactionDate: today(),
      description: '',
    })
    setModalOpen(true)
    loadFormOptions()
  }

  async function handleCreate(event) {
    event.preventDefault()
    setFormError('')
    setSuccessMessage('')

    const amount = Number(form.amount)

    if (!Number.isFinite(amount) || amount < 0.01) {
      setFormError('Amount at least ₹0.01 hona chahiye.')
      return
    }

    if (!form.transactionDate) {
      setFormError('Transaction date select karo.')
      return
    }

    if (!form.description.trim()) {
      setFormError('Description likhna zaroori hai.')
      return
    }

    if (form.description.trim().length > 255) {
      setFormError('Description 255 characters se zyada nahi ho sakta.')
      return
    }

    if (form.type === 'INCOME' && !form.toAccountId) {
      setFormError('Income kis account mein aayi, woh select karo.')
      return
    }

    if (form.type === 'EXPENSE' && !form.fromAccountId) {
      setFormError('Expense kis account se hua, woh select karo.')
      return
    }

    if (
      form.type === 'TRANSFER' &&
      (!form.fromAccountId || !form.toAccountId)
    ) {
      setFormError('Transfer ke liye source aur destination account select karo.')
      return
    }

    if (
      form.type === 'TRANSFER' &&
      form.fromAccountId === form.toAccountId
    ) {
      setFormError('Transfer ke dono accounts alag hone chahiye.')
      return
    }

    if (
      form.type !== 'TRANSFER' &&
      !form.categoryId
    ) {
      setFormError('Income ya expense ke liye category select karo.')
      return
    }

    const payload = {
      type: form.type,
      amount,
      fromAccountId: form.type === 'INCOME'
        ? null
        : Number(form.fromAccountId),
      toAccountId: form.type === 'EXPENSE'
        ? null
        : Number(form.toAccountId),
      categoryId: form.type === 'TRANSFER'
        ? null
        : Number(form.categoryId),
      transactionDate: form.transactionDate,
      description: form.description.trim(),
    }

    setSaving(true)

    try {
      await api.post('/api/transactions/create', payload)
      setModalOpen(false)
      setSuccessMessage('Transaction successfully create ho gaya.')
      setPage(0)
      await loadTransactions(true, 0)
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  function transactionIcon(type) {
    if (type === 'INCOME') return <ArrowDownLeft size={19} />
    if (type === 'EXPENSE') return <ArrowUpRight size={19} />
    return <TransferIcon size={19} />
  }

  return (
    <div className="transactions-page">
      <aside className="transactions-sidebar">
        <Link to="/" className="transactions-brand">
          <span className="transactions-brand-mark">f</span>
          <span>fintrack.</span>
        </Link>

        <div className="transactions-nav-label">WORKSPACE</div>

        <nav className="transactions-navigation" aria-label="Main navigation">
          <Link to="/dashboard" className="transactions-nav-link">
            <LayoutDashboard size={19} />
            <span>Overview</span>
          </Link>
          <Link to="/accounts" className="transactions-nav-link">
            <Wallet size={19} />
            <span>Accounts</span>
          </Link>
          <Link to="/transactions" className="transactions-nav-link active">
            <ArrowLeftRight size={19} />
            <span>Transactions</span>
          </Link>
          <Link to="/categories" className="transactions-nav-link">
            <Tags size={19} />
            <span>Categories</span>
          </Link>
          <Link to="/settings" className="transactions-nav-link">
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="transactions-sidebar-footer">
          <span className="transactions-avatar">FT</span>
          <div>
            <strong>My FinTrack</strong>
            <small>Personal workspace</small>
          </div>
        </div>
      </aside>

      <main className="transactions-main">
        <header className="transactions-topbar">
          <div>
            <div className="transactions-eyebrow">WORKSPACE / TRANSACTIONS</div>
            <h1>Transactions</h1>
            <p>Track where your money comes from and where it goes.</p>
          </div>

          <button
            type="button"
            className="transactions-primary-button"
            onClick={openCreateModal}
          >
            <Plus size={18} />
            Add transaction
          </button>
        </header>

        {successMessage && (
          <div className="transactions-alert transactions-success" role="status">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              aria-label="Dismiss success message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="transactions-summary-grid">
          <article className="transactions-summary-card income">
            <div className="transactions-summary-top">
              <span>Total income on this page</span>
              <span className="transactions-summary-icon">
                <ArrowDownLeft size={19} />
              </span>
            </div>
            <strong>{formatCurrency(summary.income)}</strong>
            <small>Income transactions loaded for this page</small>
          </article>

          <article className="transactions-summary-card expense">
            <div className="transactions-summary-top">
              <span>Total expenses on this page</span>
              <span className="transactions-summary-icon">
                <ArrowUpRight size={19} />
              </span>
            </div>
            <strong>{formatCurrency(summary.expense)}</strong>
            <small>Expense transactions loaded for this page</small>
          </article>

          <article className="transactions-summary-card transfer">
            <div className="transactions-summary-top">
              <span>Transfers on this page</span>
              <span className="transactions-summary-icon">
                <TransferIcon size={19} />
              </span>
            </div>
            <strong>{formatCurrency(summary.transfer)}</strong>
            <small>Transfers are not income or expenses</small>
          </article>
        </section>

        <section className="transactions-history-panel">
          <div className="transactions-section-heading">
            <div>
              <h2>Transaction history</h2>
              <p>
                {totalElements} transaction{totalElements === 1 ? '' : 's'} found
              </p>
            </div>
            <button
              type="button"
              className="transactions-refresh-button"
              onClick={() => loadTransactions(true)}
              disabled={loading || refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'transactions-spinning' : ''}
              />
              Refresh
            </button>
          </div>

          <div className="transactions-filters">
            <label className="transactions-search">
              <Search size={18} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search description or category"
                aria-label="Search transactions"
              />
            </label>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label="Filter by transaction type"
            >
              <option value="ALL">All types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="TRANSFER">Transfer</option>
            </select>

            <label className="transactions-date-filter">
              <CalendarDays size={16} />
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => {
                  setPage(0)
                  setFromDate(event.target.value)
                }}
                aria-label="From date"
              />
            </label>

            <label className="transactions-date-filter">
              <CalendarDays size={16} />
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => {
                  setPage(0)
                  setToDate(event.target.value)
                }}
                aria-label="To date"
              />
            </label>
          </div>

          {auxiliaryError && (
            <div className="transactions-alert transactions-warning" role="status">
              <AlertCircle size={18} />
              <span>{auxiliaryError}</span>
            </div>
          )}

          {error ? (
            <div className="transactions-state transactions-error-state">
              <AlertCircle size={27} />
              <h3>Transactions load nahi hui</h3>
              <p>{error}</p>
              <button
                type="button"
                className="transactions-primary-button"
                onClick={() => loadTransactions()}
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="transactions-state">
              <RefreshCw size={25} className="transactions-spinning" />
              <p>Loading transaction history…</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="transactions-state">
              <ReceiptText size={30} />
              <h3>No transactions found</h3>
              <p>Try changing the date range or search filters.</p>
            </div>
          ) : (
            <div className="transactions-table-wrap">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th className="transactions-amount-column">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const type = transaction.type?.toUpperCase()
                    const isIncome = type === 'INCOME'
                    const isExpense = type === 'EXPENSE'

                    const categoryName =
                      categories.find(
                        (category) =>
                          Number(category.id) === Number(transaction.categoryId),
                      )?.name ||
                      (transaction.categoryId == null ? '—' : `Category #${transaction.categoryId}`)

                    return (
                      <tr key={transaction.id}>
                        <td>
                          <div className="transactions-name-cell">
                            <span className={`transactions-type-icon ${type?.toLowerCase()}`}>
                              {transactionIcon(type)}
                            </span>
                            <div>
                              <strong>
                                {transaction.description || 'Untitled transaction'}
                              </strong>
                              <small>Transaction #{transaction.id}</small>
                            </div>
                          </div>
                        </td>
                        <td>{categoryName}</td>
                        <td>
                          {transaction.transactionDate
                            ? new Date(
                                `${transaction.transactionDate}T00:00:00`,
                              ).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td>
                          <span className={`transactions-type-badge ${type?.toLowerCase()}`}>
                            {type || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className={`transactions-amount ${isIncome ? 'positive' : isExpense ? 'negative' : ''}`}>
                          {isIncome ? '+' : isExpense ? '−' : ''}
                          {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="transactions-pagination">
              <span>
                Page {page + 1} of {totalPages}
              </span>
              <div>
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages - 1, current + 1))
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        <footer className="transactions-footer">
          <span>© {new Date().getFullYear()} FinTrack</span>
          <span>Clarity for your financial life.</span>
        </footer>
      </main>

      {modalOpen && (
        <div
          className="transactions-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false)
            }
          }}
        >
          <section
            className="transactions-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
          >
            <div className="transactions-modal-heading">
              <div>
                <div className="transactions-eyebrow">NEW ENTRY</div>
                <h2 id="transaction-modal-title">Add transaction</h2>
                <p>Enter the transaction details below.</p>
              </div>
              <button
                type="button"
                className="transactions-modal-close"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="transactions-alert transactions-form-error" role="alert">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form className="transactions-form" onSubmit={handleCreate}>
              <label htmlFor="transaction-type">Transaction type</label>
              <select
                id="transaction-type"
                value={form.type}
                onChange={(event) => updateForm('type', event.target.value)}
                disabled={saving}
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
                <option value="TRANSFER">Transfer</option>
              </select>

              <label htmlFor="transaction-amount">Amount (₹)</label>
              <input
                id="transaction-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) => updateForm('amount', event.target.value)}
                placeholder="e.g. 1200"
                required
                disabled={saving}
              />

              {form.type !== 'INCOME' && (
                <>
                  <label htmlFor="transaction-from-account">
                    {form.type === 'TRANSFER' ? 'From account' : 'Paid from account'}
                  </label>
                  <select
                    id="transaction-from-account"
                    value={form.fromAccountId}
                    onChange={(event) => updateForm('fromAccountId', event.target.value)}
                    required
                    disabled={saving}
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {form.type !== 'EXPENSE' && (
                <>
                  <label htmlFor="transaction-to-account">
                    {form.type === 'TRANSFER' ? 'To account' : 'Deposit into account'}
                  </label>
                  <select
                    id="transaction-to-account"
                    value={form.toAccountId}
                    onChange={(event) => updateForm('toAccountId', event.target.value)}
                    required
                    disabled={saving}
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {form.type !== 'TRANSFER' && (
                <>
                  <label htmlFor="transaction-category">Category</label>
                  <select
                    id="transaction-category"
                    value={form.categoryId}
                    onChange={(event) => updateForm('categoryId', event.target.value)}
                    required
                    disabled={saving}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label htmlFor="transaction-date">Transaction date</label>
              <input
                id="transaction-date"
                type="date"
                value={form.transactionDate}
                onChange={(event) => updateForm('transactionDate', event.target.value)}
                required
                disabled={saving}
              />

              <label htmlFor="transaction-description">Description</label>
              <input
                id="transaction-description"
                type="text"
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                placeholder="e.g. Grocery shopping or Salary received"
                maxLength={255}
                required
                disabled={saving}
              />

              <p className="transactions-form-note">
                Description explains the transaction. Category classifies the
                income or expense. Transfer entries do not use a category.
              </p>

              <div className="transactions-form-actions">
                <button
                  type="button"
                  className="transactions-cancel-button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="transactions-primary-button"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save transaction'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
