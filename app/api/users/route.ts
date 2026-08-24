import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'

export async function POST(request: Request) {
    try {
        const payload = await request.json()
        if (!supabaseAdmin) {
            return NextResponse.json({ success: false, error: 'Supabase admin client is not configured' }, { status: 500 })
        }

        const now = new Date().toISOString()
        const insertData = {
            company_id: payload.companyId,
            staff_id: payload.staffId,
            username: payload.username,
            pin: payload.pin,
            email: payload.email || `${payload.username}@local`,
            full_name: payload.fullName,
            role: payload.roleId,
            role_title: payload.roleTitle || null,
            access_levels: payload.accessLevels || null,
            phone: payload.phone || null,
            branch: payload.branch || null,
            department: payload.department || null,
            position: payload.position || null,
            employee_id: payload.employeeId || null,
            salary: payload.salary || null,
            employment_date: payload.employmentDate || null,
            status: payload.status || 'active',
            created_at: now,
            updated_at: now,
        }

        // If the user already exists by username or staff ID, update instead of relying on ON CONFLICT.
        const { data: existingByUsername } = await supabaseAdmin.from('users').select('id').eq('company_id', payload.companyId).eq('username', payload.username).limit(1)
        const { data: existingByStaffId } = await supabaseAdmin.from('users').select('id').eq('company_id', payload.companyId).eq('staff_id', payload.staffId).limit(1)

        let error = null
        if ((existingByUsername && existingByUsername.length > 0) || (existingByStaffId && existingByStaffId.length > 0)) {
            const matchId = (existingByUsername && existingByUsername.length > 0)
                ? existingByUsername[0].id
                : existingByStaffId![0].id
            const updateResult = await supabaseAdmin.from('users').update(insertData).eq('id', matchId)
            error = updateResult.error
        } else {
            const insertResult = await supabaseAdmin.from('users').insert(insertData)
            error = insertResult.error
        }

        if (error) {
            console.warn('Unable to write staff user to users table', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const payload = await request.json()
        const companyId = String(payload.companyId || '').trim()
        const staffId = String(payload.staffId || '').trim()
        const username = String(payload.username || '').trim()
        const currentPin = String(payload.currentPin || '').trim()
        const newPin = String(payload.newPin || '').trim()

        if (!supabaseAdmin) return NextResponse.json({ success: false, error: 'Supabase admin client is not configured' }, { status: 500 })
        if (!companyId || (!staffId && !username) || !/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
            return NextResponse.json({ success: false, error: 'A valid account and four-digit PINs are required.' }, { status: 400 })
        }
        if (currentPin === newPin) return NextResponse.json({ success: false, error: 'New PIN must be different from the current PIN.' }, { status: 400 })

        let query = supabaseAdmin.from('users').select('id').eq('company_id', companyId).eq('pin', currentPin)
        query = staffId ? query.eq('staff_id', staffId) : query.eq('username', username)
        const { data: matches, error: lookupError } = await query.limit(1)
        if (lookupError) return NextResponse.json({ success: false, error: lookupError.message }, { status: 400 })
        if (!matches?.[0]?.id) return NextResponse.json({ success: false, error: 'Current PIN is incorrect.' }, { status: 403 })

        const { error } = await supabaseAdmin.from('users').update({ pin: newPin, updated_at: new Date().toISOString() }).eq('id', matches[0].id)
        if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
