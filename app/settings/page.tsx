'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { formatCurrency } from '@/lib/utils'
import { getDefaultRoles, saveRoles, type RoleDefinition, type PermissionKey } from '@/lib/rbac'
import { parseSpreadsheetFile, prepareGenericImportPayload, type ImportSummary } from '@/lib/import-utils'
import { Plus, Landmark, WalletCards } from 'lucide-react'

const bankMasterList = ['UBA', 'Access Bank', 'GTBank', 'Zenith Bank', 'First Bank', 'Stanbic IBTC', 'Fidelity Bank', 'FCMB', 'Union Bank', 'Sterling Bank']

const sidebarSections = [
  { id: 'company', label: 'Company', description: 'Profile, branding, and legal details' },
  { id: 'business', label: 'Business', description: 'Defaults, dates, and workflow' },
  { id: 'bank-management', label: 'Bank & Cash', description: 'Accounts, opening balances, and access' },
  { id: 'notifications', label: 'Notifications', description: 'Email, SMS, and push' },
  { id: 'security', label: 'Security', description: 'Auth, sessions, and policies' },
  { id: 'integrations', label: 'Integrations', description: 'Payments, storage, and APIs' },
  { id: 'ai', label: 'AI Assistant', description: 'Automation and insights' },
]

export default function SettingsPage() {
  const { state, updateState, addAuditLog, user } = useAccounting()
  const [openingCapital, setOpeningCapital] = useState(state.openingCapital)
  const [activeSection, setActiveSection] = useState('company')
  const [newBankName, setNewBankName] = useState(bankMasterList[0])
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountNumber, setNewAccountNumber] = useState('')
  const [newAccountType, setNewAccountType] = useState<'Current' | 'Savings' | 'Cash' | 'Wallet' | 'Other'>('Current')
  const [newCurrency, setNewCurrency] = useState('NGN')
  const [newBranch, setNewBranch] = useState('')
  const [newBankBalance, setNewBankBalance] = useState(0)
  const [newBalanceDate, setNewBalanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [roles, setRoles] = useState<RoleDefinition[]>(state.roles || getDefaultRoles())
  const [roleName, setRoleName] = useState('Sales Supervisor')
  const [roleTemplate, setRoleTemplate] = useState('Custom')
  const [rolePermissions, setRolePermissions] = useState<PermissionKey[]>(['dashboard', 'sales'])
  const [previewRoleId, setPreviewRoleId] = useState<string>('cashier')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importRows, setImportRows] = useState<Record<string, unknown>[]>([])
  const [importFileName, setImportFileName] = useState('')
  const [importError, setImportError] = useState('')
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinStatus, setPinStatus] = useState<{ tone: 'error' | 'success'; message: string } | null>(null)

  const selectedRole = useMemo(() => roles.find((role) => role.id === previewRoleId) || roles[0], [previewRoleId, roles])
  const isSuperAdmin = user?.role === 'super-admin'

  const handleSaveOpeningCapital = () => {
    updateState({ openingCapital: parseFloat(openingCapital as any) || 0 })
    alert('Opening capital saved!')
  }

  const handleAddBank = () => {
    const bankName = newBankName.trim()
    const accountName = newAccountName.trim()
    if (!accountName) {
      alert('Please enter an account name.')
      return
    }
    if (Object.prototype.hasOwnProperty.call(state.banks, accountName)) {
      alert('This account name already exists.')
      return
    }

    const account = {
      id: `BANK-${Date.now()}`,
      bankName,
      accountName,
      accountNumber: newAccountNumber.trim(),
      accountType: newAccountType,
      currency: newCurrency.trim().toUpperCase() || 'NGN',
      branch: newBranch.trim(),
      openingBalance: newBankBalance,
      openingBalanceDate: newBalanceDate,
      status: 'Active' as const,
    }
    updateState({ banks: { ...state.banks, [accountName]: newBankBalance }, bankAccounts: [...state.bankAccounts, account] })
    addAuditLog('CREATE', 'BANK', account.id, `Added ${bankName} account ${accountName} with ${formatCurrency(newBankBalance)}`)
    setNewAccountName('')
    setNewAccountNumber('')
    setNewBranch('')
    setNewBankBalance(0)
  }

  const openImportModal = () => {
    setShowImportModal(true)
    setImportRows([])
    setImportFileName('')
    setImportError('')
    setImportProgress(0)
    setImportStatus('idle')
    setImportSummary(null)
  }

  const closeImportModal = () => {
    setShowImportModal(false)
    setImportError('')
    setImportProgress(0)
    setImportStatus('idle')
    setImportSummary(null)
  }

  const handleSettingsFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setImportError('')
    setImportProgress(0)
    setImportStatus('idle')
    setImportSummary(null)

    if (!file.name.match(/\.(csv|xls|xlsx)$/i)) {
      setImportError('Please upload a CSV or Excel file (.csv, .xls, .xlsx).')
      setImportRows([])
      setImportFileName('')
      return
    }

    try {
      const rows = await parseSpreadsheetFile(file)
      if (rows.length === 0) {
        setImportError('No rows were found in the selected file.')
        setImportRows([])
        setImportFileName(file.name)
        return
      }
      setImportRows(rows)
      setImportFileName(file.name)
      setImportError('')
    } catch (error) {
      setImportError('Unable to parse the spreadsheet. Please verify the file format and try again.')
      setImportRows([])
      setImportFileName(file.name)
    }
  }

  const postJsonWithProgress = (url: string, body: unknown, onProgress: (percentage: number) => void) => {
    return new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.setRequestHeader('Content-Type', 'application/json')

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 80))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText))
          } catch (error) {
            reject(new Error('Invalid server response'))
          }
        } else {
          reject(new Error(xhr.responseText || `Upload failed with status ${xhr.status}`))
        }
      }

      xhr.onerror = () => {
        reject(new Error('Network error during upload.'))
      }

      xhr.send(JSON.stringify(body))
    })
  }

  const handleImportUpload = async () => {
    if (importRows.length === 0) {
      setImportError('Please select a spreadsheet to import.')
      return
    }

    setImportError('')
    setImportStatus('uploading')
    setIsImporting(true)
    setImportProgress(8)

    try {
      const { payload, summary } = prepareGenericImportPayload(importRows)
      setImportSummary(summary)

      const result = await postJsonWithProgress('/api/import', { ...payload, companyId: user?.companyId, staffId: user?.staffId }, (percent) => {
        setImportProgress(percent)
      })

      if (!result?.success) {
        throw new Error(result?.error || 'Import failed')
      }

      setImportProgress(100)
      setImportStatus('success')
      setTimeout(() => setImportProgress(100), 200)

      const nextCustomerList = Array.from(
        new Set([
          ...state.customerList,
          ...(payload.contacts || []).filter((item: any) => item.type === 'customer').map((item: any) => String(item.name || '')),
        ])
      ).filter(Boolean)
      const nextSupplierList = Array.from(
        new Set([
          ...state.supplierList,
          ...(payload.contacts || []).filter((item: any) => item.type === 'supplier').map((item: any) => String(item.name || '')),
        ])
      ).filter(Boolean)

      const nextInventory = [
        ...state.inventory,
        ...(payload.products || []).map((product: any) => ({
          product: String(product.name || product.sku || 'Imported Item'),
          dept: String(product.category || product.dept || 'General'),
          openQty: Number(product.stock_qty || product.openQty || product.closing || 0),
          purchased: Number(product.purchased || 0),
          sold: Number(product.sold || 0),
          unitCost: Number(product.unit_cost || product.unitCost || 0),
          closing: Number(product.stock_qty || product.closing || 0),
        })),
      ]

      const nextStaff = [...state.staffMembers, ...(payload.staff || []).map((staff: any) => ({
        id: staff.id || '',
        name: String(staff.name || staff.fullName || staff.full_name || 'Imported Staff'),
        staffId: String(staff.staffId || staff.employeeId || staff.employee_id || ''),
        pin: String(staff.pin || ''),
        roleId: String(staff.roleId || staff.role_id || staff.role || 'staff'),
        roleName: String(staff.roleName || staff.role_name || staff.role || 'Staff'),
        permissions: staff.permissions || ['dashboard'],
        dataScope: staff.dataScope || 'team',
        status: staff.status || 'active',
        createdAt: String(staff.createdAt || staff.created_at || new Date().toISOString()),
        username: String(staff.username || ''),
        branch: String(staff.branch || ''),
        department: String(staff.department || ''),
        position: String(staff.position || ''),
        phone: String(staff.phone || ''),
        email: String(staff.email || ''),
      }))]

      updateState({
        sales: [...state.sales, ...((payload.sales || []) as any[])],
        purchases: [...state.purchases, ...((payload.purchases || []) as any[])],
        inventory: nextInventory,
        supplierList: nextSupplierList,
        customerList: nextCustomerList,
        staffMembers: nextStaff,
      })

      addAuditLog(
        'IMPORT',
        'SETTINGS',
        'GENERIC_IMPORT',
        `Imported ${importFileName} with ${summary.sales} sales, ${summary.purchases} purchases, ${summary.products} inventory, ${summary.staff} staff, ${summary.contacts} contacts.`
      )
    } catch (error) {
      setImportStatus('error')
      setImportError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportAction = () => {
    if (importStatus === 'success') {
      closeImportModal()
      return
    }

    void handleImportUpload()
  }

  const handleCreateRole = () => {
    const nextRole: RoleDefinition = {
      id: roleName.toLowerCase().replace(/\s+/g, '-'),
      name: roleName,
      description: `${roleName} role`,
      permissions: rolePermissions,
      dataScope: 'team',
      template: roleTemplate,
    }
    const nextRoles = [...roles, nextRole]
    setRoles(nextRoles)
    updateState({ roles: nextRoles })
    saveRoles(nextRoles)
    alert(`Role ${roleName} created.`)
  }

  const togglePermission = (permission: PermissionKey) => {
    setRolePermissions((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]
    )
  }

  const handlePinChange = async () => {
    setPinStatus(null)
    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      setPinStatus({ tone: 'error', message: 'PINs must be exactly four digits.' })
      return
    }
    if (newPin !== confirmPin) {
      setPinStatus({ tone: 'error', message: 'New PIN and confirmation do not match.' })
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: user?.companyId, staffId: user?.staffId, username: user?.username, currentPin, newPin }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to update PIN.')

      const storage = localStorage.getItem('hw_auth_user') ? localStorage : sessionStorage
      storage.setItem('hw_auth_user', JSON.stringify({ ...user, pin: newPin }))
      const nextStaff = state.staffMembers.map((member) => member.staffId === user?.staffId ? { ...member, pin: newPin } : member)
      updateState({ staffMembers: nextStaff })
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      setPinStatus({ tone: 'success', message: 'PIN updated. Staff Management now shows the new PIN.' })
      addAuditLog('UPDATE', 'USER', user?.staffId || user?.username || 'CURRENT_USER', 'Personal PIN updated.')
    } catch (error) {
      setPinStatus({ tone: 'error', message: error instanceof Error ? error.message : 'Unable to update PIN.' })
    }
  }

  return (
    <AppLayout>
      <div className="page-shell">
        <div className="page-hero">
          <div>
            <div className="eyebrow">System Control Center</div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Fine-tune your company profile, operational defaults, security posture, and automation in one place.</p>
          </div>
          <button className="action-btn primary" type="button" onClick={openImportModal}>Import data</button>
        </div>

        <div className="ai-insight">
          <div>
            <span className="ai-badge">AURA AI Insight</span>
            <h3>Your fiscal year closes in 14 days. Review tax, reporting, and approval settings ahead of the closing window.</h3>
          </div>
          <div className="ai-pill">Planning Alert</div>
        </div>

        <div className="settings-layout">
          <aside className="settings-sidebar">
            {sidebarSections.map((section) => (
              <button
                key={section.id}
                className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="sidebar-title">{section.label}</span>
                <span className="sidebar-subtitle">{section.description}</span>
              </button>
            ))}
          </aside>

          <div className="settings-content">
            {activeSection === 'company' && (
              <div className="panel-card">
                <div className="panel-title">Company profile</div>
                <div className="form-grid two-up">
                  <div className="fg"><label>Business name</label><input value="QUANTIXA" readOnly /></div>
                  <div className="fg"><label>RC Number</label><input value="RC 123456" readOnly /></div>
                  <div className="fg"><label>TIN</label><input value="NG-001234567" readOnly /></div>
                  <div className="fg"><label>Country</label><input value="Nigeria" readOnly /></div>
                  <div className="fg"><label>Currency</label><input value="₦" readOnly /></div>
                  <div className="fg"><label>Timezone</label><input value="WAT" readOnly /></div>
                </div>
              </div>
            )}

            {activeSection === 'business' && (
              <div className="panel-card">
                <div className="panel-title">Business preferences</div>
                <div className="form-grid two-up">
                  <div className="fg"><label>Decimal Places</label><input value="2" readOnly /></div>
                  <div className="fg"><label>Date Format</label><input value="DD/MM/YYYY" readOnly /></div>
                  <div className="fg"><label>Tax Inclusive</label><input value="Enabled" readOnly /></div>
                  <div className="fg"><label>Default Branch</label><input value="Lagos HQ" readOnly /></div>
                </div>
                <div className="form-stack">
                  <div className="fg">
                    <label>Opening balance / capital</label>
                    <div className="inline-actions">
                      <input type="number" value={openingCapital} onChange={(e) => setOpeningCapital(parseFloat(e.target.value) || 0)} />
                      <button className="action-btn primary" onClick={handleSaveOpeningCapital}>Save</button>
                    </div>
                    <div className="metric-note">Current: {formatCurrency(state.openingCapital)}</div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'bank-management' && isSuperAdmin && (
              <div className="settings-security-stack">
                <div className="panel-card">
                  <div className="panel-title"><Landmark size={19} style={{ verticalAlign: 'middle', marginRight: 8 }} />Bank & cash management</div>
                  <div className="panel-subtitle">Create an account once. It becomes available across Bank Balances, payments, expenses, receivables, payables, and the ledger.</div>
                  <div className="form-grid two-up" style={{ marginTop: 18 }}>
                  <div className="fg"><label>Bank</label><select value={newBankName} onChange={(event) => setNewBankName(event.target.value)}>{bankMasterList.map((bank) => <option key={bank}>{bank}</option>)}</select></div>
                  <div className="fg"><label>Account name</label><input type="text" value={newAccountName} onChange={(event) => setNewAccountName(event.target.value)} placeholder="Main Business Account" /></div>
                  <div className="fg"><label>Account number</label><input type="text" inputMode="numeric" value={newAccountNumber} onChange={(event) => setNewAccountNumber(event.target.value)} placeholder="0123456789" /></div>
                  <div className="fg"><label>Account type</label><select value={newAccountType} onChange={(event) => setNewAccountType(event.target.value as typeof newAccountType)}><option>Current</option><option>Savings</option><option>Cash</option><option>Wallet</option><option>Other</option></select></div>
                  <div className="fg"><label>Currency</label><input type="text" maxLength={3} value={newCurrency} onChange={(event) => setNewCurrency(event.target.value)} /></div>
                  <div className="fg"><label>Branch <span className="metric-note">(optional)</span></label><input type="text" value={newBranch} onChange={(event) => setNewBranch(event.target.value)} placeholder="Lagos HQ" /></div>
                  <div className="fg"><label>Opening balance</label><input type="number" min={0} value={newBankBalance} onChange={(event) => setNewBankBalance(Number(event.target.value))} /></div>
                  <div className="fg"><label>Opening balance date</label><input type="date" value={newBalanceDate} onChange={(event) => setNewBalanceDate(event.target.value)} /></div>
                  </div>
                  <button className="action-btn primary" type="button" onClick={handleAddBank}><Plus size={16} /> Add bank account</button>
                </div>
                <div className="panel-card">
                  <div className="panel-title"><WalletCards size={19} style={{ verticalAlign: 'middle', marginRight: 8 }} />Configured accounts</div>
                  <div className="panel-subtitle">Balances remain transaction-driven after setup. Use Bank Balances for movements and reconciliation.</div>
                  <div className="toggle-list" style={{ marginTop: 20 }}>
                    {state.bankAccounts.map((account) => (
                      <div className="toggle-row" key={account.id}>
                        <span><strong>{account.accountName}</strong><small style={{ display: 'block', color: 'var(--text3)' }}>{account.bankName} · {account.accountType}{account.accountNumber ? ` · ••••${account.accountNumber.slice(-4)}` : ''}</small></span>
                        <span><strong>{formatCurrency(state.banks[account.accountName] ?? account.openingBalance)}</strong><small style={{ display: 'block', textAlign: 'right', color: 'var(--green-text)' }}>{account.status}</small></span>
                      </div>
                    ))}
                    {state.bankAccounts.length === 0 && Object.entries(state.banks).map(([bank, balance]) => (
                      <div className="toggle-row" key={bank}><span>{bank}</span><span className="status-pill active">{formatCurrency(balance)}</span></div>
                    ))}
                    {state.bankAccounts.length === 0 && Object.keys(state.banks).length === 0 && <div className="metric-note">No bank accounts configured.</div>}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="panel-card">
                <div className="panel-title">Notification settings</div>
                <div className="toggle-list">
                  <div className="toggle-row"><span>Email</span><span className="status-pill active">Enabled</span></div>
                  <div className="toggle-row"><span>SMS</span><span className="status-pill">Off</span></div>
                  <div className="toggle-row"><span>Push notifications</span><span className="status-pill active">Enabled</span></div>
                  <div className="toggle-row"><span>WhatsApp</span><span className="status-pill active">Enabled</span></div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="settings-security-stack">
                <div className="panel-card">
                  <div className="panel-title">Change personal PIN</div>
                  <div className="panel-subtitle">Update the four-digit PIN used to sign in. This change is written to your staff account.</div>
                  <div className="form-grid two-up pin-form">
                    <div className="fg"><label>Current PIN</label><input inputMode="numeric" maxLength={4} pattern="[0-9]*" type="password" value={currentPin} onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, '').slice(0, 4))} /></div>
                    <div className="fg"><label>New PIN</label><input inputMode="numeric" maxLength={4} pattern="[0-9]*" type="password" value={newPin} onChange={(event) => setNewPin(event.target.value.replace(/\D/g, '').slice(0, 4))} /></div>
                    <div className="fg"><label>Confirm new PIN</label><input inputMode="numeric" maxLength={4} pattern="[0-9]*" type="password" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4))} /></div>
                  </div>
                  {pinStatus && <div className={`staff-inline-notice ${pinStatus.tone}`}>{pinStatus.message}</div>}
                  <button className="action-btn primary" type="button" onClick={() => void handlePinChange()}>Update PIN</button>
                </div>
                <div className="panel-card">
                  <div className="panel-title">Security controls</div>
                  <div className="toggle-list">
                    <div className="toggle-row"><span>Two-factor authentication</span><span className="status-pill active">Enabled</span></div>
                    <div className="toggle-row"><span>Session timeout</span><span className="status-pill">20 mins</span></div>
                    <div className="toggle-row"><span>Audit logs</span><span className="status-pill active">Active</span></div>
                    <div className="toggle-row"><span>IP restrictions</span><span className="status-pill">Configurable</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'integrations' && (
              <div className="panel-card">
                <div className="panel-title">Integrations</div>
                <div className="option-grid compact">
                  <div className="option-card">Paystack</div>
                  <div className="option-card">Moniepoint</div>
                  <div className="option-card">Flutterwave</div>
                  <div className="option-card">Google Drive</div>
                </div>
              </div>
            )}

            {activeSection === 'ai' && (
              <div className="panel-card">
                <div className="panel-title">AI assistant settings</div>
                <div className="toggle-list">
                  <div className="toggle-row"><span>Enable AI</span><span className="status-pill active">On</span></div>
                  <div className="toggle-row"><span>Voice assistant</span><span className="status-pill active">On</span></div>
                  <div className="toggle-row"><span>Auto insights</span><span className="status-pill active">Enabled</span></div>
                  <div className="toggle-row"><span>Business memory</span><span className="status-pill">Limited</span></div>
                </div>
              </div>
            )}
          </div>

          {showImportModal && (
            <div className="import-modal-overlay">
              <div className="import-modal-card">
                <div className="modal-header">
                  <div>
                    <div className="card-title">Import data</div>
                    <div className="section-subtitle">Upload a spreadsheet and the system will route rows to sales, purchases, inventory, staff, or contact records automatically.</div>
                  </div>
                </div>

                <div className="import-modal-body">
                  <label className="file-upload-label">
                    Select spreadsheet file
                    <input type="file" accept=".csv,.xls,.xlsx" onChange={handleSettingsFileChange} />
                  </label>

                  {importFileName && <div className="import-file-name">Selected file: {importFileName}</div>}
                  {importError && <div className="import-error">{importError}</div>}

                  <div className="import-preview-info">
                    <div>Rows loaded: {importRows.length}</div>
                    <div>Status: {importStatus === 'success' ? 'Completed' : importStatus === 'uploading' ? 'Uploading' : importStatus === 'error' ? 'Failed' : 'Ready'}</div>
                  </div>

                  <div className="progress-bar import-progress-bar">
                    <div className="progress-fill import-progress-fill" style={{ width: `${importProgress}%` }} />
                  </div>
                  <div className="progress-label">{importProgress}%</div>

                  {importStatus === 'success' && importSummary && (
                    <div className="import-success-card">
                      <div className="check-circle">✓</div>
                      <div>
                        <div className="success-title">Import completed</div>
                        <div className="success-detail">Sales {importSummary.sales}, Purchases {importSummary.purchases}, Inventory {importSummary.products}, Staff {importSummary.staff}, Contacts {importSummary.contacts}.</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="btn-group">
                  <button className="btn btn-secondary" type="button" onClick={closeImportModal}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handleImportAction}
                    disabled={importStatus === 'success' ? false : importRows.length === 0 || isImporting}
                  >
                    {importStatus === 'uploading' ? 'Uploading…' : importStatus === 'success' ? 'Done' : 'Start import'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
