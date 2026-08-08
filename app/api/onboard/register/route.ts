import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { buildSeedChartOfAccounts } from '@/lib/accounting/chart-of-accounts'
import { buildSeedAccountingPeriods } from '@/lib/accounting/periods'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { companyName, adminFullName, adminEmail, staffId, username, pin } = body || {}

        if (!supabaseAdmin) {
            return NextResponse.json({ ok: false, error: 'Supabase admin client is not configured' }, { status: 500 })
        }

        // Disallow onboarding if users already exist
        const { count, error: countErr } = await supabaseAdmin.from('users').select('id', { head: true, count: 'exact' })
        if (countErr) {
            return NextResponse.json({ ok: false, error: countErr.message }, { status: 500 })
        }
        if ((count || 0) > 0) {
            return NextResponse.json({ ok: false, error: 'Onboarding not allowed: users already exist' }, { status: 409 })
        }

        const now = new Date().toISOString()

        // Generate a staff ID if not provided
        const generatedStaffId = staffId && String(staffId).trim().length > 0 ? String(staffId).trim() : `STF-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 9000 + 1000)}`

        // Insert the super-admin user
        const { error: userErr } = await supabaseAdmin.from('users').insert({
            staff_id: generatedStaffId,
            username: username,
            pin: pin,
            email: adminEmail ?? `${username}@local`,
            full_name: adminFullName,
            role: 'super-admin',
            status: 'active',
            created_at: now,
            updated_at: now,
        })

        if (userErr) {
            return NextResponse.json({ ok: false, error: userErr.message }, { status: 500 })
        }

        // Seed basic chart of accounts
        try {
            const chart = buildSeedChartOfAccounts().map((a) => ({
                code: a.code,
                name: a.name,
                account_type: a.accountType || a.account_type,
                account_subtype: a.accountSubType || a.account_subtype || null,
                normal_balance: a.normalBalance || a.normal_balance || 'DEBIT',
                is_control_account: Boolean(a.isControlAccount),
                is_active: a.isActive !== false,
                currency: a.currency || 'NGN',
                created_at: now,
                updated_at: now,
            }))

            await supabaseAdmin.from('chart_of_accounts').insert(chart)
        } catch (e) {
            // non-fatal; continue
            console.warn('Unable to seed chart of accounts', e)
        }

        // Seed initial accounting period
        try {
            const periods = buildSeedAccountingPeriods().map((p) => ({
                fiscal_year: p.fiscalYear || p.fiscal_year,
                period_number: p.periodNumber || p.period_number,
                start_date: p.startDate || p.start_date,
                end_date: p.endDate || p.end_date,
                status: p.status || 'OPEN',
                created_at: now,
                updated_at: now,
            }))

            await supabaseAdmin.from('accounting_periods').insert(periods)
        } catch (e) {
            console.warn('Unable to seed accounting periods', e)
        }

        // Optionally create a bank_accounts placeholder
        try {
            await supabaseAdmin.from('bank_accounts').insert([{ name: `${companyName} - Cash`, institution: companyName ?? 'Company', balance: 0, currency: 'NGN', status: 'active', created_at: now, updated_at: now }])
        } catch (e) {
            console.warn('Unable to create default bank account', e)
        }

        return NextResponse.json({ ok: true, message: 'Onboarding completed' })
    } catch (err) {
        return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
    }
}
