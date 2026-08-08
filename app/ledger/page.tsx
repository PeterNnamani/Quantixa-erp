'use client'

import { useMemo, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { calculateBalanceSheet } from '@/lib/accounting/balance-sheet'

function buildLedgerEntries(state: ReturnType<typeof useAccounting>['state']) {
  const accountMap = new Map(state.chartOfAccounts.map((account) => [account.id, account]))

  return state.journalEntries.map((entry) => {
    const lines = state.journalLines.filter((line) => line.entryId === entry.id)
    const debit = lines.reduce((sum, line) => sum + line.debit, 0)
    const credit = lines.reduce((sum, line) => sum + line.credit, 0)
    const balance = debit - credit
    const firstLine = lines[0]
    const account = firstLine ? accountMap.get(firstLine.accountId) : undefined

    return {
      id: entry.id,
      date: entry.entryDate,
      account: account?.name || 'General Ledger',
      description: entry.description,
      debit,
      credit,
      balance,
      source: entry.sourceModule,
      status: entry.status,
      entry,
    }
  })
}

const accountOptions = ['All Accounts', 'Cash', 'Bank', 'Accounts Receivable', 'Accounts Payable', 'Sales Revenue', 'Purchase Account', 'Expense Account', 'Inventory', 'Fixed Assets', 'Loans', 'Capital']
const sourceOptions = ['All Sources', 'Sales', 'Purchases', 'Expenses', 'Inventory', 'Payroll', 'Banking', 'Loans', 'Manual Journal', 'Adjustments']
const statusOptions = ['Posted', 'Pending', 'Draft', 'Reversed']
const typeOptions = ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expense']
const branchOptions = ['All Branches', 'Lagos', 'Abuja', 'Enugu', 'Port Harcourt']

export default function LedgerPage() {
  const { state } = useAccounting()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('All Accounts')
  const [selectedType, setSelectedType] = useState('All Types')
  const [selectedBranch, setSelectedBranch] = useState('All Branches')
  const [selectedSource, setSelectedSource] = useState('All Sources')
  const [selectedStatus, setSelectedStatus] = useState('Posted')
  const [selectedSort, setSelectedSort] = useState('Newest')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number>(0)

  const journalEntries = useMemo(() => buildLedgerEntries(state), [state])

  const filteredEntries = useMemo(() => {
    const query = searchTerm.toLowerCase()

    const result = journalEntries.filter((entry) => {
      const matchesSearch = !query || [entry.id, entry.account, entry.description, entry.source].join(' ').toLowerCase().includes(query)
      const matchesAccount = selectedAccount === 'All Accounts' || entry.account === selectedAccount
      const matchesType = selectedType === 'All Types' || (selectedType === 'Revenue' ? entry.account.includes('Revenue') || entry.source === 'SALES' : true)
      const matchesSource = selectedSource === 'All Sources' || entry.source === selectedSource
      const matchesStatus = selectedStatus === 'All Status' ? true : entry.status === selectedStatus
      const matchesBranch = selectedBranch === 'All Branches' || selectedBranch === 'Lagos'

      return matchesSearch && matchesAccount && matchesType && matchesSource && matchesStatus && matchesBranch
    })

    if (selectedSort === 'Newest') {
      result.sort((a, b) => b.date.localeCompare(a.date))
    } else if (selectedSort === 'Oldest') {
      result.sort((a, b) => a.date.localeCompare(b.date))
    } else if (selectedSort === 'Largest Debit') {
      result.sort((a, b) => b.debit - a.debit)
    } else if (selectedSort === 'Largest Credit') {
      result.sort((a, b) => b.credit - a.credit)
    }

    return result
  }, [journalEntries, searchTerm, selectedAccount, selectedBranch, selectedSource, selectedSort, selectedStatus, selectedType])

  const selectedEntry = filteredEntries[selectedEntryIndex] || filteredEntries[0]

  const balanceRows = calculateBalanceSheet(state.journalLines, state.journalEntries, state.chartOfAccounts)
  const totalAssets = balanceRows.filter((r) => r.accountType === 'ASSET').reduce((s, r) => s + (r.balance || 0), 0)
  const totalLiabilities = balanceRows.filter((r) => r.accountType === 'LIABILITY').reduce((s, r) => s + (r.balance || 0), 0)
  const totalEquity = balanceRows.filter((r) => r.accountType === 'EQUITY').reduce((s, r) => s + (r.balance || 0), 0)

  const todaysDate = new Date().toISOString().slice(0, 10)
  const todaysEntries = state.journalEntries.filter((je) => je.entryDate === todaysDate).length
  const unpostedCount = state.journalEntries.filter((je) => je.status !== 'POSTED').length
  const openPeriod = state.accountingPeriods?.find((p) => p.status === 'OPEN')
  const periodLabel = openPeriod ? new Date(openPeriod.startDate).toLocaleString(undefined, { month: 'long', year: 'numeric' }) : '—'

  const summaryCards = [
    { label: 'Total Assets', value: formatCurrency(totalAssets), tone: 'info' },
    { label: 'Total Liabilities', value: formatCurrency(totalLiabilities), tone: 'info' },
    { label: 'Total Equity', value: formatCurrency(totalEquity), tone: 'info' },
    { label: "Today's Journal Entries", value: formatNumber(todaysEntries), tone: 'info' },
    { label: 'Unposted Journals', value: formatNumber(unpostedCount), tone: unpostedCount > 0 ? 'warning' : 'info' },
    { label: 'Current Accounting Period', value: periodLabel, tone: 'info' },
  ]

  return (
    <AppLayout>
      <div className="ledger-shell">
        <div className="ledger-header">
          <div>
            <div className="pg-title">General Ledger</div>
            <div className="pg-subtitle">View all journal entries, account balances, and financial transactions posted across the organization.</div>
          </div>
          <div className="ledger-actions">
            <button className="ledger-btn secondary">+ Manual Journal</button>
            <button className="ledger-btn secondary">Trial Balance</button>
            <button className="ledger-btn secondary">Export Excel</button>
            <button className="ledger-btn secondary" type="button" onClick={() => setShowFilters((prev) => !prev)}>{showFilters ? 'Hide Filters' : 'Show Filters'}</button>
            <button className="ledger-btn secondary">Export PDF</button>
            <button className="ledger-btn primary">Print</button>
          </div>
        </div>

        {showFilters && (
          <>
            <div className="ledger-summary-grid">
              {summaryCards.map((card) => (
                <div className={`ledger-summary-card ${card.tone}`} key={card.label}>
                  <div className="ledger-summary-label">{card.label}</div>
                  <div className="ledger-summary-value">{card.value}</div>
                </div>
              ))}
            </div>

            <div className="ledger-card">
              <div className="section-head">
                <div>
                  <div className="card-title">Search & Filters</div>
                  <div className="section-subtitle">Filter by account, source, status, and date to investigate the ledger quickly.</div>
                </div>
              </div>

              <div className="ledger-search-row">
                <div className="ledger-search-field">
                  <span>🔎</span>
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search journal entries..." />
                </div>
                <div className="ledger-chip-row">
                  <span className="ledger-chip success">Auto-posted</span>
                  <span className="ledger-chip">Audit ready</span>
                </div>
              </div>

              <div className="ledger-filters-grid">
                <label>
                  <span>Date Filter</span>
                  <select defaultValue="Last 30 Days">
                    <option>Today</option><option>Yesterday</option><option>Last 7 Days</option><option>Last 30 Days</option><option>This Month</option><option>Last Month</option><option>This Quarter</option><option>This Year</option><option>Custom Date</option>
                  </select>
                </label>
                <label>
                  <span>Account</span>
                  <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}>
                    {accountOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  <span>Account Type</span>
                  <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    <option>All Types</option>
                    {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  <span>Branch</span>
                  <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                    {branchOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  <span>Journal Source</span>
                  <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
                    {sourceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                    <option>All Status</option>
                    {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  <span>Sort</span>
                  <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
                    <option>Newest</option><option>Oldest</option><option>Largest Debit</option><option>Largest Credit</option><option>Account Name</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="ledger-content-grid">
              <div className="ledger-card">
                <div className="section-head">
                  <div>
                    <div className="card-title">Ledger Entries</div>
                    <div className="section-subtitle">Showing {filteredEntries.length} journal entries.</div>
                  </div>
                </div>
                <div className="ledger-table-wrap">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Journal No</th>
                        <th>Account</th>
                        <th>Description</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th>Balance</th>
                        <th>Source</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry, idx) => (
                        <tr key={entry.id} onClick={() => setSelectedEntryIndex(idx)} className={selectedEntry?.id === entry.id ? 'selected' : ''}>
                          <td>{entry.date}</td>
                          <td>{entry.id}</td>
                          <td>{entry.account}</td>
                          <td>{entry.description}</td>
                          <td>{formatCurrency(entry.debit)}</td>
                          <td>{entry.credit > 0 ? formatCurrency(entry.credit) : '—'}</td>
                          <td>{formatCurrency(entry.balance)}</td>
                          <td>{entry.source}</td>
                          <td><span className={`ledger-pill ${entry.status === 'Posted' ? 'success' : entry.status === 'Pending' ? 'warning' : 'info'}`}>{entry.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="ledger-side-stack">
                <div className="ledger-card">
                  <div className="section-head">
                    <div>
                      <div className="card-title">Account Balance</div>
                      <div className="section-subtitle">Selected account details.</div>
                    </div>
                  </div>
                  <div className="ledger-detail-panel">
                    <div className="ledger-detail-row"><span>Account Code</span><strong>1001</strong></div>
                    <div className="ledger-detail-row"><span>Account Name</span><strong>{selectedEntry?.account || 'Cash'}</strong></div>
                    <div className="ledger-detail-row"><span>Opening Balance</span><strong>{formatCurrency(1250000)}</strong></div>
                    <div className="ledger-detail-row"><span>Total Debits</span><strong>{formatCurrency(selectedEntry?.debit || 0)}</strong></div>
                    <div className="ledger-detail-row"><span>Total Credits</span><strong>{formatCurrency(selectedEntry?.credit || 0)}</strong></div>
                    <div className="ledger-detail-row"><span>Current Balance</span><strong>{formatCurrency((selectedEntry?.balance || 0) + 1250000)}</strong></div>
                  </div>
                </div>

                <div className="ledger-card">
                  <div className="section-head">
                    <div>
                      <div className="card-title">Trial Balance Preview</div>
                      <div className="section-subtitle">A live view of the period balance.</div>
                    </div>
                  </div>
                  <div className="ledger-balance-list">
                    <div className="ledger-balance-row"><span>Cash</span><strong>{formatCurrency(3250000)}</strong></div>
                    <div className="ledger-balance-row"><span>Sales Revenue</span><strong>{formatCurrency(3250000)}</strong></div>
                    <div className="ledger-balance-row"><span>Expenses</span><strong>{formatCurrency(450000)}</strong></div>
                  </div>
                </div>

                <div className="ledger-card">
                  <div className="section-head">
                    <div>
                      <div className="card-title">Month-End Controls</div>
                      <div className="section-subtitle">Close and manage the accounting period.</div>
                    </div>
                  </div>
                  <div className="ledger-detail-panel">
                    <div className="ledger-detail-row"><span>Current Period</span><strong>July 2026</strong></div>
                    <div className="ledger-detail-row"><span>Period Status</span><strong>Open</strong></div>
                    <div className="ledger-detail-row"><span>Last Closing Date</span><strong>July 28, 2026</strong></div>
                    <div className="ledger-detail-row"><span>Next Closing</span><strong>July 31, 2026</strong></div>
                  </div>
                  <div className="ledger-pill-group">
                    <button className="ledger-btn secondary">Close Period</button>
                    <button className="ledger-btn secondary">Lock Period</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
