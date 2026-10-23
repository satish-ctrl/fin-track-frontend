
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Tags,
  ArrowLeftRight,
  Settings,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../services/api'
import './Dashboard.css'

const CHART_COLORS = ['#2c6045', '#739879', '#a8c7a1', '#d2dfc9', '#8a9e77', '#c1a77b']

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function getLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shortDate(dateString) {
  if (!dateString) return '—'

  const date = new Date(`${dateString}T12:00:00`)

  return Number.isNaN(date.getTime())
    ? dateString
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      })
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="dash-chart-tooltip">
      <strong>{label}</strong>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="dash-tooltip-row">
          <span style={{ background: entry.color }} />
          {entry.name}: {formatCurrency(entry.value)}
        </div>
      ))}
    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('month')

  const loadDashboard = useCallback(async () => {
    if (!localStorage.getItem('fintrack_access_token')) {
      navigate('/login', { replace: true })
      return
    }

    setLoading(true)
    setError('')

    const today = new Date()
    let startDate

    if (period === 'week') {
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 6)
    } else if (period === 'year') {
      startDate = new Date(today.getFullYear(), 0, 1)
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    }

    try {
      const response = await api.get('/api/dashboard', {
        params: {
          fromDate: getLocalDate(startDate),
          toDate: getLocalDate(today),
        },
      })

      setDashboard(response.data)
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
          'Dashboard data load nahi ho saka. Dobara try karo.',
      )
    } finally {
      setLoading(false)
    }
  }, [navigate, period])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  function handleLogout() {
    localStorage.removeItem('fintrack_access_token')
    localStorage.removeItem('fintrack_token_type')
    navigate('/login', { replace: true })
  }

  const categoryData = useMemo(() => {
    const items = dashboard?.categoryWiseExpenses ?? []

    return items
      .map((item) => ({
        name: item.categoryName || 'Uncategorized',
        amount: Number(item.totalExpense) || 0,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [dashboard])

  const dailyData = useMemo(() => {
    const items = dashboard?.dailySummary ?? []

    return items.map((item) => ({
      date: item.date,
      label: shortDate(item.date),
      income: Number(item.income) || 0,
      expense: Number(item.expense) || 0,
    }))
  }, [dashboard])

  const totalIncome = Number(dashboard?.totalIncome) || 0
  const totalExpenses = Number(dashboard?.totalExpenses) || 0
  const netCashFlow = Number(dashboard?.netCashFlow) || 0
  const totalBalance = Number(dashboard?.totalBalance) || 0

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">
          <span className="dashboard-brand-mark">f</span>
          <span>fintrack<span className="dashboard-brand-dot">.</span></span>
        </Link>

        <div className="dashboard-sidebar-caption">WORKSPACE</div>

        <nav className="dashboard-nav" aria-label="Main navigation">
          <Link to="/dashboard" className={`dashboard-nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={19} />
            <span>Overview</span>
          </Link>
          <Link to="/accounts" className={`dashboard-nav-link ${location.pathname === '/accounts' ? 'active' : ''}`}>
            <Wallet size={19} />
            <span>Accounts</span>
          </Link>
          <Link to="/transactions" className={`dashboard-nav-link ${location.pathname === '/transactions' ? 'active' : ''}`}>
            <ArrowLeftRight size={19} />
            <span>Transactions</span>
          </Link>
          <Link to="/categories" className={`dashboard-nav-link ${location.pathname === '/categories' ? 'active' : ''}`}>
            <Tags size={19} />
            <span>Categories</span>
          </Link>
          <Link to="/settings" className={`dashboard-nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user-mark">FT</div>
          <div className="dashboard-user-copy">
            <strong>My FinTrack</strong>
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

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-breadcrumb">WORKSPACE / OVERVIEW</span>
            <h1>Financial overview</h1>
            <p>A clearer picture of where your money stands.</p>
          </div>

          <div className="dashboard-toolbar">
            <label className="dashboard-period-select">
              <span className="sr-only">Reporting period</span>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                disabled={loading}
              >
                <option value="week">Last 7 days</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
              </select>
              <ChevronDown size={15} />
            </label>

            <button
              className="dashboard-refresh"
              onClick={loadDashboard}
              disabled={loading}
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {error && (
          <div className="dashboard-error" role="alert">
            <span>{error}</span>
            <button onClick={loadDashboard}>Try again</button>
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading">
            <span className="dashboard-spinner" />
            <p>Preparing your financial overview…</p>
          </div>
        ) : dashboard ? (
          <>
            <section className="dashboard-metrics">
              <article className="dashboard-metric-card balance-card">
                <div className="dashboard-metric-top">
                  <span>Total balance</span>
                  <span className="dashboard-metric-icon">
                    <Wallet size={18} />
                  </span>
                </div>
                <strong>{formatCurrency(totalBalance)}</strong>
                <p>Across your accounts</p>
                <div className="balance-card-decoration" />
              </article>

              <article className="dashboard-metric-card">
                <div className="dashboard-metric-top">
                  <span>Total income</span>
                  <span className="dashboard-metric-icon income-icon">
                    <ArrowDownLeft size={18} />
                  </span>
                </div>
                <strong>{formatCurrency(totalIncome)}</strong>
                <p>For selected period</p>
                <div className="dashboard-metric-bottom income-text">
                  <ArrowDownLeft size={14} /> Money in
                </div>
              </article>

              <article className="dashboard-metric-card">
                <div className="dashboard-metric-top">
                  <span>Total expenses</span>
                  <span className="dashboard-metric-icon expense-icon">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
                <strong>{formatCurrency(totalExpenses)}</strong>
                <p>For selected period</p>
                <div className="dashboard-metric-bottom expense-text">
                  <ArrowUpRight size={14} /> Money out
                </div>
              </article>

              <article className="dashboard-metric-card">
                <div className="dashboard-metric-top">
                  <span>Net cash flow</span>
                  <span className="dashboard-metric-icon">
                    <CircleDollarSign size={18} />
                  </span>
                </div>
                <strong className={netCashFlow < 0 ? 'negative-value' : ''}>
                  {formatCurrency(netCashFlow)}
                </strong>
                <p>Income minus expenses</p>
                <div className="dashboard-metric-bottom">
                  <ChartNoAxesCombined size={14} /> Selected period
                </div>
              </article>
            </section>

            <section className="dashboard-chart-grid">
              <article className="dashboard-panel dashboard-wide-panel">
                <div className="dashboard-panel-heading">
                  <div>
                    <span className="dashboard-section-kicker">CASH FLOW</span>
                    <h2>Income vs expenses</h2>
                    <p>Compare the money coming in and going out.</p>
                  </div>
                  <span className="dashboard-panel-icon">
                    <ChartNoAxesCombined size={19} />
                  </span>
                </div>

                {dailyData.length === 0 ? (
                  <div className="dashboard-empty">
                    No daily activity for this period yet.
                  </div>
                ) : (
                  <div className="dashboard-chart-area">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dailyData}
                        margin={{ top: 8, right: 6, left: 0, bottom: 0 }}
                        barGap={5}
                      >
                        <CartesianGrid
                          stroke="#e9ede5"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#4f584b', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={18}
                        />
                        <YAxis
                          tickFormatter={(value) =>
                            value >= 1000
                              ? `₹${Math.round(value / 1000)}k`
                              : `₹${value}`
                          }
                          tick={{ fill: '#4f584b', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={49}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          iconSize={7}
                          wrapperStyle={{
                            fontSize: 12,
                            color: '#4f584b',
                            paddingBottom: 16,
                          }}
                        />
                        <Bar
                          dataKey="income"
                          name="Income"
                          fill="#2c6045"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar
                          dataKey="expense"
                          name="Expenses"
                          fill="#d28a70"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="dashboard-panel dashboard-category-panel">
                <div className="dashboard-panel-heading">
                  <div>
                    <span className="dashboard-section-kicker">BREAKDOWN</span>
                    <h2>Spending by category</h2>
                    <p>See where your expenses go.</p>
                  </div>
                </div>

                {categoryData.length === 0 ? (
                  <div className="dashboard-empty">
                    No category expenses for this period yet.
                  </div>
                ) : (
                  <>
                    <div className="dashboard-pie-wrap">
                      <ResponsiveContainer width="100%" height={205}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={57}
                            outerRadius={82}
                            paddingAngle={3}
                            stroke="none"
                          >
                            {categoryData.map((item, index) => (
                              <Cell
                                key={item.name}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="dashboard-pie-center">
                        <span>Total spent</span>
                        <strong>{formatCurrency(totalExpenses)}</strong>
                      </div>
                    </div>

                    <div className="dashboard-category-list">
                      {categoryData.slice(0, 6).map((item, index) => {
                        const categoryPercentage =
                          totalExpenses > 0
                            ? (item.amount / totalExpenses) * 100
                            : 0

                        return (
                          <div className="dashboard-category-row" key={item.name}>
                            <span
                              className="dashboard-category-dot"
                              style={{
                                background:
                                  CHART_COLORS[index % CHART_COLORS.length],
                              }}
                            />
                            <div className="dashboard-category-details">
                              <span className="dashboard-category-name">
                                {item.name}
                              </span>
                              <div
                                className="dashboard-category-track"
                                role="progressbar"
                                aria-label={`${item.name} share of total expenses`}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={Number(categoryPercentage.toFixed(1))}
                              >
                                <div
                                  className="dashboard-category-fill"
                                  style={{
                                    width: `${Math.min(categoryPercentage, 100)}%`,
                                    background:
                                      CHART_COLORS[index % CHART_COLORS.length],
                                  }}
                                />
                              </div>
                            </div>
                            <div className="dashboard-category-values">
                              <strong>{formatCurrency(item.amount)}</strong>
                              <span>{categoryPercentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </article>

              <article className="dashboard-panel dashboard-wide-panel">
                <div className="dashboard-panel-heading">
                  <div>
                    <span className="dashboard-section-kicker">TREND</span>
                    <h2>Daily cash flow</h2>
                    <p>Track your daily income and expense pattern.</p>
                  </div>
                </div>

                {dailyData.length === 0 ? (
                  <div className="dashboard-empty">
                    Your daily trend will appear when transactions are available.
                  </div>
                ) : (
                  <div className="dashboard-chart-area dashboard-line-area">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={dailyData}
                        margin={{ top: 12, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          stroke="#e9ede5"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#4f584b', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={18}
                        />
                        <YAxis
                          tickFormatter={(value) =>
                            value >= 1000
                              ? `₹${Math.round(value / 1000)}k`
                              : `₹${value}`
                          }
                          tick={{ fill: '#4f584b', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={49}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          iconSize={7}
                          wrapperStyle={{
                            fontSize: 12,
                            color: '#4f584b',
                            paddingBottom: 16,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="income"
                          name="Income"
                          stroke="#2c6045"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="expense"
                          name="Expenses"
                          stroke="#d28a70"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="dashboard-panel">
                <div className="dashboard-panel-heading">
                  <div>
                    <span className="dashboard-section-kicker">ACTIVITY</span>
                    <h2>Income & expense history</h2>
                    <p>Daily figures for the selected period.</p>
                  </div>
                </div>

                {dailyData.length === 0 ? (
                  <div className="dashboard-empty">
                    No income or expense history available.
                  </div>
                ) : (
                  <div className="dashboard-history">
                    <div className="dashboard-history-header">
                      <span>Date</span>
                      <span>Income</span>
                      <span>Expense</span>
                    </div>

                    {[...dailyData].reverse().map((item) => (
                      <div className="dashboard-history-row" key={item.date}>
                        <span className="dashboard-history-date">
                          {shortDate(item.date)}
                        </span>
                        <span className="dashboard-history-income">
                          +{formatCurrency(item.income)}
                        </span>
                        <span className="dashboard-history-expense">
                          −{formatCurrency(item.expense)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>
          </>
        ) : (
          <div className="dashboard-empty">
            Dashboard data abhi available nahi hai.
          </div>
        )}

        <footer className="dashboard-footer">
          <span>© {new Date().getFullYear()} FinTrack</span>
          <span>Clarity for your financial life.</span>
        </footer>
      </main>
    </div>
  )
}

export default Dashboard
