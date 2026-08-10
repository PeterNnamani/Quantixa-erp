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
            phone: payload.phone || null,
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
