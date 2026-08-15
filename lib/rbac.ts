export type PermissionKey =
    | 'dashboard'
    | 'sales'
    | 'inventory'
    | 'purchases'
    | 'customers'
    | 'suppliers'
    | 'accounting'
    | 'reports'
    | 'admin'
    | 'settings'

export interface RoleDefinition {
    id: string
    name: string
    description: string
    permissions: PermissionKey[]
    visibleMenus?: PermissionKey[]
    dataScope: 'own' | 'team' | 'branch' | 'all'
    branchId?: string
    template?: string
}

export interface UserWithRole {
    name: string
    role: string
    roleId?: string
    permissions?: PermissionKey[]
    visibleMenus?: PermissionKey[]
    dataScope?: RoleDefinition['dataScope']
    branchId?: string
    staffId?: string
}

export interface StaffMemberRecord {
    id: string
    name: string
    staffId: string
    pin: string
    roleId: string
    roleName: string
    permissions: PermissionKey[]
    visibleMenus?: PermissionKey[]
    dataScope: RoleDefinition['dataScope']
    status: 'active' | 'disabled'
    createdAt: string
    branch?: string
    department?: string
    position?: string
    phone?: string
    email?: string
    dateOfBirth?: string
    gender?: string
    passportPhoto?: string
    employeeId?: string
    username?: string
    password?: string
    salary?: string
    employmentDate?: string
    lastLogin?: string
}

const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
    // Super Admin is a platform provisioning & oversight role — no transactional posting
    'super-admin': ['dashboard', 'reports', 'admin', 'settings'],
    // Managing Director (md) follows same platform provisioning & oversight restrictions as Super Admin
    md: ['dashboard', 'reports', 'admin', 'settings'],
    accountant: ['dashboard', 'sales', 'purchases', 'accounting', 'reports'],
    cashier: ['dashboard', 'sales'],
    auditor: ['dashboard', 'reports', 'admin'],
}

export const RBAC_TEMPLATES: RoleDefinition[] = [
    {
        id: 'super-admin',
        name: 'Super Admin',
        description: 'Platform provisioning and oversight (no transactional posting)',
        permissions: ['dashboard', 'reports', 'admin', 'settings'],
        visibleMenus: ['dashboard', 'reports', 'admin', 'settings'],
        dataScope: 'all',
        template: 'Super Admin',
    },
    {
        id: 'cashier',
        name: 'Cashier',
        description: 'Handles sales and cash transactions',
        permissions: ['dashboard', 'sales'],
        visibleMenus: ['dashboard', 'sales'],
        dataScope: 'own',
        template: 'Cashier',
    },
    {
        id: 'accountant',
        name: 'Accountant',
        description: 'Manages financial records',
        permissions: ['dashboard', 'sales', 'purchases', 'accounting', 'reports'],
        visibleMenus: ['dashboard', 'sales', 'purchases', 'accounting', 'reports'],
        dataScope: 'team',
        template: 'Accountant',
    },
    {
        id: 'auditor',
        name: 'Auditor',
        description: 'Reviews logs and reports',
        permissions: ['dashboard', 'reports', 'admin'],
        visibleMenus: ['dashboard', 'reports'],
        dataScope: 'all',
        template: 'Auditor',
    },
]

export const ROLE_STORAGE_KEY = 'hw_rbac_roles'
export const USER_ROLE_STORAGE_KEY = 'hw_user_roles'

export function getDefaultRoles(): RoleDefinition[] {
    return RBAC_TEMPLATES.map((role) => ({ ...role, visibleMenus: role.visibleMenus ? [...role.visibleMenus] : undefined }))
}

export function getStoredRoles(): RoleDefinition[] {
    if (typeof window === 'undefined') return getDefaultRoles()
    const raw = window.localStorage.getItem(ROLE_STORAGE_KEY)
    if (!raw) return getDefaultRoles()
    try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : getDefaultRoles()
    } catch {
        return getDefaultRoles()
    }
}

export function saveRoles(roles: RoleDefinition[]) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(roles))
}

function getRolePermissions(user: Pick<UserWithRole, 'role' | 'permissions'> | null | undefined): PermissionKey[] {
    if (!user) return []
    if (user.permissions && user.permissions.length > 0) return user.permissions as PermissionKey[]
    return DEFAULT_ROLE_PERMISSIONS[user.role] || []
}

export function roleHasPermission(user: Pick<UserWithRole, 'role' | 'permissions'> | null | undefined, permission: PermissionKey): boolean {
    if (!user) return false
    const rolePermissions = getRolePermissions(user)
    return rolePermissions.includes(permission)
}

export function canAccessRoute(user: Pick<UserWithRole, 'role' | 'permissions'> | null | undefined, pathname: string): boolean {
    const routePermissions: Record<string, PermissionKey> = {
        '/dashboard': 'dashboard',
        '/sales': 'sales',
        '/inventory': 'inventory',
        '/purchases': 'purchases',
        '/customers': 'customers',
        '/suppliers': 'suppliers',
        '/ledger': 'accounting',
        '/daily-close': 'accounting',
        '/receivables': 'accounting',
        '/payables': 'accounting',
        '/prepayments': 'accounting',
        '/supplier-rebates': 'accounting',
        '/loans': 'accounting',
        '/reports': 'reports',
        '/monthly-report': 'reports',
        '/annual-report': 'reports',
        '/asset-schedule': 'reports',
        '/settings': 'settings',
        '/backup': 'admin',
        '/change-password': 'settings',
        '/subscription-and-licensing': 'admin',
        '/audit': 'admin',
        '/staff-management': 'admin',
        '/bank-txn': 'accounting',
        '/tax': 'accounting',
        '/product-manager': 'inventory',
        '/user-guide': 'dashboard',
    }

    const matchingPermission = Object.entries(routePermissions).find(([path]) => pathname.startsWith(path))
    if (!matchingPermission) return true
    return roleHasPermission(user, matchingPermission[1])
}

export function generateStaffId(name: string): string {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()
    const randomSegment = Math.floor(1000 + Math.random() * 9000)
    return `${cleanName}-${randomSegment}`
}

export function generatePin(): string {
    return `${Math.floor(1000 + Math.random() * 9000)}`
}

export function findStaffMemberByLogin(
    staffMembers: Array<Pick<StaffMemberRecord, 'staffId' | 'pin' | 'username'>>,
    staffIdOrUsername: string,
    pin: string,
): StaffMemberRecord | undefined {
    const normalizedStaffId = staffIdOrUsername.trim().toUpperCase()
    const normalizedPin = pin.trim()

    return staffMembers.find((member) => {
        const matchesStaffId = member.staffId?.trim().toUpperCase() === normalizedStaffId
        const matchesUsername = member.username?.trim().toUpperCase() === normalizedStaffId
        return (matchesStaffId || matchesUsername) && member.pin?.trim() === normalizedPin
    }) as StaffMemberRecord | undefined
}

export function getVisibleNavigationItems(user: Pick<UserWithRole, 'role' | 'permissions' | 'visibleMenus'> | null | undefined) {
    const allItems = [
        { label: 'Dashboard', href: '/dashboard', group: 'OVERVIEW', permission: 'dashboard' as PermissionKey, icon: 'dashboard' },
        { label: 'Sales', href: '/sales', group: 'TRANSACTIONS', permission: 'sales' as PermissionKey, icon: 'sales' },
        { label: 'Purchases', href: '/purchases', group: 'TRANSACTIONS', permission: 'purchases' as PermissionKey, icon: 'purchases' },
        { label: 'Inventory', href: '/inventory', group: 'STOCK', permission: 'inventory' as PermissionKey, icon: 'inventory' },
        { label: 'Product Manager', href: '/product-manager', group: 'STOCK', permission: 'inventory' as PermissionKey, icon: 'productManager' },
        { label: 'Bank Transactions', href: '/bank-txn', group: 'BANKING', permission: 'accounting' as PermissionKey, icon: 'bankTxn' },
        { label: 'Bank Balances', href: '/banks', group: 'BANKING', permission: 'accounting' as PermissionKey, icon: 'banks' },
        { label: 'Daily Closing', href: '/daily-close', group: 'ACCOUNTING', permission: 'accounting' as PermissionKey, icon: 'dailyClose' },
        { label: 'Audit Trail', href: '/audit', group: 'AUDIT & ADMIN', permission: 'admin' as PermissionKey, icon: 'audit' },
        { label: 'General Ledger', href: '/ledger', group: 'ACCOUNTING', permission: 'accounting' as PermissionKey, icon: 'ledger' },
        { label: 'Receivables', href: '/receivables', group: 'ACCOUNTING', permission: 'accounting' as PermissionKey, icon: 'receivables' },
        { label: 'Payables', href: '/payables', group: 'ACCOUNTING', permission: 'accounting' as PermissionKey, icon: 'payables' },
        { label: 'Prepayments', href: '/prepayments', group: 'ACCOUNTING', permission: 'accounting' as PermissionKey, icon: 'prepayments' },
        { label: 'Supplier Rebates', href: '/supplier-rebates', group: 'ACCOUNTING', permission: 'accounting' as PermissionKey, icon: 'supplierRebates' },
        { label: 'Loans', href: '/loans', group: 'ACCOUNTING', permission: 'accounting' as PermissionKey, icon: 'loans' },
        { label: 'Monthly Report', href: '/monthly-report', group: 'REPORTS', permission: 'reports' as PermissionKey, icon: 'monthlyReport' },
        { label: 'Annual Report', href: '/annual-report', group: 'REPORTS', permission: 'reports' as PermissionKey, icon: 'annualReport' },
        { label: 'Asset Schedule', href: '/asset-schedule', group: 'REPORTS', permission: 'reports' as PermissionKey, icon: 'assetSchedule' },
        { label: 'Staff Management', href: '/staff-management', group: 'HUMAN RESOURCES', permission: 'admin' as PermissionKey, icon: 'settings' },
        { label: 'Settings', href: '/settings', group: 'AUDIT & ADMIN', permission: 'settings' as PermissionKey, icon: 'settings' },
        { label: 'Backup & Recovery', href: '/backup', group: 'AUDIT & ADMIN', permission: 'admin' as PermissionKey, icon: 'settings' },
        { label: 'Subscription & Licensing', href: '/subscription-and-licensing', group: 'AUDIT & ADMIN', permission: 'admin' as PermissionKey, icon: 'subscription' },
        { label: 'User Guide', href: '/user-guide', group: 'AUDIT & ADMIN', permission: 'dashboard' as PermissionKey, icon: 'userGuide' },
    ]

    return allItems.filter((item) => {
        if (item.href === '/dashboard') return roleHasPermission(user, 'dashboard')
        if (['/sales'].includes(item.href)) return roleHasPermission(user, 'sales')
        if (['/inventory', '/product-manager'].includes(item.href)) return roleHasPermission(user, 'inventory')
        if (['/purchases'].includes(item.href)) return roleHasPermission(user, 'purchases')
        if (['/bank-txn', '/banks', '/daily-close', '/ledger', '/receivables', '/payables', '/prepayments', '/supplier-rebates', '/loans', '/tax'].includes(item.href)) return roleHasPermission(user, 'accounting')
        if (['/monthly-report', '/annual-report', '/asset-schedule', '/reports'].includes(item.href)) return roleHasPermission(user, 'reports')
        if (['/settings', '/backup', '/subscription-and-licensing', '/audit', '/staff-management'].includes(item.href)) return roleHasPermission(user, 'admin') || roleHasPermission(user, 'settings')
        if (item.permission && user?.visibleMenus && !user.visibleMenus.includes(item.permission)) return false
        return true
    })
}
