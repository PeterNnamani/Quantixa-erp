import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'

function isMissingDeviceUsedColumn(error: unknown): boolean {
    return typeof error === 'object' && error !== null
        && (error as { code?: string }).code === 'PGRST204'
        && /device_used/i.test(String((error as { message?: string }).message || ''))
}

async function upsertSaleWithSchemaFallback(saleRow: Record<string, unknown>) {
    let result = await supabaseAdmin!.from('sales').upsert(saleRow, { onConflict: 'reference' }).select('id').single()
    if (isMissingDeviceUsedColumn(result.error)) {
        const { device_used: _deviceUsed, ...compatibleSaleRow } = saleRow
        result = await supabaseAdmin!.from('sales').upsert(compatibleSaleRow, { onConflict: 'reference' }).select('id').single()
    }
    return result
}

export async function POST(request: Request) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ success: false, error: 'Supabase admin client is not configured' }, { status: 500 })
        }

        const payload = await request.json()
        const companyId = String(payload.companyId || '').trim()
        const sale = payload.sale
        if (!companyId || !sale?.id || !sale.customer || !Array.isArray(sale.items) || sale.items.length === 0) {
            return NextResponse.json({ success: false, error: 'A company, customer, and sale items are required.' }, { status: 400 })
        }

        const customerName = String(sale.customer).trim()
        let { data: customer, error: customerLookupError } = await supabaseAdmin
            .from('contacts')
            .select('id')
            .eq('company_id', companyId)
            .eq('type', 'customer')
            .eq('name', customerName)
            .limit(1)
            .maybeSingle()

        if (customerLookupError) throw customerLookupError
        if (!customer) {
            const result = await supabaseAdmin
                .from('contacts')
                .insert({ company_id: companyId, type: 'customer', name: customerName })
                .select('id')
                .single()
            customer = result.data
            customerLookupError = result.error
            if (customerLookupError) throw customerLookupError
        }
        if (!customer) throw new Error('Unable to resolve the customer record.')

        const saleRow = {
            company_id: companyId,
            reference: String(sale.id),
            sale_date: sale.date,
            customer_id: customer.id,
            payment_method: sale.paymentMethod || 'Transfer',
            payment_status: sale.paymentStatus || 'PAID',
            status: sale.status || 'ACTIVE',
            notes: sale.notes || null,
            subtotal: Number(sale.totalAmount || 0),
            total_amount: Number(sale.totalAmount || 0),
            amount_paid: sale.paymentStatus === 'PAID' ? Number(sale.totalAmount || 0) : 0,
            balance: sale.paymentStatus === 'PAID' ? 0 : Number(sale.totalAmount || 0),
            sales_rep: sale.enteredBy || null,
            device_used: sale.deviceUsed || null,
        }
        const { data: storedSale, error: saleError } = await upsertSaleWithSchemaFallback(saleRow)
        if (saleError) throw saleError

        const itemRows = sale.items.map((item: any) => ({
            company_id: companyId,
            sale_id: storedSale.id,
            product_name: item.product,
            department: item.dept || null,
            qty: Number(item.qty || 0),
            unit_price: Number(item.unitPrice || 0),
            total: Number(item.total || 0),
        }))
        const { error: itemError } = await supabaseAdmin.from('sale_items').upsert(itemRows)
        if (itemError) throw itemError

        return NextResponse.json({ success: true, saleId: storedSale.id })
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 })
    }
}