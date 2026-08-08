import { getSupabaseClient } from '@/lib/supabase.browser'
import type { RoleDefinition } from '@/lib/rbac'
import type { User } from '@/lib/context'

export interface DatabaseUserRecord {
    id?: string
    staff_id?: string | null
    username?: string | null
    pin?: string | null
    email?: string | null
    full_name?: string | null
    role?: string | null
    phone?: string | null
    status?: string | null
    branch?: string | null
    department?: string | null
    position?: string | null
    employee_id?: string | null
    salary?: string | null
    employment_date?: string | null
    created_at?: string | null
    updated_at?: string | null
    last_login?: string | null
}

export async function findUserInDatabase(
    staffIdOrUsername: string,
    pin: string,
    roles: RoleDefinition[],
): Promise<User | null> {
    const supabase = getSupabaseClient()
    if (!supabase) return null

    const normalizedId = staffIdOrUsername.trim().toUpperCase()
    const normalizedPin = pin.trim()

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('pin', normalizedPin)

    if (error) {
        console.warn('Unable to query users table for login', error)
        return null
    }

    const match = (data || []).find((row: DatabaseUserRecord) => {
        const staffId = String(row.staff_id ?? '').trim().toUpperCase()
        const username = String(row.username ?? '').trim().toUpperCase()
        return (staffId === normalizedId || username === normalizedId) && String(row.pin ?? '').trim() === normalizedPin
    })

    if (!match) return null

    const roleId = String(match.role || 'cashier')
    const roleDefinition = roles.find((role) => role.id === roleId)

    return {
        name: String(match.full_name || match.username || match.staff_id || 'Staff User'),
        role: roleId,
        roleId,
        staffId: match.staff_id ? String(match.staff_id) : undefined,
        permissions: roleDefinition?.permissions || [],
        dataScope: roleDefinition?.dataScope || 'team',
    }
}

export async function saveUserToDatabase(payload: {
    staffId: string
    username: string
    pin: string
    fullName: string
    roleId: string
    email?: string
    phone?: string
    branch?: string
    department?: string
    position?: string
    employeeId?: string
    salary?: string
    employmentDate?: string
    status?: string
}) {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    const result = await response.json()
    if (!response.ok || !result.success) {
        console.warn('Unable to write staff user to users table', result.error)
        return { success: false, error: result.error || 'Unable to save user' }
    }

    return { success: true }
}
