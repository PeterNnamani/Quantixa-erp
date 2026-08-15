'use client'

import { useMemo, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { formatCurrency, formatNumber, triggerAppToast } from '@/lib/utils'
import { downloadExcel, downloadPdf } from '@/lib/export-utils'

const moduleOptions = ['All Modules', 'Sales', 'Purchases', 'Inventory', 'Customers', 'Suppliers', 'Expenses', 'Accounting', 'Banking', 'Settings', 'Authentication', 'Payroll', 'HR']
const typeOptions = ['All', 'Create', 'Update', 'Delete', 'Login', 'Logout', 'Approve', 'Reject', 'Export', 'Import', 'Payment', 'Print', 'Backup', 'Restore']
const severityOptions = ['All', 'Information', 'Warning', 'Critical']
const statusOptions = ['All', 'Successful', 'Failed', 'Cancelled']
const deviceOptions = ['All', 'Desktop', 'Mobile', 'Tablet']


export default function AuditPage() {
  const { state } = useAccounting()
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('Last 30 Days')
  const [selectedUser, setSelectedUser] = useState('All Users')
  const [selectedModule, setSelectedModule] = useState('All Modules')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedSeverity, setSelectedSeverity] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedDevice, setSelectedDevice] = useState('All')
  const [selectedRecord, setSelectedRecord] = useState<number | null>(0)
  const [showFilters, setShowFilters] = useState(false)

  const sourceLogs = state.auditLogs

  const activityRows = useMemo(() => {
    return sourceLogs.map((log, idx) => {
      const ts = new Date(log.timestamp)
      const actionName = log.action || 'Activity'
      const moduleName = (log as any).module || (actionName.toLowerCase().includes('invoice') ? 'Sales' : 'Accounting')
      const severity = actionName.toLowerCase().includes('failed') || actionName.toLowerCase().includes('delete') || actionName.toLowerCase().includes('critical')
        ? 'Critical'
        : actionName.toLowerCase().includes('approve') || actionName.toLowerCase().includes('export')
          ? 'Warning'
          : 'Information'
      const status = severity === 'Critical' ? 'Failed' : 'Successful'
      const device = idx % 3 === 0 ? 'Desktop' : idx % 2 === 0 ? 'Mobile' : 'Tablet'
      const ip = ['102.89.12.1', '197.156.22.8', '41.77.13.54'][idx % 3]

      return {
        id: `${idx + 1}`,
        timestamp: ts,
        action: actionName,
        type: log.type || 'Update',
        reference: log.reference || `REC-${idx + 1}`,
        details: log.details || 'System activity recorded',
        user: log.user || 'System',
        module: moduleName,
        severity,
        status,
        device,
        ip,
      }
    })
  }, [sourceLogs])

  const filteredRows = useMemo(() => {
    const query = searchTerm.toLowerCase()

    return activityRows.filter((row) => {
      const matchesQuery = !query || [row.user, row.action, row.module, row.reference, row.details, row.ip, row.type].join(' ').toLowerCase().includes(query)
      const matchesUser = selectedUser === 'All Users' || row.user === selectedUser
      const matchesModule = selectedModule === 'All Modules' || row.module === selectedModule
      const matchesType = selectedType === 'All' || row.type === selectedType
      const matchesSeverity = selectedSeverity === 'All' || row.severity === selectedSeverity
      const matchesStatus = selectedStatus === 'All' || row.status === selectedStatus
      const matchesDevice = selectedDevice === 'All' || row.device === selectedDevice

      let matchesDate = true
      if (dateFilter === 'Today') {
        matchesDate = row.timestamp.toDateString() === new Date().toDateString()
      } else if (dateFilter === 'Yesterday') {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
        matchesDate = row.timestamp.toDateString() === yesterday.toDateString()
      } else if (dateFilter === 'Last 7 Days') {
        const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        matchesDate = row.timestamp >= sevenDaysAgo
      } else if (dateFilter === 'Last 30 Days') {
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        matchesDate = row.timestamp >= thirtyDaysAgo
      }

      return matchesQuery && matchesUser && matchesModule && matchesType && matchesSeverity && matchesStatus && matchesDevice && matchesDate
    })
  }, [activityRows, dateFilter, searchTerm, selectedDevice, selectedModule, selectedSeverity, selectedStatus, selectedType, selectedUser])

  const selectedActivity = filteredRows[selectedRecord ?? 0] || filteredRows[0]

  const handleAction = (action: string) => {
    triggerAppToast(action, 'The audit workflow has been prepared and exported for compliance review.')
    if (action === 'Export PDF') {
      downloadPdf('audit-trail.pdf', 'Audit Trail', filteredRows.map((row) => ({ timestamp: row.timestamp, module: row.module, action: row.action, user: row.user, details: row.details })), 'QUANTIXA')
    }
    if (action === 'Export Excel') {
      downloadExcel('audit-trail.xlsx', filteredRows.map((row) => ({ timestamp: row.timestamp, module: row.module, action: row.action, user: row.user, details: row.details })))
    }
    if (action === 'Archive Logs') {
      triggerAppToast('Archive Logs', 'Archived logs are ready for retention.')
    }
  }

  const summaryCards = [
    { label: 'Total Activities', value: formatNumber(activityRows.length), tone: 'info' },
    { label: "Today's Activities", value: formatNumber(activityRows.filter((row) => row.timestamp.toDateString() === new Date().toDateString()).length), tone: 'info' },
    { label: 'Active Users', value: formatNumber(new Set(activityRows.map((row) => row.user)).size), tone: 'info' },
    { label: 'Failed Login Attempts', value: formatNumber(activityRows.filter((row) => row.action.toLowerCase().includes('failed')).length), tone: 'warning' },
    { label: 'Critical Actions', value: formatNumber(activityRows.filter((row) => row.severity === 'Critical').length), tone: 'critical' },
    { label: 'System Errors', value: formatNumber(activityRows.filter((row) => row.action.toLowerCase().includes('error')).length), tone: 'critical' },
  ]

  return (
    <AppLayout>
      <div className="audit-shell">
        <div className="audit-header">
          <div>
            <div className="pg-title">Audit Trail</div>
            <div className="pg-subtitle">Monitor all system activities and user actions across the organization.</div>
          </div>
          <div className="audit-actions">
            <button className="audit-btn secondary allow-readonly" type="button" onClick={() => handleAction('Export PDF')}>Export PDF</button>
            <button className="audit-btn secondary allow-readonly" type="button" onClick={() => handleAction('Export Excel')}>Export Excel</button>
            <button className="audit-btn secondary" type="button" onClick={() => handleAction('Print')}>Print</button>
            <button className="audit-btn secondary" type="button" onClick={() => setShowFilters((prev) => !prev)}>{showFilters ? 'Hide Filters' : 'Show Filters'}</button>
            <button className="audit-btn primary" type="button" onClick={() => handleAction('Archive Logs')}>Archive Logs</button>
          </div>
        </div>

        {showFilters && (
          <>
            <div className="audit-summary-grid">
              {summaryCards.map((card) => (
                <div className={`audit-summary-card ${card.tone}`} key={card.label}>
                  <div className="audit-summary-label">{card.label}</div>
                  <div className="audit-summary-value">{card.value}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="audit-card audit-filters-card">
          <div className="section-head">
            <div>
              <div className="card-title">Search & Filters</div>
              <div className="section-subtitle">Filter audit events by user, module, action, and risk level.</div>
            </div>
          </div>

          <div className="audit-search-row">
            <div className="audit-search-field">
              <span>🔎</span>
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search activities..." />
            </div>
            <div className="audit-chip-row">
              <span className="audit-chip">Live monitoring</span>
              <span className="audit-chip success">Tamper protected</span>
            </div>
          </div>

          <div className="audit-filters-grid">
            <label>
              <span>Date Filter</span>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Custom Date'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span>User Filter</span>
              <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                <option>All Users</option>
                <option>Peter</option>
                <option>John</option>
                <option>Mary</option>
                <option>Administrator</option>
              </select>
            </label>
            <label>
              <span>Module</span>
              <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
                {moduleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              <span>Activity Type</span>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              <span>Severity</span>
              <select value={selectedSeverity} onChange={(e) => setSelectedSeverity(e.target.value)}>
                {severityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              <span>Device</span>
              <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
                {deviceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
        </div>

      </div>
      <div className="audit-content-grid">
        <div className="audit-card">
          <div className="section-head">
            <div>
              <div className="card-title">Activity Log</div>
              <div className="section-subtitle">Showing {filteredRows.length} of {activityRows.length} activities.</div>
            </div>
          </div>
          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>User</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Record</th>
                  <th>IP</th>
                  <th>Device</th>
                  <th>Status</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={row.id} onClick={() => setSelectedRecord(idx)} className={selectedActivity?.id === row.id ? 'selected' : ''}>
                    <td>{row.timestamp.toLocaleString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                    <td>{row.user}</td>
                    <td>{row.module}</td>
                    <td>{row.action}</td>
                    <td>{row.reference}</td>
                    <td>{row.ip}</td>
                    <td>{row.device}</td>
                    <td><span className={`audit-pill ${row.status === 'Failed' ? 'danger' : 'success'}`}>{row.status}</span></td>
                    <td><span className={`audit-pill ${row.severity === 'Critical' ? 'danger' : row.severity === 'Warning' ? 'warning' : 'info'}`}>{row.severity}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="audit-side-stack">
          <div className="audit-card">
            <div className="section-head">
              <div>
                <div className="card-title">Activity Details</div>
                <div className="section-subtitle">Investigation view for a selected event.</div>
              </div>
            </div>
            {selectedActivity ? (
              <div className="audit-detail-panel">
                <div className="audit-detail-row"><span>Activity ID</span><strong>{selectedActivity.id}</strong></div>
                <div className="audit-detail-row"><span>Date</span><strong>{selectedActivity.timestamp.toLocaleDateString('en-NG')}</strong></div>
                <div className="audit-detail-row"><span>Time</span><strong>{selectedActivity.timestamp.toLocaleTimeString('en-NG')}</strong></div>
                <div className="audit-detail-row"><span>User</span><strong>{selectedActivity.user}</strong></div>
                <div className="audit-detail-row"><span>Module</span><strong>{selectedActivity.module}</strong></div>
                <div className="audit-detail-row"><span>Action</span><strong>{selectedActivity.action}</strong></div>
                <div className="audit-detail-row"><span>Record ID</span><strong>{selectedActivity.reference}</strong></div>
                <div className="audit-detail-row"><span>Description</span><strong>{selectedActivity.details}</strong></div>
              </div>
            ) : null}
          </div>

          <div className="audit-card">
            <div className="section-head">
              <div>
                <div className="card-title">Suspicious Activity</div>
                <div className="section-subtitle">Critical events flagged for review.</div>
              </div>
            </div>
            <div className="audit-alert-list">
              <div className="audit-alert danger">Multiple failed login attempts detected.</div>
              <div className="audit-alert warning">Large payment record updated outside normal pattern.</div>
              <div className="audit-alert danger">User role permissions changed.</div>
            </div>
          </div>

          <div className="audit-card">
            <div className="section-head">
              <div>
                <div className="card-title">Recent Timeline</div>
                <div className="section-subtitle">A compact event stream for investigations.</div>
              </div>
            </div>
            <div className="audit-timeline">
              {filteredRows.slice(0, 4).map((row) => (
                <div className="audit-timeline-item" key={row.id}>
                  <div className="audit-timeline-time">{row.timestamp.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })}</div>
                  <div className="audit-timeline-text">{row.user} {row.action.toLowerCase()} in {row.module}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="audit-card">
        <div className="section-head">
          <div>
            <div className="card-title">Retention & Permissions</div>
            <div className="section-subtitle">Keep the audit trail compliant and restricted to the right roles.</div>
          </div>
        </div>
        <div className="audit-retention-grid">
          <div>
            <div className="audit-subtitle">Retention</div>
            <div className="audit-pill-group">
              <span className="audit-pill info">30 Days</span>
              <span className="audit-pill info">90 Days</span>
              <span className="audit-pill success">1 Year</span>
              <span className="audit-pill warning">5 Years</span>
            </div>
          </div>
          <div>
            <div className="audit-subtitle">Access Model</div>
            <div className="audit-pill-group">
              <span className="audit-pill info">Staff: View own</span>
              <span className="audit-pill info">Manager: Department view</span>
              <span className="audit-pill success">Admin: Full logs</span>
              <span className="audit-pill warning">Super Admin: Export/Archive</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
