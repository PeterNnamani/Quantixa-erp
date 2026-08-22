import test from 'node:test'
import assert from 'node:assert/strict'
import { canAccessRoute, canEditPermission, findStaffMemberByLogin, getVisibleNavigationItems, roleHasPermission } from '../lib/rbac.mjs'

test('super admin has provisioning/oversight permissions, not transactional', () => {
    const superAdmin = { role: 'super-admin' }
    assert.equal(roleHasPermission(superAdmin, 'dashboard'), true)
    assert.equal(roleHasPermission(superAdmin, 'settings'), true)
    assert.equal(canAccessRoute(superAdmin, '/backup'), true)
    assert.equal(canAccessRoute(superAdmin, '/banks'), true)
    assert.equal(canAccessRoute(superAdmin, '/bank-txn'), true)
    assert.equal(canEditPermission(superAdmin, 'banks'), false)
    assert.equal(canEditPermission(superAdmin, 'bankTxn'), false)
    // Should NOT have transactional posting permissions
    assert.equal(canAccessRoute(superAdmin, '/sales'), false)
    assert.equal(canAccessRoute(superAdmin, '/ledger'), false)
})

test('cashier sees only sales and dashboard menus', () => {
    const cashier = { role: 'cashier' }
    const visible = getVisibleNavigationItems(cashier)
    const hrefs = visible.map((item) => item.href)

    assert.ok(hrefs.includes('/dashboard'))
    assert.ok(hrefs.includes('/sales'))
    assert.ok(!hrefs.includes('/settings'))
    assert.ok(!hrefs.includes('/ledger'))
})

test('route access is denied when module permission is missing', () => {
    const accountant = { role: 'accountant' }
    assert.equal(canAccessRoute(accountant, '/settings'), false)
    assert.equal(canAccessRoute(accountant, '/ledger'), true)
})

test('staff login can be resolved by staff id and generated pin', () => {
    const staffMembers = [
        {
            id: 'staff-1',
            name: 'Ada Okafor',
            staffId: 'ADA-1001',
            pin: '4821',
            roleId: 'cashier',
            roleName: 'Cashier',
            permissions: ['dashboard', 'sales'],
            dataScope: 'own',
            status: 'active',
            createdAt: '2026-01-01T00:00:00.000Z',
        },
    ]

    const match = findStaffMemberByLogin(staffMembers, 'ADA-1001', '4821')
    assert.ok(match)
    assert.equal(match?.name, 'Ada Okafor')
})

test('custom staff access keeps view-only menus visible without edit access', () => {
    const staff = {
        role: 'custom-role',
        accessLevels: { dashboard: 'view', reports: 'view', sales: 'edit' },
    }

    assert.equal(canAccessRoute(staff, '/reports'), true)
    assert.equal(canEditPermission(staff, 'reports'), false)
    assert.equal(canEditPermission(staff, 'sales'), true)
    assert.ok(getVisibleNavigationItems(staff).some((item) => item.href === '/sales'))
})
