
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Wallet,
  ChartNoAxesCombined,
  ReceiptText,
  ShieldCheck,
  CircleDollarSign,
  MoveUpRight,
  MoveDownRight,
  Menu,
  X,
  Check,
} from 'lucide-react'
import { useState } from 'react'
import './Home.css'

const features = [
  {
    number: '01',
    icon: Wallet,
    title: 'All your accounts, organized.',
    description:
      'Keep your financial accounts together and get a clearer picture of your available balances.',
  },
  {
    number: '02',
    icon: ReceiptText,
    title: 'Know where your money goes.',
    description:
      'Record income, expenses and transfers, then revisit your transaction history whenever you need it.',
  },
  {
    number: '03',
    icon: ChartNoAxesCombined,
    title: 'See the bigger picture.',
    description:
      'Understand your income, spending and cash flow through a dashboard built around your finances.',
  },
]

function ProductPreview() {
  return (
    <div className="home-preview" aria-label="Illustrative FinTrack dashboard preview">
      <div className="preview-sidebar">
        <div className="preview-brand">
          <span className="preview-brand-mark">f</span>
          <span>fintrack</span>
        </div>

        <div className="preview-nav active">
          <ChartNoAxesCombined size={15} />
          Overview
        </div>
        <div className="preview-nav">
          <Wallet size={15} />
          Accounts
        </div>
        <div className="preview-nav">
          <ReceiptText size={15} />
          Transactions
        </div>

        <div className="preview-sidebar-bottom">
          <ShieldCheck size={15} />
          Your finances, in focus
        </div>
      </div>

      <div className="preview-main">
        <div className="preview-topbar">
          <div>
            <span className="preview-overline">YOUR MONEY AT A GLANCE</span>
            <h3>Overview</h3>
          </div>
          <span className="preview-avatar">FT</span>
        </div>

        <div className="preview-balance">
          <span>Total account balance</span>
          <div className="preview-balance-row">
            <strong>₹ 84,250.00</strong>
            <span className="preview-balance-badge">
              <MoveUpRight size={12} />
              Overview
            </span>
          </div>
          <div className="preview-balance-line">
            <span />
          </div>
          <small>Your finances, in one place.</small>
        </div>

        <div className="preview-stats">
          <div className="preview-stat">
            <div className="preview-stat-label">
              <span className="stat-dot income-dot" />
              Income
            </div>
            <strong>₹ 42,000</strong>
            <small><MoveUpRight size={12} /> Money in</small>
          </div>

          <div className="preview-stat">
            <div className="preview-stat-label">
              <span className="stat-dot expense-dot" />
              Expenses
            </div>
            <strong>₹ 16,450</strong>
            <small><MoveDownRight size={12} /> Money out</small>
          </div>
        </div>

        <div className="preview-activity">
          <div className="preview-activity-heading">
            <strong>Recent activity</strong>
            <span>Example data</span>
          </div>

          <div className="preview-transaction">
            <span className="transaction-icon salary-icon">
              <MoveDownRight size={15} />
            </span>
            <span className="transaction-description">
              <strong>Monthly income</strong>
              <small>Income</small>
            </span>
            <strong className="transaction-positive">+ ₹ 42,000</strong>
          </div>

          <div className="preview-transaction">
            <span className="transaction-icon food-icon">
              <CircleDollarSign size={15} />
            </span>
            <span className="transaction-description">
              <strong>Daily expenses</strong>
              <small>Expense</small>
            </span>
            <strong className="transaction-negative">− ₹ 1,250</strong>
          </div>

          <div className="preview-transaction">
            <span className="transaction-icon transfer-icon">
              <ArrowRight size={15} />
            </span>
            <span className="transaction-description">
              <strong>Account transfer</strong>
              <small>Transfer</small>
            </span>
            <strong>₹ 5,000</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="home-page">
      <header className="home-header">
        <Link to="/" className="home-brand" aria-label="FinTrack home">
          <span className="home-brand-mark">f</span>
          <span>fintrack<span className="home-brand-dot">.</span></span>
        </Link>

        <button
          type="button"
          className="home-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`home-nav ${menuOpen ? 'home-nav-open' : ''}`}>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
          <Link
            to="/signup"
            className="home-nav-cta"
            onClick={() => setMenuOpen(false)}
          >
            Get started <ArrowUpRight size={15} />
          </Link>
        </nav>
      </header>

      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="home-eyebrow">
            <span className="home-eyebrow-dot" />
            A CLEARER WAY TO MANAGE MONEY
          </div>

          <h1>
            Your money.
            <br />
            Your <span>clarity.</span>
          </h1>

          <p className="home-hero-description">
            Take control of your personal finances. Keep track of your
            accounts, understand your spending and see your financial
            activity with less guesswork.
          </p>

          <div className="home-hero-actions">
            <Link to="/signup" className="home-primary-button">
              Get started <ArrowRight size={17} />
            </Link>
            <a href="#features" className="home-secondary-button">
              Explore FinTrack
            </a>
          </div>

          <div className="home-trust-note">
            <ShieldCheck size={16} />
            <span>Your finances, organized in one place.</span>
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="home-visual-caption">
            <span className="caption-dot" />
            A MORE INFORMED FINANCIAL LIFE
          </div>
          <ProductPreview />
          <div className="home-preview-note">
            <span><Check size={13} /></span>
            <p>Illustrative preview · Sample figures, not real account data</p>
          </div>
        </div>
      </section>

      <section className="home-proof-strip">
        <div>
          <span className="proof-icon"><Wallet size={18} /></span>
          <span>Accounts in one place</span>
        </div>
        <div>
          <span className="proof-icon"><ReceiptText size={18} /></span>
          <span>Clear transaction history</span>
        </div>
        <div>
          <span className="proof-icon"><ChartNoAxesCombined size={18} /></span>
          <span>Useful financial summaries</span>
        </div>
      </section>

      <section className="home-features" id="features">
        <div className="home-section-heading">
          <span className="home-section-label">LESS GUESSWORK. MORE CLARITY.</span>
          <h2>Money management, made simpler.</h2>
          <p>
            The essentials you need to understand your financial picture
            without adding complexity to your day.
          </p>
        </div>

        <div className="home-feature-grid">
          {features.map(({ number, icon: Icon, title, description }) => (
            <article className="home-feature" key={number}>
              <div className="feature-topline">
                <span className="feature-icon"><Icon size={20} /></span>
                <span className="feature-number">{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="feature-bottom-line" />
            </article>
          ))}
        </div>
      </section>

      <section className="home-how" id="how-it-works">
        <div className="home-how-copy">
          <span className="home-section-label">START WITH THE ESSENTIALS</span>
          <h2>A better view of your money starts with a few simple steps.</h2>
          <p>
            Create your account, organize your accounts and start recording
            your financial activity. Your dashboard brings the important
            summaries together.
          </p>
          <Link to="/signup" className="home-text-link">
            Create your FinTrack account <ArrowRight size={16} />
          </Link>
        </div>

        <div className="home-steps">
          <div className="home-step">
            <span>01</span>
            <div>
              <h3>Create your account</h3>
              <p>Sign up with your username, email and password.</p>
            </div>
          </div>
          <div className="home-step">
            <span>02</span>
            <div>
              <h3>Organize your finances</h3>
              <p>Add accounts and record income, expenses or transfers.</p>
            </div>
          </div>
          <div className="home-step">
            <span>03</span>
            <div>
              <h3>Review your overview</h3>
              <p>Use your dashboard and transaction history to understand your money.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-cta">
        <div>
          <span className="home-section-label">YOUR NEXT STEP STARTS HERE</span>
          <h2>Make money decisions with more clarity.</h2>
          <p>Start organizing your financial life with FinTrack.</p>
        </div>
        <Link to="/signup" className="home-primary-button">
          Create your account <ArrowRight size={17} />
        </Link>
      </section>

      <footer className="home-footer">
        <Link to="/" className="home-brand footer-brand">
          <span className="home-brand-mark">f</span>
          <span>fintrack<span className="home-brand-dot">.</span></span>
        </Link>
        <p>Personal finance, with a clearer point of view.</p>
        <div className="home-footer-links">
          <a href="#features">Features</a>
          <Link to="/login">Log in</Link>
          <Link to="/signup">Sign up</Link>
        </div>
        <span className="home-copyright">© {new Date().getFullYear()} FinTrack</span>
      </footer>
    </main>
  )
}

export default Home
