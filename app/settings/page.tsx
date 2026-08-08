'use client'

import { useMemo, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { formatCurrency } from '@/lib/utils'
import { getDefaultRoles, saveRoles, type RoleDefinition, type PermissionKey } from '@/lib/rbac'

const sidebarSections = [
  { id: 'company', label: 'Company', description: 'Profile, branding, and legal details' },
  { id: 'business', label: 'Business', description: 'Defaults, dates, and workflow' },
  { id: 'notifications', label: 'Notifications', description: 'Email, SMS, and push' },
  { id: 'security', label: 'Security', description: 'Auth, sessions, and policies' },
  { id: 'integrations', label: 'Integrations', description: 'Payments, storage, and APIs' },
  { id: 'ai', label: 'AI Assistant', description: 'Automation and insights' },
]

export default function SettingsPage() {
  const { state, updateState } = useAccounting()
  const [openingCapital, setOpeningCapital] = useState(state.openingCapital)
  const [activeSection, setActiveSection] = useState('company')
  const [roles, setRoles] = useState<RoleDefinition[]>(state.roles || getDefaultRoles())
  const [roleName, setRoleName] = useState('Sales Supervisor')
  const [roleTemplate, setRoleTemplate] = useState('Custom')
  const [rolePermissions, setRolePermissions] = useState<PermissionKey[]>(['dashboard', 'sales'])
  const [previewRoleId, setPreviewRoleId] = useState<string>('cashier')

  const selectedRole = useMemo(() => roles.find((role) => role.id === previewRoleId) || roles[0], [previewRoleId, roles])

  const handleSaveOpeningCapital = () => {
    updateState({ openingCapital: parseFloat(openingCapital as any) || 0 })
    alert('Opening capital saved!')
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

  return (
    <AppLayout>
      <div className="page-shell">
        <div className="page-hero">
          <div>
            <div className="eyebrow">System Control Center</div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Fine-tune your company profile, operational defaults, security posture, and automation in one place.</p>
          </div>
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
              <div className="panel-card">
                <div className="panel-title">Security controls</div>
                <div className="toggle-list">
                  <div className="toggle-row"><span>Two-factor authentication</span><span className="status-pill active">Enabled</span></div>
                  <div className="toggle-row"><span>Session timeout</span><span className="status-pill">20 mins</span></div>
                  <div className="toggle-row"><span>Audit logs</span><span className="status-pill active">Active</span></div>
                  <div className="toggle-row"><span>IP restrictions</span><span className="status-pill">Configurable</span></div>
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
        </div>
      </div>
    </AppLayout>
  )
}
