import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tags,
  Settings,
  UserRound,
  LogOut,
  FileText,
  FileSpreadsheet,
  Mail,
  Download,
  TrendingUp,
  TrendingDown,
  ChartNoAxesCombined,
  LoaderCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react'

import api from '../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx-js-style'

import './Dashboard.css'
import './Reports.css'

function getLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function formatPdfAmount(value) {
  return `INR ${(Number(value) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(`${dateString}T00:00:00`)
  if (isNaN(date.getTime())) return String(dateString)

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function normalizePage(data) {
  if (Array.isArray(data)) {
    return {
      content: data,
      totalPages: 1,
      totalElements: data.length,
    }
  }

  return {
    content: Array.isArray(data?.content) ? data.content : [],
    totalPages: Number(data?.totalPages ?? 1),
    totalElements: Number(data?.totalElements ?? 0),
  }
}

function Reports() {
  const navigate = useNavigate()
  const location = useLocation()

  const today = getLocalDate(new Date())
  const monthStart = getLocalDate(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  )

  const [fromDate, setFromDate] = useState(monthStart)
  const [toDate, setToDate] = useState(today)

  const [accounts, setAccounts] = useState([])
  const [categoriesList, setCategoriesList] = useState([])
  const [transactions, setTransactions] = useState([])
  const [userProfile, setUserProfile] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Email export states
  const [emailFormat, setEmailFormat] = useState('pdf')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')
  const [emailError, setEmailError] = useState('')

  // Load user profile
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const response = await api.get('/api/users/me')
        setUserProfile(response.data)
      } catch (e) {
        console.warn('Could not load user profile', e)
      }
    }

    if (localStorage.getItem('fintrack_access_token')) {
      loadUserProfile()
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function fetchReport() {
      if (!localStorage.getItem('fintrack_access_token')) {
        navigate('/login', { replace: true })
        return
      }

      if (!fromDate || !toDate || fromDate > toDate) {
        if (!ignore) {
          setError('Please select a valid date range.')
          setLoading(false)
        }
        return
      }

      try {
        const [accountsResult, categoriesResult] = await Promise.all([
          api.get('/api/accounts'),
          api.get('/api/categories'),
        ])

        const firstResponse = await api.get('/api/transactions', {
          params: {
            fromDate,
            toDate,
            page: 0,
            size: 100,
          },
        })

        const firstPage = normalizePage(firstResponse.data)
        const allTransactions = [...firstPage.content]

        for (let page = 1; page < firstPage.totalPages; page += 1) {
          const response = await api.get('/api/transactions', {
            params: {
              fromDate,
              toDate,
              page,
              size: 100,
            },
          })

          allTransactions.push(...normalizePage(response.data).content)
        }

        if (!ignore) {
          setAccounts(
            Array.isArray(accountsResult.data) ? accountsResult.data : [],
          )
          setCategoriesList(
            Array.isArray(categoriesResult.data) ? categoriesResult.data : [],
          )
          setTransactions(allTransactions)
          setError('')
        }
      } catch (requestError) {
        if (!ignore) {
          const status = requestError.response?.status

          if (status === 401 || status === 403) {
            localStorage.removeItem('fintrack_access_token')
            localStorage.removeItem('fintrack_token_type')
            navigate('/login', { replace: true })
            return
          }

          setError(
            requestError.response?.data?.message ||
              'Report data could not be loaded. Please try again.',
          )
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchReport()

    return () => {
      ignore = true
    }
  }, [fromDate, toDate, refreshKey, navigate])

  function handleLogout() {
    localStorage.removeItem('fintrack_access_token')
    localStorage.removeItem('fintrack_token_type')
    navigate('/login', { replace: true })
  }

  function handleDateSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setRefreshKey((k) => k + 1)
  }

  const accountById = useMemo(
    () => new Map(accounts.map((account) => [Number(account.id), account])),
    [accounts],
  )

  const categoryById = useMemo(
    () =>
      new Map(
        categoriesList.map((category) => [Number(category.id), category]),
      ),
    [categoriesList],
  )

  // Calculate totals from transactions
  const totals = useMemo(() => {
    return transactions.reduce(
      (sum, tx) => {
        const amount = Number(tx.amount ?? tx.transactionAmount ?? 0) || 0
        const type = String(tx.type ?? tx.transactionType ?? '').toUpperCase()

        if (type === 'INCOME') sum.income += amount
        else if (type === 'EXPENSE') sum.expenses += amount
        else if (type === 'TRANSFER') sum.transfers += amount

        return sum
      },
      {
        income: 0,
        expenses: 0,
        transfers: 0,
      },
    )
  }, [transactions])

  const totalIncome = totals.income
  const totalExpenses = totals.expenses
  const totalTransfers = totals.transfers
  const netCashFlow = totalIncome - totalExpenses

  const totalBalance = useMemo(() => {
    return accounts
      .filter(
        (account) => String(account.status || '').toUpperCase() === 'ACTIVE',
      )
      .reduce((sum, account) => {
        const bal =
          account.balance ?? account.currentBalance ?? account.amount ?? 0
        return sum + (Number(bal) || 0)
      }, 0)
  }, [accounts])

  const accountSummary = useMemo(() => {
    return accounts.map((account) => {
      const accountId = Number(account.id)
      let income = 0
      let expenses = 0
      let transfersIn = 0
      let transfersOut = 0

      transactions.forEach((tx) => {
        const amount = Number(tx.amount ?? tx.transactionAmount ?? 0) || 0
        const type = String(tx.type ?? tx.transactionType ?? '').toUpperCase()

        const toId = Number(
          tx.toAccountId ?? tx.toAccount?.id ?? tx.accountId,
        )
        const fromId = Number(
          tx.fromAccountId ?? tx.fromAccount?.id ?? tx.accountId,
        )

        if (type === 'INCOME' && toId === accountId) {
          income += amount
        } else if (type === 'EXPENSE' && fromId === accountId) {
          expenses += amount
        } else if (type === 'TRANSFER') {
          if (toId === accountId) transfersIn += amount
          if (fromId === accountId) transfersOut += amount
        }
      })

      return {
        ...account,
        income,
        expenses,
        transfersIn,
        transfersOut,
      }
    })
  }, [accounts, transactions])

  const expenseCategories = useMemo(() => {
    const categoryMap = new Map()

    transactions.forEach((tx) => {
      const type = String(tx.type ?? tx.transactionType ?? '').toUpperCase()
      if (type !== 'EXPENSE') return

      const amount = Number(tx.amount ?? tx.transactionAmount ?? 0) || 0
      const categoryId = tx.categoryId ?? tx.category?.id ?? null

      const categoryName =
        tx.categoryName ||
        tx.category?.categoryName ||
        tx.category?.name ||
        categoryById.get(Number(categoryId))?.categoryName ||
        categoryById.get(Number(categoryId))?.name ||
        'Uncategorized'

      categoryMap.set(
        categoryName,
        (categoryMap.get(categoryName) || 0) + amount,
      )
    })

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        id: category,
        category,
        name: category,
        amount,
        share: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [transactions, categoryById, totalExpenses])

  const statementTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date || a.transactionDate || 0)
      const dateB = new Date(b.date || b.transactionDate || 0)
      return dateB - dateA
    })
  }, [transactions])

  const getAccountName = useCallback(
    (tx) => {
      const accountId =
        tx.accountId ??
        tx.fromAccountId ??
        tx.fromAccount?.id ??
        tx.toAccountId ??
        tx.toAccount?.id

      const account = accountById.get(Number(accountId))

      return (
        tx.accountName ||
        tx.account?.accountName ||
        tx.fromAccount?.accountName ||
        tx.account?.name ||
        account?.accountName ||
        account?.name ||
        account?.bankName ||
        '—'
      )
    },
    [accountById],
  )

  const getTransactionCategory = useCallback(
    (tx) => {
      const categoryId = tx.categoryId ?? tx.category?.id

      return (
        tx.categoryName ||
        tx.category?.categoryName ||
        tx.category?.name ||
        categoryById.get(Number(categoryId))?.categoryName ||
        categoryById.get(Number(categoryId))?.name ||
        'Uncategorized'
      )
    },
    [categoryById],
  )

  const getTransactionDate = useCallback(
    (tx) => tx.date || tx.transactionDate || '',
    [],
  )

  const getTransactionDescription = useCallback(
    (tx) => tx.description || tx.note || tx.title || '—',
    [],
  )

  const getTransactionType = useCallback(
    (tx) => String(tx.type ?? tx.transactionType ?? '').toUpperCase(),
    [],
  )

  const getAccountType = useCallback(
    (account) => String(account.accountType || account.type || '—').toUpperCase(),
    [],
  )

  const getAccountBalance = useCallback(
    (account) =>
      Number(
        account.balance ??
          account.currentBalance ??
          account.amount ??
          0,
      ) || 0,
    [],
  )

  // =========================================================
  // PDF EXPORT (Matching User's Screenshot Structure Exactly)
  // =========================================================
  function handleExportPDF(shouldDownload = true) {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 14
      const headerColor = [34, 76, 54] // Dark forest green (#224C36 / #286447)
      const borderColor = [209, 213, 219] // Subtle light gray border

      // 1. Header Title & Subtitles
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(18)
      pdf.setTextColor(31, 41, 55)
      pdf.text('FinTrack - Financial Statement', margin, 18)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9.5)
      pdf.setTextColor(71, 85, 105)
      pdf.text(
        `Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`,
        margin,
        25,
      )
      pdf.text(
        `Transactions included: ${statementTransactions.length}`,
        margin,
        30,
      )

      let currentY = 36

      // 2. Table: Financial Summary
      autoTable(pdf, {
        startY: currentY,
        head: [['Financial Summary', 'Amount']],
        body: [
          [
            'Current balance (active accounts)',
            formatPdfAmount(totalBalance),
          ],
          [
            'Income in selected period',
            formatPdfAmount(totalIncome),
          ],
          [
            'Expenses in selected period',
            formatPdfAmount(totalExpenses),
          ],
          [
            'Net cash flow (income - expenses)',
            formatPdfAmount(netCashFlow),
          ],
          [
            'Transfers (excluded from income/expenses)',
            formatPdfAmount(totalTransfers),
          ],
        ],
        theme: 'grid',
        headStyles: {
          fillColor: headerColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          cellPadding: 3,
        },
        bodyStyles: {
          textColor: [40, 50, 45],
          fontSize: 8,
          cellPadding: 2.8,
          lineColor: borderColor,
          lineWidth: 0.2,
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        columnStyles: {
          0: { cellWidth: 122 },
          1: { cellWidth: 60, halign: 'left' },
        },
        margin: { left: margin, right: margin },
      })

      currentY = pdf.lastAutoTable.finalY + 8

      // 3. Table: Account Summary
      autoTable(pdf, {
        startY: currentY,
        head: [
          [
            'Account',
            'Type',
            'Status',
            'Current Balance',
            'Period Income',
            'Period Expenses',
            'Transfers In',
            'Transfers Out',
          ],
        ],
        body: accountSummary.map((account) => [
          account.accountName ||
            account.name ||
            account.bankName ||
            '—',
          getAccountType(account),
          String(account.status || 'ACTIVE').toUpperCase(),
          formatPdfAmount(getAccountBalance(account)),
          formatPdfAmount(account.income),
          formatPdfAmount(account.expenses),
          formatPdfAmount(account.transfersIn),
          formatPdfAmount(account.transfersOut),
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: headerColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          cellPadding: 3,
        },
        bodyStyles: {
          textColor: [40, 50, 45],
          fontSize: 7,
          cellPadding: 2.5,
          lineColor: borderColor,
          lineWidth: 0.2,
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 16 },
          2: { cellWidth: 18 },
          3: { cellWidth: 24 },
          4: { cellWidth: 23 },
          5: { cellWidth: 23 },
          6: { cellWidth: 23 },
          7: { cellWidth: 23 },
        },
        margin: { left: margin, right: margin },
      })

      currentY = pdf.lastAutoTable.finalY + 8

      // 4. Table: Transaction History
      autoTable(pdf, {
        startY: currentY,
        head: [
          [
            'Date',
            'Description',
            'Category',
            'Account',
            'Type',
            'Amount',
          ],
        ],
        body: statementTransactions.length
          ? statementTransactions.map((tx) => [
              formatDate(getTransactionDate(tx)),
              getTransactionDescription(tx),
              getTransactionCategory(tx),
              getAccountName(tx),
              getTransactionType(tx),
              formatPdfAmount(tx.amount ?? tx.transactionAmount),
            ])
          : [
              [
                '—',
                'No transactions found for this period',
                '—',
                '—',
                '—',
                formatPdfAmount(0),
              ],
            ],
        theme: 'grid',
        headStyles: {
          fillColor: headerColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          cellPadding: 3,
        },
        bodyStyles: {
          textColor: [40, 50, 45],
          fontSize: 7,
          cellPadding: 2.5,
          lineColor: borderColor,
          lineWidth: 0.2,
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 48 },
          2: { cellWidth: 32 },
          3: { cellWidth: 32 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 },
        },
        margin: { left: margin, right: margin },
      })

      currentY = pdf.lastAutoTable.finalY + 8

      // 5. Table: Expense Categories
      autoTable(pdf, {
        startY: currentY,
        head: [['Expense Category', 'Expense Amount', 'Share']],
        body: expenseCategories.length
          ? expenseCategories.map((item) => [
              item.category || item.name,
              formatPdfAmount(item.amount),
              `${item.share.toFixed(2)}%`,
            ])
          : [
              [
                'No expenses in selected period',
                formatPdfAmount(0),
                '0.00%',
              ],
            ],
        theme: 'grid',
        headStyles: {
          fillColor: headerColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          cellPadding: 3,
        },
        bodyStyles: {
          textColor: [40, 50, 45],
          fontSize: 7,
          cellPadding: 2.5,
          lineColor: borderColor,
          lineWidth: 0.2,
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        columnStyles: {
          0: { cellWidth: 102 },
          1: { cellWidth: 55 },
          2: { cellWidth: 25 },
        },
        margin: { left: margin, right: margin },
      })

      // Page numbers footer
      const pageCount = pdf.internal.getNumberOfPages()
      for (let page = 1; page <= pageCount; page += 1) {
        pdf.setPage(page)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor(130, 140, 135)
        pdf.text(
          `Page ${page} of ${pageCount}`,
          pageWidth - margin,
          pdf.internal.pageSize.getHeight() - 7,
          { align: 'right' },
        )
      }

      const blob = pdf.output('blob')

      if (shouldDownload) {
        pdf.save(`FinTrack-Statement-${fromDate}-to-${toDate}.pdf`)
      }

      return blob
    } catch (exportError) {
      console.error('PDF export failed:', exportError)
      setError('PDF statement could not be generated.')
      return null
    }
  }

  // ===========================================================
  // EXCEL EXPORT (Matching User's Screenshot Structure Exactly)
  // ===========================================================
  function handleExportExcel(shouldDownload = true) {
    try {
      const workbook = XLSX.utils.book_new()
      const rows = []

      const sectionRows = []
      const headerRows = []
      const currencyCells = []
      const percentageCells = []

      const addRow = (values, options = {}) => {
        const rowNumber = rows.length
        rows.push(values)

        if (options.section) {
          sectionRows.push(rowNumber)
        }

        if (options.header) {
          headerRows.push(rowNumber)
        }

        return rowNumber
      }

      // Row 1: Title
      addRow(['FinTrack - Financial Statement'])

      // Row 2 & 3: Period & Transactions (light blue banner in screenshot)
      addRow([`Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`])
      addRow([`Transactions included: ${statementTransactions.length}`])

      // Row 4: Blank
      addRow([])

      // Row 5: Navy Banner: Financial Summary
      addRow(['Financial Summary'], { section: true })

      // Row 6: Header: Financial Summary | Amount
      addRow(['Financial Summary', 'Amount'], { header: true })

      // Rows 7-11: Data items
      const summaryItems = [
        ['Current balance (active accounts)', totalBalance],
        ['Income in selected period', totalIncome],
        ['Expenses in selected period', totalExpenses],
        ['Net cash flow (income - expenses)', netCashFlow],
        ['Transfers (excluded from income/expenses)', totalTransfers],
      ]

      summaryItems.forEach(([label, amount]) => {
        const rowNumber = addRow([label, amount])
        currencyCells.push(`B${rowNumber + 1}`)
      })

      // Blank
      addRow([])

      // Navy Banner: Account Summary
      addRow(['Account Summary'], { section: true })

      // Header: Account Summary
      addRow(
        [
          'Account',
          'Type',
          'Status',
          'Current Balance',
          'Period Income',
          'Period Expenses',
          'Transfers In',
          'Transfers Out',
        ],
        { header: true },
      )

      accountSummary.forEach((account) => {
        const rowNumber = addRow([
          account.accountName ||
            account.name ||
            account.bankName ||
            '—',
          getAccountType(account),
          String(account.status || 'ACTIVE').toUpperCase(),
          getAccountBalance(account),
          Number(account.income) || 0,
          Number(account.expenses) || 0,
          Number(account.transfersIn) || 0,
          Number(account.transfersOut) || 0,
        ])

        ;['D', 'E', 'F', 'G', 'H'].forEach((column) => {
          currencyCells.push(`${column}${rowNumber + 1}`)
        })
      })

      // Blank
      addRow([])

      // Navy Banner: Transaction History
      addRow(['Transaction History'], { section: true })

      // Header: Transaction History
      addRow(
        [
          'Date',
          'Description',
          'Category',
          'Account',
          'Type',
          'Amount',
        ],
        { header: true },
      )

      if (statementTransactions.length > 0) {
        statementTransactions.forEach((tx) => {
          const rowNumber = addRow([
            formatDate(getTransactionDate(tx)),
            getTransactionDescription(tx),
            getTransactionCategory(tx),
            getAccountName(tx),
            getTransactionType(tx),
            Number(tx.amount ?? tx.transactionAmount) || 0,
          ])

          currencyCells.push(`F${rowNumber + 1}`)
        })
      } else {
        addRow([
          '—',
          'No transactions found for this period',
          '—',
          '—',
          '—',
          0,
        ])
      }

      // Blank
      addRow([])

      // Navy Banner: Expenses by Category
      addRow(['Expenses by Category'], { section: true })

      // Header: Expenses by Category
      addRow(
        ['Expense Category', 'Expense Amount', 'Share'],
        { header: true },
      )

      if (expenseCategories.length > 0) {
        expenseCategories.forEach((item) => {
          const rowNumber = addRow([
            item.category || item.name,
            item.amount,
            item.share / 100,
          ])

          currencyCells.push(`B${rowNumber + 1}`)
          percentageCells.push(`C${rowNumber + 1}`)
        })
      } else {
        addRow(['No expenses in selected period', 0, 0])
      }

      const worksheet = XLSX.utils.aoa_to_sheet(rows)

      // Column widths
      worksheet['!cols'] = [
        { wch: 36 },
        { wch: 28 },
        { wch: 20 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 20 },
        { wch: 20 },
      ]

      // Merging section rows
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        ...sectionRows.map((rowNumber) => ({
          s: { r: rowNumber, c: 0 },
          e: { r: rowNumber, c: 7 },
        })),
      ]

      // Row heights
      worksheet['!rows'] = [
        { hpt: 30 }, // Row 1 Title
        { hpt: 20 }, // Row 2 Period
        { hpt: 20 }, // Row 3 Transactions
      ]

      // Title Style (A1)
      if (worksheet.A1) {
        worksheet.A1.s = {
          font: {
            bold: true,
            sz: 14,
            color: { rgb: '1F2937' },
            name: 'Calibri',
          },
          alignment: { vertical: 'center' },
        }
      }

      // Period Rows (Rows 2 & 3 in Screenshot: light blue background spanning cols A to H)
      ;[1, 2].forEach((rIndex) => {
        worksheet['!rows'][rIndex] = { hpt: 20 }
        for (let col = 0; col < 8; col += 1) {
          const addr = XLSX.utils.encode_cell({ r: rIndex, c: col })
          if (!worksheet[addr]) worksheet[addr] = { t: 's', v: '' }
          worksheet[addr].s = {
            font: {
              italic: true,
              sz: 9.5,
              color: { rgb: '334155' },
              name: 'Calibri',
            },
            fill: {
              fgColor: { rgb: 'DCE6F1' },
            },
            alignment: { vertical: 'center' },
            border:
              rIndex === 1
                ? {
                    top: { style: 'medium', color: { rgb: '286447' } },
                  }
                : {},
          }
        }
      })

      // Section Banners: Dark Navy Blue (#1F3864)
      sectionRows.forEach((rowNumber) => {
        worksheet['!rows'][rowNumber] = { hpt: 24 }

        for (let col = 0; col < 8; col += 1) {
          const addr = XLSX.utils.encode_cell({ r: rowNumber, c: col })
          if (!worksheet[addr]) worksheet[addr] = { t: 's', v: '' }

          worksheet[addr].s = {
            font: {
              bold: true,
              color: { rgb: 'FFFFFF' },
              sz: 11,
              name: 'Calibri',
            },
            fill: {
              fgColor: { rgb: '1B395B' },
            },
            alignment: {
              vertical: 'center',
              indent: 1,
            },
          }
        }
      })

      // Table Headers: Dark Forest Green (#286447)
      headerRows.forEach((rowNumber) => {
        worksheet['!rows'][rowNumber] = { hpt: 23 }

        for (let column = 0; column < 8; column += 1) {
          const addr = XLSX.utils.encode_cell({ r: rowNumber, c: column })
          const cell = worksheet[addr]

          if (cell && cell.v !== undefined && cell.v !== '') {
            cell.s = {
              font: {
                bold: true,
                color: { rgb: 'FFFFFF' },
                sz: 9.5,
                name: 'Calibri',
              },
              fill: {
                fgColor: { rgb: '286447' },
              },
              alignment: {
                horizontal: 'center',
                vertical: 'center',
                wrapText: true,
              },
              border: {
                bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
              },
            }
          }
        }
      })

      // Currency Formatting
      currencyCells.forEach((address) => {
        const cell = worksheet[address]
        if (cell) {
          cell.t = 'n'
          cell.z = '₹#,##0.00;[Red]-₹#,##0.00'
          cell.s = {
            ...(cell.s || {}),
            alignment: {
              horizontal: 'right',
              vertical: 'center',
            },
          }
        }
      })

      // Percentage Formatting
      percentageCells.forEach((address) => {
        const cell = worksheet[address]
        if (cell) {
          cell.t = 'n'
          cell.z = '0.00%'
          cell.s = {
            ...(cell.s || {}),
            alignment: {
              horizontal: 'right',
              vertical: 'center',
            },
          }
        }
      })

      // Thin borders for data cells
      const range = XLSX.utils.decode_range(worksheet['!ref'])
      for (let row = 0; row <= range.e.r; row += 1) {
        if (sectionRows.includes(row) || row < 4) continue

        for (let column = 0; column <= range.e.c; column += 1) {
          const address = XLSX.utils.encode_cell({ r: row, c: column })
          const cell = worksheet[address]

          if (cell && cell.v !== undefined && cell.v !== '') {
            cell.s = {
              ...(cell.s || {}),
              border: {
                top: { style: 'thin', color: { rgb: 'D9E2DC' } },
                bottom: { style: 'thin', color: { rgb: 'D9E2DC' } },
                left: { style: 'thin', color: { rgb: 'D9E2DC' } },
                right: { style: 'thin', color: { rgb: 'D9E2DC' } },
              },
              alignment: {
                ...(cell.s?.alignment || {}),
                vertical: 'center',
              },
            }
          }
        }
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Statement')

      const excelArray = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      })

      const blob = new Blob([excelArray], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      if (shouldDownload) {
        XLSX.writeFile(
          workbook,
          `FinTrack-Statement-${fromDate}-to-${toDate}.xlsx`,
        )
      }

      return blob
    } catch (exportError) {
      console.error('Excel export failed:', exportError)
      setError('Excel statement could not be generated.')
      return null
    }
  }

  // =========================================================
  // EMAIL STATEMENT (Sends Same File to User's Login Email)
  // =========================================================
  async function handleEmailSubmit(event) {
    event.preventDefault()

    setEmailMessage('')
    setEmailError('')

    if (!fromDate || !toDate || fromDate > toDate) {
      setEmailError('Please select a valid date range.')
      return
    }

    setEmailLoading(true)

    try {
      // Generate exact statement attachment
      const attachment =
        emailFormat === 'pdf'
          ? handleExportPDF(false)
          : handleExportExcel(false)

      if (!(attachment instanceof Blob) || attachment.size === 0) {
        throw new Error('The statement attachment could not be generated.')
      }

      const extension = emailFormat === 'pdf' ? 'pdf' : 'xlsx'
      const filename = `FinTrack-Statement-${fromDate}-to-${toDate}.${extension}`

      const formData = new FormData()
      formData.append('fromDate', fromDate)
      formData.append('toDate', toDate)
      formData.append('format', emailFormat)
      formData.append('file', attachment, filename)

      const response = await api.post('/api/exports/email', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const responseMessage =
        typeof response.data === 'string'
          ? response.data
          : response.data?.message

      const recipient = userProfile?.email || 'your registered email'

      setEmailMessage(
        responseMessage ||
          `Financial statement sent successfully to ${recipient}.`,
      )
    } catch (requestError) {
      console.error('Email statement failed:', requestError)

      const status = requestError.response?.status
      if (status === 401 || status === 403) {
        localStorage.removeItem('fintrack_access_token')
        localStorage.removeItem('fintrack_token_type')
        navigate('/login', { replace: true })
        return
      }

      const responseData = requestError.response?.data
      const backendMessage =
        typeof responseData === 'string'
          ? responseData
          : responseData?.message

      setEmailError(
        backendMessage ||
          'The financial statement could not be emailed. Please check backend mail configuration.',
      )
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div className="dashboard-page reports-page">
      {/* Sidebar Navigation */}
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
            to="/reports"
            className={`dashboard-nav-link ${
              location.pathname === '/reports' ? 'active' : ''
            }`}
          >
            <FileText size={19} />
            <span>Reports &amp; Export</span>
          </Link>

          <Link
            to="/settings"
            className={`dashboard-nav-link ${
              location.pathname === '/settings' ? 'active' : ''
            }`}
          >
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user-mark" aria-hidden="true">
            {userProfile?.username?.trim()?.charAt(0)?.toUpperCase() || (
              <UserRound size={18} />
            )}
          </div>

          <div className="dashboard-user-copy">
            <strong title={userProfile?.username || 'My FinTrack'}>
              {userProfile?.username || 'My FinTrack'}
            </strong>

            <span title={userProfile?.email || 'Personal workspace'}>
              {userProfile?.email || 'Personal workspace'}
            </span>
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

      {/* Main Content */}
      <main className="dashboard-main reports-main">
        <header className="dashboard-topbar reports-topbar">
          <div>
            <div className="dashboard-breadcrumb">WORKSPACE / REPORTS &amp; EXPORT</div>
            <h1>Reports &amp; Export</h1>
            <p>Review your financial activity and download your statement.</p>
          </div>
        </header>

        <section className="reports-content">
          {/* Date Filter Card */}
          <div className="reports-filter-card">
            <div className="reports-section-heading">
              <div>
                <h2>Report Period</h2>
                <p>Select a date range to generate your financial report.</p>
              </div>
            </div>

            <form
              className="reports-filter-form"
              onSubmit={handleDateSubmit}
            >
              <div className="reports-filter-field">
                <label htmlFor="report-from-date">From Date</label>
                <input
                  id="report-from-date"
                  type="date"
                  value={fromDate}
                  max={toDate || today}
                  onChange={(event) => setFromDate(event.target.value)}
                  required
                />
              </div>

              <div className="reports-filter-field">
                <label htmlFor="report-to-date">To Date</label>
                <input
                  id="report-to-date"
                  type="date"
                  value={toDate}
                  min={fromDate}
                  max={today}
                  onChange={(event) => setToDate(event.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="reports-primary-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle size={16} className="reports-spinning" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Filter size={16} />
                    Apply Filter
                  </>
                )}
              </button>
            </form>
          </div>

          {error && (
            <div className="reports-error-banner" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="reports-loading">
              <LoaderCircle size={32} className="reports-spinning" />
              <p>Loading financial statement data...</p>
            </div>
          ) : (
            <>
              {/* Financial Metric Cards */}
              <div className="reports-summary-grid">
                <div className="reports-summary-card">
                  <div className="reports-summary-icon balance">
                    <Wallet size={20} />
                  </div>
                  <span>Total Balance</span>
                  <strong>{formatCurrency(totalBalance)}</strong>
                </div>

                <div className="reports-summary-card">
                  <div className="reports-summary-icon income">
                    <TrendingUp size={20} />
                  </div>
                  <span>Total Income</span>
                  <strong>{formatCurrency(totalIncome)}</strong>
                </div>

                <div className="reports-summary-card">
                  <div className="reports-summary-icon expense">
                    <TrendingDown size={20} />
                  </div>
                  <span>Total Expenses</span>
                  <strong>{formatCurrency(totalExpenses)}</strong>
                </div>

                <div className="reports-summary-card">
                  <div className="reports-summary-icon transfer">
                    <ArrowLeftRight size={20} />
                  </div>
                  <span>Total Transfers</span>
                  <strong>{formatCurrency(totalTransfers)}</strong>
                </div>

                <div className="reports-summary-card">
                  <div className="reports-summary-icon cashflow">
                    <ChartNoAxesCombined size={20} />
                  </div>
                  <span>Net Cash Flow</span>
                  <strong
                    className={
                      netCashFlow >= 0 ? 'positive-value' : 'negative-value'
                    }
                  >
                    {formatCurrency(netCashFlow)}
                  </strong>
                </div>
              </div>

              {/* 1. Financial Summary Table */}
              <section className="reports-section">
                <div className="reports-section-heading">
                  <div>
                    <h2>Financial Summary</h2>
                    <p>Overview of period metrics and net balances.</p>
                  </div>
                </div>

                <div className="reports-table-wrapper">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Financial Summary</th>
                        <th className="reports-text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Current balance (active accounts)</td>
                        <td className="reports-amount-cell reports-text-right">
                          {formatCurrency(totalBalance)}
                        </td>
                      </tr>
                      <tr>
                        <td>Income in selected period</td>
                        <td className="reports-amount-cell reports-text-right positive-value">
                          {formatCurrency(totalIncome)}
                        </td>
                      </tr>
                      <tr>
                        <td>Expenses in selected period</td>
                        <td className="reports-amount-cell reports-text-right negative-value">
                          {formatCurrency(totalExpenses)}
                        </td>
                      </tr>
                      <tr>
                        <td>Net cash flow (income - expenses)</td>
                        <td
                          className={`reports-amount-cell reports-text-right ${
                            netCashFlow >= 0
                              ? 'positive-value'
                              : 'negative-value'
                          }`}
                        >
                          {formatCurrency(netCashFlow)}
                        </td>
                      </tr>
                      <tr>
                        <td>Transfers (excluded from income/expenses)</td>
                        <td className="reports-amount-cell reports-text-right">
                          {formatCurrency(totalTransfers)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 2. Account Summary Table */}
              <section className="reports-section">
                <div className="reports-section-heading">
                  <div>
                    <h2>Account Summary</h2>
                    <p>Account balances, cash inflows, and outflows.</p>
                  </div>
                  <span className="reports-count">
                    {accountSummary.length} Accounts
                  </span>
                </div>

                <div className="reports-table-wrapper">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th className="reports-text-right">Current Balance</th>
                        <th className="reports-text-right">Period Income</th>
                        <th className="reports-text-right">Period Expenses</th>
                        <th className="reports-text-right">Transfers In</th>
                        <th className="reports-text-right">Transfers Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountSummary.length > 0 ? (
                        accountSummary.map((acc, index) => (
                          <tr key={acc.id || `acc-${index}`}>
                            <td>
                              <strong>
                                {acc.accountName ||
                                  acc.name ||
                                  acc.bankName ||
                                  '—'}
                              </strong>
                            </td>
                            <td>{getAccountType(acc)}</td>
                            <td>
                              <span className="reports-status-active">
                                {String(acc.status || 'ACTIVE').toUpperCase()}
                              </span>
                            </td>
                            <td className="reports-amount-cell reports-text-right">
                              {formatCurrency(getAccountBalance(acc))}
                            </td>
                            <td className="reports-amount-cell reports-text-right positive-value">
                              {formatCurrency(acc.income)}
                            </td>
                            <td className="reports-amount-cell reports-text-right negative-value">
                              {formatCurrency(acc.expenses)}
                            </td>
                            <td className="reports-amount-cell reports-text-right">
                              {formatCurrency(acc.transfersIn)}
                            </td>
                            <td className="reports-amount-cell reports-text-right">
                              {formatCurrency(acc.transfersOut)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="reports-empty-cell">
                            No active accounts found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 3. Transaction History Table */}
              <section className="reports-section">
                <div className="reports-section-heading">
                  <div>
                    <h2>Transaction History</h2>
                    <p>Detailed records included in this statement period.</p>
                  </div>
                  <span className="reports-count">
                    {statementTransactions.length} Transactions
                  </span>
                </div>

                <div className="reports-table-wrapper">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Account</th>
                        <th>Type</th>
                        <th className="reports-text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementTransactions.length > 0 ? (
                        statementTransactions.map((tx, index) => {
                          const type = getTransactionType(tx)
                          return (
                            <tr key={tx.id || `tx-${index}`}>
                              <td>{formatDate(getTransactionDate(tx))}</td>
                              <td>
                                <strong>
                                  {getTransactionDescription(tx)}
                                </strong>
                              </td>
                              <td>{getTransactionCategory(tx)}</td>
                              <td>{getAccountName(tx)}</td>
                              <td>
                                <span
                                  className={`reports-type-badge ${type.toLowerCase()}`}
                                >
                                  {type}
                                </span>
                              </td>
                              <td className="reports-amount-cell reports-text-right">
                                {formatCurrency(
                                  tx.amount ?? tx.transactionAmount,
                                )}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="reports-empty-cell">
                            No transactions found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4. Expenses by Category Table */}
              <section className="reports-section">
                <div className="reports-section-heading">
                  <div>
                    <h2>Expenses by Category</h2>
                    <p>Category-wise expense breakdown and percentage share.</p>
                  </div>
                </div>

                <div className="reports-table-wrapper">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Expense Category</th>
                        <th className="reports-text-right">Expense Amount</th>
                        <th className="reports-text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseCategories.length > 0 ? (
                        expenseCategories.map((item, index) => (
                          <tr key={item.id || `cat-${index}`}>
                            <td>
                              <strong>{item.category || item.name}</strong>
                            </td>
                            <td className="reports-amount-cell reports-text-right negative-value">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="reports-text-right">
                              {item.share.toFixed(2)}%
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="reports-empty-cell">
                            No expense records found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Download Statement Section */}
              <section className="reports-section">
                <div className="reports-section-heading">
                  <div>
                    <h2>Download Statement</h2>
                    <p>
                      Download your financial statement matching your standard
                      format.
                    </p>
                  </div>
                </div>

                <div className="reports-export-grid">
                  <div className="reports-export-card">
                    <div className="reports-export-icon pdf">
                      <FileText size={26} />
                    </div>
                    <div className="reports-export-copy">
                      <h3>PDF Statement</h3>
                      <p>
                        Structured tabular layout formatted for direct printing
                        and records.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="reports-export-button"
                      onClick={() => handleExportPDF()}
                    >
                      <Download size={16} />
                      Download PDF
                    </button>
                  </div>

                  <div className="reports-export-card">
                    <div className="reports-export-icon excel">
                      <FileSpreadsheet size={26} />
                    </div>
                    <div className="reports-export-copy">
                      <h3>Excel Statement</h3>
                      <p>
                        Styled Excel spreadsheet with summary banners and currency
                        formulas.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="reports-export-button"
                      onClick={() => handleExportExcel()}
                    >
                      <Download size={16} />
                      Download Excel
                    </button>
                  </div>
                </div>
              </section>

              {/* Email Statement Section */}
              <section className="reports-section">
                <div className="reports-email-card">
                  <div className="reports-section-heading">
                    <div>
                      <h2>Email Financial Statement</h2>
                      <p>
                        Send the exact generated statement directly to your
                        registered email.
                      </p>
                    </div>
                    <div className="reports-email-icon">
                      <Mail size={24} />
                    </div>
                  </div>

                  <form
                    className="reports-email-form"
                    onSubmit={handleEmailSubmit}
                  >
                    <div className="reports-email-recipient">
                      <span>Logged-in User Email:</span>
                      <strong>
                        {userProfile?.email || 'Your registered account email'}
                      </strong>
                    </div>

                    <div className="reports-filter-field">
                      <label htmlFor="email-format">Statement Format</label>
                      <select
                        id="email-format"
                        value={emailFormat}
                        onChange={(event) =>
                          setEmailFormat(event.target.value)
                        }
                      >
                        <option value="pdf">PDF Statement (.pdf)</option>
                        <option value="excel">Excel Statement (.xlsx)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="reports-primary-button email-submit-btn"
                      disabled={emailLoading}
                    >
                      {emailLoading ? (
                        <>
                          <LoaderCircle
                            size={16}
                            className="reports-spinning"
                          />
                          Sending to {userProfile?.email || 'email'}...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Statement
                        </>
                      )}
                    </button>
                  </form>

                  {emailMessage && (
                    <div className="reports-success-message" role="status">
                      <CheckCircle2 size={18} />
                      <span>{emailMessage}</span>
                    </div>
                  )}

                  {emailError && (
                    <div className="reports-error-message" role="alert">
                      <AlertCircle size={18} />
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default Reports