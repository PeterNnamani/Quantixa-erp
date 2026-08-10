'use client'

import AppLayout from '@/components/layout/app-layout'
import { useMemo, useState } from 'react'
import { useAccounting } from '@/lib/context'
import { formatCurrency, formatNumber, triggerAppToast } from '@/lib/utils'
import { downloadExcel } from '@/lib/export-utils'

const summaryCards = [
  { label: 'Total Prepaid Amount', value: formatCurrency(0), subtitle: 'No prepayments yet', tone: 'info' },
  { label: 'Remaining Balance', value: formatCurrency(0), subtitle: 'No prepayments yet', tone: 'warning' },
  { label: 'Recognized This Month', value: formatCurrency(0), subtitle: 'No prepayments yet', tone: 'success' },
  { label: 'Expiring Soon', value: '0', subtitle: 'No prepayments yet', tone: 'amber' },
  { label: 'Supplier Advances', value: formatCurrency(0), subtitle: 'No prepayments yet', tone: 'purple' },
  { label: 'Active Schedules', value: '0', subtitle: 'No prepayments yet', tone: 'info' },
]

const categories = ['All', 'Supplier Advances', 'Rent', 'Insurance', 'Subscriptions', 'Maintenance', 'Utilities', 'Licenses', 'Marketing', 'Other']
const statuses = ['All', 'Active', 'Fully Used', 'Expired', 'Cancelled', 'Pending Approval']
const paymentSources = ['All', 'Cash', 'Bank Account', 'Card', 'Mobile Money']
const recognitionStatuses = ['All', 'Not Started', 'Partially Recognized', 'Fully Recognized']
const dates = ['All', 'Today', 'This Month', 'This Quarter', 'This Year', 'Custom']

const fallbackPrepayments: any[] = []

const upcomingAlerts = [
  { note: 'Insurance expires in 30 days', tone: 'success' },
  { note: 'Microsoft license expires in 15 days', tone: 'warning' },
  { note: 'Warehouse rent renewal next month', tone: 'info' },
]

const aiInsights = [
  'No prepayment data has been entered yet. Once records are created, insights will appear here.',
]

export default function PrepaymentsPage() {
  const { state } = useAccounting()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedSource, setSelectedSource] = useState('All')
  const [selectedRecognition, setSelectedRecognition] = useState('All')
  const [selectedDate, setSelectedDate] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReference, setSelectedReference] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const prepayments = state.prepayments.length > 0 ? state.prepayments : fallbackPrepayments

  const filteredPrepayments = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return prepayments.filter((item) => {
      const matchesQuery =
        !query ||
        [item.reference, item.type, item.supplier, item.paymentMethod, item.referenceNo].join(' ').toLowerCase().includes(query)
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus
      const matchesSource = selectedSource === 'All' || item.paymentSource === selectedSource
      const matchesRecognition = selectedRecognition === 'All' || item.recognitionStatus === selectedRecognition
      return matchesQuery && matchesCategory && matchesStatus && matchesSource && matchesRecognition
    })
  }, [prepayments, searchTerm, selectedCategory, selectedStatus, selectedSource, selectedRecognition])

  const selectedPrepayment = filteredPrepayments.find((item) => item.reference === selectedReference) || filteredPrepayments[0] || null

  const agingData = [
    { period: 'No records', amount: '—' },
  ]

  const handlePrepaymentAction = (action: string) => {
    triggerAppToast(action, 'The prepayment workflow has been queued.')
    if (action === 'Export') {
      downloadExcel('prepayments-export.xlsx', filteredPrepayments)
    }
    if (action === 'Reports') {
      triggerAppToast('Reports', 'Prepayment reports are being prepared.')
    }
  }

  return (
    <AppLayout>
      <div className="prepayments-shell">
        <div className="prepayments-header">
          <div>
            <div className="pg-title">Prepayments</div>
            <div className="pg-subtitle">Manage advance payments, prepaid expenses, supplier advances, and automatic expense recognition.</div>
          </div>
          <div className="prepayments-actions">
            <button type="button" className="page-btn primary" onClick={() => handlePrepaymentAction('+ New Prepayment')}>+ New Prepayment</button>
            <button type="button" className="page-btn secondary" onClick={() => handlePrepaymentAction('+ Record Adjustment')}>+ Record Adjustment</button>
            <button type="button" className="page-btn secondary" onClick={() => handlePrepaymentAction('Create Schedule')}>Create Schedule</button>
            <button type="button" className="page-btn secondary" onClick={() => setShowFilters((prev) => !prev)}>{showFilters ? 'Hide Filters' : 'Show Filters'}</button>
            <button type="button" className="page-btn secondary" onClick={() => handlePrepaymentAction('Export')}>Export</button>
            <button type="button" className="page-btn secondary" onClick={() => handlePrepaymentAction('Reports')}>Reports</button>
          </div>
        </div>

        <div className="prepayments-summary-grid">
          {summaryCards.map((card) => (
            <div key={card.label} className={`summary-card ${card.tone}`}>
              <div className="summary-label">{card.label}</div>
              <div className="summary-value">{card.value}</div>
              <div className="summary-subtitle">{card.subtitle}</div>
            </div>
          ))}
        </div>

        <div className="prepayments-category-bar">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="prepayments-filters-card card">
            <div className="card-hd">
              <div>
                <div className="card-title">Search & Filters</div>
                <div className="section-subtitle">Search prepayments, suppliers, references, and filter recognition or payment status.</div>
              </div>
            </div>
            <div className="prepayments-search-row">
              <div className="prepayments-search-field">
                <span>🔍</span>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search prepayment, supplier, reference..."
                />
              </div>
              <div className="prepayments-filter-row">
                <label>
                  Status
                  <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                    {statuses.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Payment Source
                  <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
                    {paymentSources.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Recognition
                  <select value={selectedRecognition} onChange={(e) => setSelectedRecognition(e.target.value)}>
                    {recognitionStatuses.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Date
                  <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
                    {dates.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="prepayments-main-grid">
          <div className="prepayments-left">
            <div className="card">
              <div className="card-hd">
                <div>
                  <div className="card-title">Prepayment Ledger</div>
                  <div className="section-subtitle">Reference, supplier, amounts, recognition status, and progress.</div>
                </div>
              </div>
              <div className="tbl-wrap">
                <table className="prepayments-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Type</th>
                      <th>Supplier/Vendor</th>
                      <th>Date Paid</th>
                      <th className="td-r">Original Amount</th>
                      <th className="td-r">Used</th>
                      <th className="td-r">Remaining</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrepayments.map((item) => (
                      <tr
                        key={item.reference}
                        onClick={() => setSelectedReference(item.reference)}
                        className={selectedReference === item.reference ? 'table-row-selected' : ''}
                      >
                        <td>{item.reference}</td>
                        <td>{item.type}</td>
                        <td>{item.supplier}</td>
                        <td>{item.datePaid}</td>
                        <td className="td-r">{formatCurrency(item.originalAmount)}</td>
                        <td className="td-r">{formatCurrency(item.usedAmount)}</td>
                        <td className="td-r">{formatCurrency(item.remainingAmount)}</td>
                        <td><span className={`status-pill ${item.status === 'Active' ? 'success' : item.status === 'Pending Delivery' ? 'warning' : item.status === 'Expired' ? 'critical' : 'info'}`}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-hd">
                <div>
                  <div className="card-title">Recognition Schedule</div>
                  <div className="section-subtitle">Monthly expense recognition for the selected prepayment.</div>
                </div>
              </div>
              <div className="schedule-list">
                {selectedPrepayment?.schedule?.map((item) => (
                  <div key={item.period} className="schedule-item">
                    <div>
                      <strong>{item.period}</strong>
                      <p>{formatCurrency(item.amount)}</p>
                    </div>
                    <span>{item.completed ? '✓' : ''}</span>
                  </div>
                ))}
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${selectedPrepayment?.recognitionProgress || 0}%` }} />
              </div>
              <div className="progress-label">{selectedPrepayment?.recognitionProgress || 0}% Recognized</div>
            </div>
          </div>

          <div className="prepayments-right">
            <div className="card detail-card">
              <div className="card-hd">
                <div>
                  <div className="card-title">Prepayment Detail</div>
                  <div className="section-subtitle">Core payment, schedule, and supplier advance information.</div>
                </div>
              </div>
              <div className="detail-panel">
                <div className="detail-row"><span>Reference</span><strong>{selectedPrepayment?.reference}</strong></div>
                <div className="detail-row"><span>Type</span><strong>{selectedPrepayment?.type}</strong></div>
                <div className="detail-row"><span>Amount Paid</span><strong>{formatCurrency(selectedPrepayment?.originalAmount || 0)}</strong></div>
                <div className="detail-row"><span>Remaining Balance</span><strong>{formatCurrency(selectedPrepayment?.remainingAmount || 0)}</strong></div>
                <div className="detail-row"><span>Recognition Period</span><strong>{selectedPrepayment?.schedule?.length || 0} Months</strong></div>
                <div className="detail-row"><span>Monthly Expense</span><strong>{formatCurrency(Math.round((selectedPrepayment?.originalAmount || 0) / Math.max(selectedPrepayment?.schedule?.length || 1, 1)))}</strong></div>
                <div className="detail-row"><span>Start Date</span><strong>{selectedPrepayment?.startDate}</strong></div>
                <div className="detail-row"><span>End Date</span><strong>{selectedPrepayment?.endDate}</strong></div>
              </div>
            </div>

            <div className="card detail-card">
              <div className="card-hd">
                <div>
                  <div className="card-title">Payment Information</div>
                  <div className="section-subtitle">Captured payment source, supplier, and transaction details.</div>
                </div>
              </div>
              <div className="detail-panel">
                <div className="detail-row"><span>Paid To</span><strong>{selectedPrepayment?.supplier}</strong></div>
                <div className="detail-row"><span>Payment Method</span><strong>{selectedPrepayment?.paymentMethod}</strong></div>
                <div className="detail-row"><span>Bank Account</span><strong>{selectedPrepayment?.bankAccount}</strong></div>
                <div className="detail-row"><span>Reference</span><strong>{selectedPrepayment?.referenceNo}</strong></div>
                <div className="detail-row"><span>Recorded By</span><strong>{selectedPrepayment?.recordedBy}</strong></div>
              </div>
            </div>

            <div className="card analytics-card">
              <div className="card-hd">
                <div>
                  <div className="card-title">Prepayment Aging</div>
                  <div className="section-subtitle">Aging buckets showing prepaid expense timing.</div>
                </div>
              </div>
              <div className="aging-list">
                {agingData.map((item) => (
                  <div key={item.period} className="aging-row">
                    <span>{item.period}</span>
                    <strong>{item.amount}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="card analytics-card">
              <div className="card-hd">
                <div>
                  <div className="card-title">Upcoming Expirations</div>
                  <div className="section-subtitle">Smart alerts for soon-to-expire prepayments and licenses.</div>
                </div>
              </div>
              <div className="alerts-list">
                {upcomingAlerts.map((alert) => (
                  <div key={alert.note} className={`alert-line ${alert.tone}`}>
                    <span>🔔</span>
                    <span>{alert.note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card analytics-card">
              <div className="card-hd">
                <div>
                  <div className="card-title">QUANTIXA Insights</div>
                  <div className="section-subtitle">Actionable recommendations for prepaid cash and supplier advances.</div>
                </div>
              </div>
              <div className="ai-list">
                {aiInsights.map((insight) => (
                  <div key={insight} className="ai-item">
                    <p>{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
