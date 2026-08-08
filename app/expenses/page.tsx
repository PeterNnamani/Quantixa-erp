'use client'

import { useMemo, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { Expense } from '@/lib/context'
import { formatCurrency, makeID, getCurrentDate, EXP_CATS, canEdit } from '@/lib/utils'

const datePresets = ['This Month', 'Last 30 Days', 'This Quarter', 'This Year', 'Custom Date']
const banks = ['All Banks', 'Globus Bank', 'Access Bank', 'Zenith Bank', 'UBA']
const categories = ['All Categories', ...EXP_CATS]

function getDateRange(preset: string, customFrom: string, customTo: string) {
  const today = new Date()
  const start = new Date(today)
  const end = new Date(today)

  switch (preset) {
    case 'This Month':
      start.setDate(1)
      break
    case 'Last 30 Days':
      start.setDate(today.getDate() - 29)
      break
    case 'This Quarter': {
      const quarter = Math.floor(today.getMonth() / 3)
      start.setMonth(quarter * 3)
      start.setDate(1)
      break
    }
    case 'This Year':
      start.setMonth(0)
      start.setDate(1)
      break
    case 'Custom Date':
      return { from: customFrom, to: customTo }
    default:
      return { from: '', to: '' }
  }

  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    from: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    to: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  }
}

export default function ExpensesPage() {
  const { state, updateState, user, addAuditLog } = useAccounting()
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedBank, setSelectedBank] = useState('All Banks')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedDateRange, setSelectedDateRange] = useState('This Month')
  const [customFrom, setCustomFrom] = useState(getCurrentDate())
  const [customTo, setCustomTo] = useState(getCurrentDate())
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedExpenseId, setSelectedExpenseId] = useState(state.expenses[0]?.id ?? '')
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 10

  const expenses = useMemo(
    () => state.expenses.filter((expense) => expense.status !== 'VOID'),
    [state.expenses]
  )

  const activeExpense = useMemo(
    () => expenses.find((expense) => expense.id === selectedExpenseId) || expenses[0] || null,
    [expenses, selectedExpenseId]
  )

  const summary = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const monthlyExpenses = expenses
      .filter((expense) => {
        const date = new Date(expense.date)
        const today = new Date()
        return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
      })
      .reduce((sum, expense) => sum + expense.amount, 0)
    const bankSpend = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const categoryCount = new Set(expenses.map((expense) => expense.category)).size
    return { totalExpenses, monthlyExpenses, bankSpend, categoryCount }
  }, [expenses])

  const expensesByCategory = useMemo(() => {
    return categories.slice(1).reduce<Record<string, number>>((acc, category) => {
      acc[category] = expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0)
      return acc
    }, {})
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const range = getDateRange(selectedDateRange, customFrom, customTo)
    const from = range.from ? new Date(range.from) : null
    const to = range.to ? new Date(range.to) : null

    return expenses
      .filter((expense) => {
        if (!term) return true
        return `${expense.id} ${expense.desc} ${expense.category} ${expense.bank} ${expense.notes}`.toLowerCase().includes(term)
      })
      .filter((expense) => selectedCategory === 'All Categories' || expense.category === selectedCategory)
      .filter((expense) => selectedBank === 'All Banks' || expense.bank === selectedBank)
      .filter((expense) => selectedStatus === 'All' || expense.status === selectedStatus)
      .filter((expense) => {
        if (!from || !to) return true
        const date = new Date(expense.date)
        return date >= from && date <= to
      })
  }, [expenses, searchTerm, selectedCategory, selectedBank, selectedStatus, selectedDateRange, customFrom, customTo])

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / itemsPerPage))
  const activePage = Math.min(currentPage, totalPages)
  const paginatedExpenses = filteredExpenses.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage)

  const [formData, setFormData] = useState({
    date: getCurrentDate(),
    desc: '',
    category: EXP_CATS[0],
    amount: 0,
    bank: state.banks ? Object.keys(state.banks)[0] ?? 'Globus Bank' : 'Globus Bank',
    notes: '',
  })

  const handleSaveExpense = () => {
    if (!formData.desc || !formData.amount) {
      alert('Please enter description and amount for this expense.')
      return
    }

    const expense: Expense = {
      id: makeID('EXP'),
      date: formData.date,
      desc: formData.desc,
      category: formData.category,
      amount: formData.amount,
      bank: formData.bank,
      notes: formData.notes,
      status: 'ACTIVE',
      enteredBy: user?.name || 'System',
    }

    const updatedBanks = { ...state.banks }
    updatedBanks[formData.bank] = (updatedBanks[formData.bank] ?? 0) - formData.amount

    const bankTxn = {
      id: makeID('TXN'),
      date: formData.date,
      name: expense.desc,
      activity: 'Expense payment',
      method: expense.bank,
      amount: -formData.amount,
      status: 'Completed',
      description: `Expense ${expense.category} paid from ${expense.bank}`,
      attachments: 0,
      type: 'Withdrawal',
      bank: expense.bank,
    }

    updateState({
      expenses: [...state.expenses, expense],
      banks: updatedBanks,
      bankTxns: [bankTxn, ...state.bankTxns],
    })

    addAuditLog('CREATE', 'EXPENSE', expense.id, `${expense.category} expense recorded: ${formatCurrency(expense.amount)}`)
    setShowForm(false)
    setFormData({
      date: getCurrentDate(),
      desc: '',
      category: EXP_CATS[0],
      amount: 0,
      bank: state.banks ? Object.keys(state.banks)[0] ?? 'Globus Bank' : 'Globus Bank',
      notes: '',
    })
  }

  const handleVoidExpense = (expenseId: string) => {
    const expense = state.expenses.find((item) => item.id === expenseId)
    if (!expense) return

    const newBanks = { ...state.banks }
    newBanks[expense.bank] = (newBanks[expense.bank] ?? 0) + expense.amount

    updateState({
      expenses: state.expenses.map((item) => (item.id === expenseId ? { ...item, status: 'VOID' } : item)),
      banks: newBanks,
    })

    addAuditLog('VOID', 'EXPENSE', expenseId, `Voided expense ${expense.id}`)
  }

  return (
    <AppLayout>
      <div className="module-shell">
        <div className="module-header">
          <div>
            <div className="module-title">Expenses</div>
            <div className="module-subtitle">Control operating spend, categorize costs and reconcile every payment across bank accounts.</div>
          </div>
          <div className="module-actions">
            <button className="btn btn-secondary" onClick={() => setShowFilters((prev) => !prev)}>{showFilters ? 'Hide Filters' : 'Show Filters'}</button>
            <button className="btn btn-secondary">Export</button>
            <button className="btn btn-secondary">Reconcile</button>
            {canEdit(user?.role || '') && <button className="btn btn-primary" onClick={() => setShowForm((prev) => !prev)}>{showForm ? 'Close Form' : '+ New Expense'}</button>}
          </div>
        </div>

        <div className="dashboard-card-grid">
          <div className="dashboard-card">
            <div className="metric-label">Total Expenses</div>
            <div className="metric-value">{formatCurrency(summary.totalExpenses)}</div>
          </div>
          <div className="dashboard-card">
            <div className="metric-label">Monthly Spend</div>
            <div className="metric-value">{formatCurrency(summary.monthlyExpenses)}</div>
          </div>
          <div className="dashboard-card">
            <div className="metric-label">Bank Spend</div>
            <div className="metric-value">{formatCurrency(summary.bankSpend)}</div>
          </div>
          <div className="dashboard-card">
            <div className="metric-label">Expense Categories</div>
            <div className="metric-value">{summary.categoryCount}</div>
          </div>
        </div>

        {showFilters && (
          <div className="filter-panel">
            <div className="section-head">
              <div>
                <div className="card-title">Expense Filters</div>
                <div className="section-subtitle">Search, categorize and slice expense transactions by date, bank and cost center.</div>
              </div>
            </div>
            <div className="filter-row">
              <label>
                Search
                <input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} placeholder="Description, notes, bank or category..." />
              </label>
              <label>
                Category
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  {categories.map((category) => (<option key={category}>{category}</option>))}
                </select>
              </label>
              <label>
                Bank
                <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                  {banks.map((bank) => (<option key={bank}>{bank}</option>))}
                </select>
              </label>
              <label>
                Status
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option>All</option>
                  <option>ACTIVE</option>
                  <option>VOID</option>
                </select>
              </label>
              <label>
                Date Range
                <select value={selectedDateRange} onChange={(e) => setSelectedDateRange(e.target.value)}>
                  {datePresets.map((preset) => (<option key={preset}>{preset}</option>))}
                </select>
              </label>
              {selectedDateRange === 'Custom Date' && (
                <>
                  <label>
                    From
                    <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                  </label>
                  <label>
                    To
                    <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                  </label>
                </>
              )}
            </div>
          </div>
        )}

        {showForm && (
          <div className="card">
            <div className="card-hd">
              <div className="card-title">Record Expense</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Close</button>
            </div>
            <div className="form-grid">
              <div className="fg">
                <label>Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="fg">
                <label>Description</label>
                <input value={formData.desc} onChange={(e) => setFormData({ ...formData, desc: e.target.value })} placeholder="Expense description" />
              </div>
              <div className="fg">
                <label>Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  {EXP_CATS.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
              <div className="fg">
                <label>Amount</label>
                <input type="number" min={0} value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="fg">
                <label>Paid From</label>
                <select value={formData.bank} onChange={(e) => setFormData({ ...formData, bank: e.target.value })}>
                  {Object.keys(state.banks).map((bank) => (<option key={bank}>{bank}</option>))}
                </select>
              </div>
              <div className="fg">
                <label>Notes</label>
                <input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional remarks" />
              </div>
            </div>
            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSaveExpense}>Save Expense</button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="module-content-grid">
          <div>
            <div className="card">
              <div className="card-hd">
                <div className="card-title">Expense Register</div>
                <div className="table-summary">Showing {filteredExpenses.length} expense{filteredExpenses.length === 1 ? '' : 's'}</div>
              </div>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Bank</th>
                      <th className="td-r">Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
                          No expenses match current filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedExpenses.map((expense) => (
                        <tr key={expense.id} onClick={() => setSelectedExpenseId(expense.id)} className={selectedExpenseId === expense.id ? 'selected' : ''}>
                          <td>{expense.id}</td>
                          <td>{expense.date}</td>
                          <td>{expense.desc}</td>
                          <td>{expense.category}</td>
                          <td>{expense.bank}</td>
                          <td className="td-r">{formatCurrency(expense.amount)}</td>
                          <td><span className={`badge ${expense.status === 'VOID' ? 'b-red' : 'b-blue'}`}>{expense.status}</span></td>
                          <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {canEdit(user?.role || '') && expense.status !== 'VOID' && (
                              <button className="btn btn-sm btn-danger" onClick={() => handleVoidExpense(expense.id)}>Void</button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="txn-footer" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-sm btn-secondary" type="button" onClick={() => setCurrentPage(Math.max(1, activePage - 1))} disabled={activePage === 1}>‹</button>
                  <span className="page-info">Page {activePage} of {totalPages}</span>
                  <button className="btn btn-sm btn-secondary" type="button" onClick={() => setCurrentPage(Math.min(totalPages, activePage + 1))} disabled={activePage === totalPages}>›</button>
                </div>
              )}
            </div>
          </div>

          <div className="detail-panel">
            <div className="detail-section">
              <div className="detail-section-title">Expense Snapshot</div>
              <div className="detail-row"><span>ID</span><strong>{activeExpense?.id || '-'}</strong></div>
              <div className="detail-row"><span>Date</span><strong>{activeExpense?.date || '-'}</strong></div>
              <div className="detail-row"><span>Description</span><strong>{activeExpense?.desc || '-'}</strong></div>
              <div className="detail-row"><span>Category</span><strong>{activeExpense?.category || '-'}</strong></div>
              <div className="detail-row"><span>Bank</span><strong>{activeExpense?.bank || '-'}</strong></div>
              <div className="detail-row"><span>Status</span><strong>{activeExpense?.status || '-'}</strong></div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Financial Summary</div>
              <div className="detail-row"><span>Amount</span><strong>{formatCurrency(activeExpense?.amount ?? 0)}</strong></div>
              <div className="detail-row"><span>Remaining</span><strong>{formatCurrency(0)}</strong></div>
              <div className="detail-row"><span>Recorded By</span><strong>{activeExpense?.enteredBy || '-'}</strong></div>
              <div className="detail-row"><span>Notes</span><strong>{activeExpense?.notes || '-'}</strong></div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Category Spend</div>
              <div style={{ display: 'grid', gap: 12 }}>
                {Object.entries(expensesByCategory).map(([category, amount]) => (
                  <div key={category} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: 'var(--bg2)', borderRadius: '14px' }}>
                    <span style={{ color: 'var(--text2)' }}>{category}</span>
                    <strong>{formatCurrency(amount)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="workflow-panel">
              <div className="detail-section-title">Expense workflow</div>
              {['Request logged', 'Approval completed', 'Payment posted', 'Bank reconciled', 'Cost center updated'].map((step) => (
                <div key={step} className="workflow-step">
                  <strong>{step}</strong>
                  <span>Completed</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card-grid">
          <div className="chart-card">
            <div className="chart-card-title">Expense Trend</div>
            <div className="chart-placeholder">Chart placeholder</div>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">Bank Impact</div>
            <div className="chart-placeholder">Chart placeholder</div>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">Category Breakdown</div>
            <div className="chart-placeholder">Chart placeholder</div>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">High-Value Expenses</div>
            <div className="chart-placeholder">Chart placeholder</div>
          </div>
        </div>

        <div className="reports-row">
          <button className="btn btn-secondary">Expense Report</button>
          <button className="btn btn-secondary">Category Report</button>
          <button className="btn btn-secondary">Bank Reconciliation</button>
          <button className="btn btn-secondary">Approval Audit</button>
          <button className="btn btn-secondary">Cost Center Report</button>
        </div>
      </div>
    </AppLayout>
  )
}
