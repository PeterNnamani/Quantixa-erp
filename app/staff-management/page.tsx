'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, Pencil, Lock, Unlock, Trash2, Search, Users } from 'lucide-react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { generatePin, generateStaffId, saveRoles, type PermissionKey, type RoleDefinition, type StaffMemberRecord } from '@/lib/rbac'
import { saveUserToDatabase } from '@/lib/user-db'

const branchOptions = ['Enugu', 'Onitsha', 'Lagos', 'Abuja']
const genderOptions = ['Female', 'Male', 'Other']
const departmentOptions = ['Sales', 'Inventory', 'Accounting', 'HR', 'Operations']
const positionOptions = ['Sales Manager', 'Cashier', 'Store Officer', 'Accountant', 'HR Officer']
const permissionOptions: { key: PermissionKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'sales', label: 'Sales' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'customers', label: 'Customer Management' },
  { key: 'suppliers', label: 'Supplier Management' },
  { key: 'accounting', label: 'Accounting & Ledger' },
  { key: 'reports', label: 'Reports & Analytics' },
  { key: 'admin', label: 'Admin Tools' },
  { key: 'settings', label: 'Settings & Security' },
]

export default function StaffManagementPage() {
  const { state, updateState, user } = useAccounting()
  const [staffMembers, setStaffMembers] = useState<StaffMemberRecord[]>(state.staffMembers)
  const [roles, setRoles] = useState<RoleDefinition[]>(state.roles)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState(genderOptions[0])
  const [passportPhoto, setPassportPhoto] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [department, setDepartment] = useState(departmentOptions[0])
  const [position, setPosition] = useState(positionOptions[0])
  const [employmentDate, setEmploymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [salary, setSalary] = useState('')
  const [branch, setBranch] = useState(branchOptions[0])
  const [username, setUsername] = useState('')
  const [roleId, setRoleId] = useState(state.roles[0]?.id || 'cashier')
  const [status, setStatus] = useState<StaffMemberRecord['status']>('active')

  const [roleName, setRoleName] = useState('New Role')
  const [roleDescription, setRoleDescription] = useState('Custom role for staff access')
  const [roleTemplate, setRoleTemplate] = useState('Custom')
  const [rolePermissions, setRolePermissions] = useState<PermissionKey[]>(['dashboard'])
  const [roleDataScope, setRoleDataScope] = useState<RoleDefinition['dataScope']>('team')
  const [selectedRoleId, setSelectedRoleId] = useState<string>(state.roles[0]?.id || 'cashier')
  const [drawerMode, setDrawerMode] = useState<'add' | 'view' | 'edit'>('add')
  const [activeStaff, setActiveStaff] = useState<StaffMemberRecord | null>(null)
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({})

  const selectedRole = useMemo(() => roles.find((role) => role.id === selectedRoleId) || roles[0], [roles, selectedRoleId])

  const filteredStaff = useMemo(
    () => staffMembers.filter((member) => {
      const query = search.trim().toLowerCase()
      if (!query) return true
      return [member.name, member.roleName, member.branch, member.status, member.staffId]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query))
    }),
    [search, staffMembers]
  )

  const toggleRolePermission = (permission: PermissionKey) => {
    setRolePermissions((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]
    )
  }

  const handleCreateRole = () => {
    const id = roleName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (!id) {
      alert('Enter a valid role name.')
      return
    }

    if (roles.some((role) => role.id === id)) {
      alert('A role with that name already exists.')
      return
    }

    const newRole: RoleDefinition = {
      id,
      name: roleName,
      description: roleDescription,
      permissions: rolePermissions,
      visibleMenus: rolePermissions,
      dataScope: roleDataScope,
      template: roleTemplate,
    }

    const nextRoles = [...roles, newRole]
    setRoles(nextRoles)
    updateState({ roles: nextRoles })
    saveRoles(nextRoles)
    setSelectedRoleId(newRole.id)
    setRoleName('New Role')
    setRoleDescription('Custom role for staff access')
    setRoleTemplate('Custom')
    setRolePermissions(['dashboard'])
    setRoleDataScope('team')
    alert(`Created role ${newRole.name}`)
  }

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setPhone('')
    setEmail('')
    setDateOfBirth('')
    setGender(genderOptions[0])
    setPassportPhoto('')
    setEmployeeId('')
    setDepartment(departmentOptions[0])
    setPosition(positionOptions[0])
    setEmploymentDate(new Date().toISOString().slice(0, 10))
    setSalary('')
    setBranch(branchOptions[0])
    setUsername('')
    setRoleId(state.roles[0]?.id || 'cashier')
    setStatus('active')
    setActiveStaff(null)
    setDrawerMode('add')
  }

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus()
    }
  }, [searchOpen])

  const handleSearchDismiss = (event: React.FocusEvent<HTMLFormElement>) => {
    const nextTarget = event.relatedTarget as HTMLElement | null
    if (!event.currentTarget.contains(nextTarget) && !search) {
      setSearchOpen(false)
    }
  }

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    searchInputRef.current?.blur()
  }

  const loadStaffToForm = (staff: StaffMemberRecord, mode: 'view' | 'edit') => {
    setActiveStaff(staff)
    setDrawerMode(mode)
    setFirstName(staff.name.split(' ')[0] ?? '')
    setLastName(staff.name.split(' ').slice(1).join(' ') ?? '')
    setPhone(staff.phone || '')
    setEmail(staff.email || '')
    setDateOfBirth(staff.dateOfBirth || '')
    setGender(staff.gender || genderOptions[0])
    setPassportPhoto(staff.passportPhoto || '')
    setEmployeeId(staff.employeeId || '')
    setDepartment(staff.department || departmentOptions[0])
    setPosition(staff.position || positionOptions[0])
    setEmploymentDate(staff.employmentDate || new Date().toISOString().slice(0, 10))
    setSalary(staff.salary || '')
    setBranch(staff.branch || branchOptions[0])
    setUsername(staff.username || '')
    setRoleId(staff.roleId)
    setStatus(staff.status)
    setDrawerOpen(true)
  }

  const saveStaff = async () => {
    const fullName = `${firstName} ${lastName}`.trim()
    if (!fullName) {
      alert('Enter a valid first and last name for the staff member.')
      return
    }

    const selectedRoleDefinition = roles.find((role) => role.id === roleId)
    const generatedPin = (drawerMode === 'edit' && activeStaff?.pin) ? activeStaff.pin : generatePin()
    const generatedStaffId = employeeId || (drawerMode === 'edit' && activeStaff?.staffId ? activeStaff.staffId : generateStaffId(fullName))

    if (drawerMode === 'edit' && activeStaff) {
      const updatedStaff: StaffMemberRecord = {
        ...activeStaff,
        name: fullName,
        staffId: activeStaff.staffId || generatedStaffId,
        pin: activeStaff.pin || generatedPin,
        roleId,
        roleName: selectedRoleDefinition?.name || 'Custom Role',
        permissions: selectedRoleDefinition?.permissions || [],
        visibleMenus: selectedRoleDefinition?.visibleMenus,
        dataScope: selectedRoleDefinition?.dataScope || 'team',
        status,
        branch,
        department,
        position,
        phone,
        email,
        dateOfBirth,
        gender,
        passportPhoto,
        employeeId,
        username: username || generatedStaffId,
        salary,
        employmentDate,
      }

      const nextStaff = staffMembers.map((member) => (member.id === activeStaff.id ? updatedStaff : member))
      setStaffMembers(nextStaff)
      updateState({ staffMembers: nextStaff })

      const saveResult = await saveUserToDatabase({
        staffId: activeStaff.staffId || generatedStaffId,
        username: username || generatedStaffId,
        pin: generatedPin,
        fullName,
        roleId,
        email,
        phone,
        branch,
        department,
        position,
        employeeId,
        salary,
        employmentDate,
        status,
      })

      setDrawerOpen(false)
      resetForm()
      if (saveResult.success) {
        alert(`Staff member ${updatedStaff.name} updated.`)
      } else {
        alert(`Staff member ${updatedStaff.name} updated locally, but could not be saved to the users table: ${saveResult.error}`)
      }
      return
    }

    const newStaff: StaffMemberRecord = {
      id: `${generatedStaffId}-${Date.now()}`,
      name: fullName,
      staffId: generatedStaffId,
      pin: generatedPin,
      roleId,
      roleName: selectedRoleDefinition?.name || 'Custom Role',
      permissions: selectedRoleDefinition?.permissions || [],
      visibleMenus: selectedRoleDefinition?.visibleMenus,
      dataScope: selectedRoleDefinition?.dataScope || 'team',
      status,
      createdAt: new Date().toISOString(),
      branch,
      department,
      position,
      phone,
      email,
      dateOfBirth,
      gender,
      passportPhoto,
      employeeId,
      username: username || generatedStaffId,
      salary,
      employmentDate,
      lastLogin: 'Never',
    }

    const nextStaff = [newStaff, ...staffMembers]
    setStaffMembers(nextStaff)
    updateState({ staffMembers: nextStaff })

    const saveResult = await saveUserToDatabase({
      staffId: generatedStaffId,
      username: username || generatedStaffId,
      pin: generatedPin,
      fullName,
      roleId,
      email,
      phone,
      branch,
      department,
      position,
      employeeId,
      salary,
      employmentDate,
      status,
    })

    setDrawerOpen(false)
    resetForm()
    if (saveResult.success) {
      alert(`Staff member ${fullName} created with Staff ID ${generatedStaffId} and PIN ${generatedPin}`)
    } else {
      alert(`Staff member ${fullName} created locally, but could not be saved to the users table: ${saveResult.error}`)
    }
  }

  const toggleStatus = (id: string) => {
    const nextStaff = staffMembers.map((member) =>
      member.id === id ? { ...member, status: member.status === 'active' ? 'disabled' : 'active' } : member
    )
    setStaffMembers(nextStaff)
    updateState({ staffMembers: nextStaff })
  }

  const removeStaff = (staffId: string) => {
    const nextStaff = staffMembers.filter((member) => member.id !== staffId)
    setStaffMembers(nextStaff)
    updateState({ staffMembers: nextStaff })
  }

  const togglePinVisibility = (staffId: string) => {
    setRevealedPins((current) => ({ ...current, [staffId]: !current[staffId] }))
  }

  return (
    <AppLayout>
      <div className="page-shell">
        <div className="page-hero">
          <div>
            <div className="eyebrow">Human Resources</div>
            <h1 className="page-title">Staff Management</h1>
            <p className="page-subtitle">Manage people, branches, roles, and access from a single polished workspace.</p>
          </div>
          <div className="page-actions">
            <button className="action-btn primary" onClick={() => setDrawerOpen(true)}>Add Staff</button>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-head">
            <div>
              <div className="panel-title"><Users size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Staff Management</div>
              <div className="page-subtitle">Search, review active staff, and manage account status across your business.</div>
            </div>
            {searchOpen ? (
              <form
                className="search-field"
                style={{ maxWidth: 360 }}
                onSubmit={handleSearchSubmit}
                onBlur={handleSearchDismiss}
                role="search"
                aria-label="Search staff"
              >
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search staff by name, role, or branch..."
                  aria-label="Search staff"
                />
                <button type="submit" className="search-toggle" aria-label="Search staff">
                  <Search size={18} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="staff-search-toggle"
                onClick={() => setSearchOpen(true)}
                aria-label="Open staff search"
              >
                <Search size={18} />
              </button>
            )}
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Staff ID</th>
                  <th>PIN</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>
                      No staff match your search.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{member.name}</div>
                        <div className="metric-note">{member.email || `ID: ${member.staffId}`}</div>
                      </td>
                      <td>{member.staffId || '—'}</td>
                      <td>
                        <div className="inline-actions" style={{ justifyContent: 'flex-start', gap: 8 }}>
                          <span>{revealedPins[member.id] ? member.pin : '••••'}</span>
                          <button
                            className="action-btn"
                            type="button"
                            title={revealedPins[member.id] ? 'Hide PIN' : 'Show PIN'}
                            onClick={() => togglePinVisibility(member.id)}
                          >
                            {revealedPins[member.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </td>
                      <td>{member.roleName}</td>
                      <td>{member.branch || '—'}</td>
                      <td>
                        <span className={`badge ${member.status === 'active' ? 'b-green' : 'b-red'}`}>
                          {member.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td>{member.lastLogin || 'Never'}</td>
                      <td>
                        <div className="inline-actions" style={{ justifyContent: 'flex-start' }}>
                          <button className="action-btn" type="button" title="View staff details" onClick={() => loadStaffToForm(member, 'view')}>
                            <Eye size={18} />
                          </button>
                          <button className="action-btn" type="button" title="Edit staff account" onClick={() => loadStaffToForm(member, 'edit')}>
                            <Pencil size={18} />
                          </button>
                          <button
                            className="action-btn"
                            type="button"
                            title={member.status === 'active' ? 'Suspend staff' : 'Activate staff'}
                            onClick={() => toggleStatus(member.id)}
                          >
                            {member.status === 'active' ? <Lock size={18} /> : <Unlock size={18} />}
                          </button>
                          {user?.role === 'super-admin' && (
                            <button className="action-btn" type="button" title="Remove staff" onClick={() => removeStaff(member.id)}>
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="txn-pagination" style={{ justifyContent: 'space-between', marginTop: 16 }}>
            <div className="page-info">Showing {filteredStaff.length} staff member{filteredStaff.length === 1 ? '' : 's'}</div>
            <div className="page-controls">
              <button className="action-btn" type="button">←</button>
              <button className="action-btn" type="button">→</button>
            </div>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: '460px',
            background: 'var(--bg)',
            borderLeft: '1px solid var(--border)',
            boxShadow: '-12px 0 38px rgba(15, 23, 42, 0.14)',
            padding: 24,
            zIndex: 80,
            overflowY: 'auto',
          }}
        >
          <div className="panel-head" style={{ marginBottom: 20 }}>
            <div>
              <div className="panel-title">
                {drawerMode === 'view' ? 'View staff details' : drawerMode === 'edit' ? 'Edit staff' : 'Add New Staff'}
              </div>
              <div className="page-subtitle">
                {drawerMode === 'view'
                  ? 'Review the staff profile and assigned access.'
                  : drawerMode === 'edit'
                    ? 'Update role assignments and personal details.'
                    : 'Collect personal, employment, and access details in one flow.'}
              </div>
            </div>
            <button className="action-btn" type="button" onClick={() => {
              setDrawerOpen(false)
              resetForm()
            }}>
              Close
            </button>
          </div>

          <div className="panel-card">
            <div className="panel-title">Personal Information</div>
            <div className="form-grid two-up">
              <div className="fg"><label>First Name</label><input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
              <div className="fg"><label>Last Name</label><input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
              <div className="fg"><label>Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="fg"><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="fg"><label>Date of Birth</label><input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></div>
              <div className="fg"><label>Gender</label><select value={gender} onChange={(e) => setGender(e.target.value)}>{genderOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              <div className="fg"><label>Passport Photo</label><input value={passportPhoto} onChange={(e) => setPassportPhoto(e.target.value)} placeholder="Image URL" /></div>
            </div>
          </div>

          <div className="panel-card" style={{ marginTop: 18 }}>
            <div className="panel-title">Employment</div>
            <div className="form-grid two-up">
              <div className="fg"><label>Employee ID</label><input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Auto-generated if blank" /></div>
              <div className="fg"><label>Department</label><select value={department} onChange={(e) => setDepartment(e.target.value)}>{departmentOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              <div className="fg"><label>Position</label><select value={position} onChange={(e) => setPosition(e.target.value)}>{positionOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              <div className="fg"><label>Employment Date</label><input type="date" value={employmentDate} onChange={(e) => setEmploymentDate(e.target.value)} /></div>
              <div className="fg"><label>Salary</label><input value={salary} onChange={(e) => setSalary(e.target.value)} /></div>
              <div className="fg"><label>Branch</label><select value={branch} onChange={(e) => setBranch(e.target.value)}>{branchOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            </div>
          </div>

          <div className="panel-card" style={{ marginTop: 18 }}>
            <div className="panel-title">Role Assignment</div>
            <div className="form-grid two-up">
              <div className="fg">
                <label>Role</label>
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
                <div className="metric-note" style={{ marginTop: 6 }}>Choose one role. Permissions will follow it automatically.</div>
              </div>
              <div className="fg"><label>Status</label><select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'disabled')}><option value="active">Active</option><option value="disabled">Inactive</option></select></div>
            </div>
          </div>

          <div className="panel-card" style={{ marginTop: 18 }}>
            <div className="panel-title">Login Credentials</div>
            <div className="form-grid two-up">
              <div className="fg"><label>Login ID</label><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Auto-generated if blank" /></div>
              <div className="fg">
                <label>Auto-generated PIN</label>
                <input value={drawerMode === 'edit' && activeStaff?.pin ? activeStaff.pin : 'Generated on save'} readOnly />
                <div className="metric-note" style={{ marginTop: 6 }}>The system creates a 4-digit PIN automatically for sign-in.</div>
              </div>
            </div>
          </div>

          <div className="inline-actions" style={{ marginTop: 24, justifyContent: 'space-between' }}>
            <button className="action-btn" type="button" onClick={() => {
              setDrawerOpen(false)
              resetForm()
            }}>
              Cancel
            </button>
            <button className="action-btn primary" type="button" onClick={saveStaff}>
              {drawerMode === 'edit' ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
