'use client'

import { useMemo, useState } from 'react'
import { ArrowDownToLine, CalendarDays, Search, WalletCards } from 'lucide-react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { formatCurrency } from '@/lib/utils'
import { downloadExcel } from '@/lib/export-utils'

export default function CreditSalesPage() {
    const { state, addAuditLog } = useAccounting()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedPeriod, setSelectedPeriod] = useState('All time')
    const [selectedSaleId, setSelectedSaleId] = useState('')

    const creditSales = useMemo(() => state.sales
        .filter((sale) => sale.status !== 'VOID' && sale.paymentStatus.toUpperCase() === 'CREDIT')
        .map((sale) => ({ ...sale, paidAmount: sale.amountPaid ?? 0, balance: sale.balance ?? Math.max(0, sale.totalAmount - (sale.amountPaid ?? 0)) })), [state.sales])
    const filteredSales = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()
        const now = new Date()
        return creditSales.filter((sale) => {
            const date = new Date(sale.date)
            const periodMatches = selectedPeriod === 'All time' || (selectedPeriod === 'This month' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) || (selectedPeriod === 'This year' && date.getFullYear() === now.getFullYear())
            return periodMatches && (!term || [sale.id, sale.customer, sale.enteredBy, sale.notes].join(' ').toLowerCase().includes(term))
        })
    }, [creditSales, searchTerm, selectedPeriod])
    const selectedSale = filteredSales.find((sale) => sale.id === selectedSaleId) || filteredSales[0]
    const metrics = {
        outstanding: filteredSales.reduce((sum, sale) => sum + sale.balance, 0),
        totalCredit: filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        customers: new Set(filteredSales.map((sale) => sale.customer)).size,
        overdue: filteredSales.filter((sale) => sale.paymentStatus === 'OVERDUE').length,
    }

    const handleExport = () => {
        downloadExcel('credit-sales-report.xlsx', filteredSales)
        addAuditLog('EXPORT', 'SALE', 'CREDIT', 'Credit sales report exported.')
    }

    return (
        <AppLayout>
            <div className="page-shell">
                <div className="page-hero">
                    <div><div className="eyebrow">Receivables workspace</div><h1 className="page-title">Credit Sales</h1><p className="page-subtitle">Track every unpaid invoice, customer exposure, and outstanding balance from the sales ledger.</p></div>
                    <button className="action-btn primary" type="button" onClick={handleExport}><ArrowDownToLine size={16} /> Export report</button>
                </div>
                <div className="dashboard-card-grid">
                    <div className="dashboard-card"><div className="metric-label">Outstanding balance</div><div className="metric-value">{formatCurrency(metrics.outstanding)}</div><div className="metric-note">Amount still due</div></div>
                    <div className="dashboard-card"><div className="metric-label">Credit issued</div><div className="metric-value">{formatCurrency(metrics.totalCredit)}</div><div className="metric-note">Across filtered invoices</div></div>
                    <div className="dashboard-card"><div className="metric-label">Customers on credit</div><div className="metric-value">{metrics.customers}</div><div className="metric-note">Unique account holders</div></div>
                    <div className="dashboard-card"><div className="metric-label">Overdue accounts</div><div className="metric-value">{metrics.overdue}</div><div className="metric-note">Requires follow-up</div></div>
                </div>
                <div className="card credit-toolbar">
                    <div className="search-field credit-search"><Search size={17} aria-hidden="true" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search invoice, customer, or sales rep" aria-label="Search credit sales" /></div>
                    <label className="credit-period"><CalendarDays size={16} aria-hidden="true" /><span className="sr-only">Period</span><select value={selectedPeriod} onChange={(event) => setSelectedPeriod(event.target.value)}><option>All time</option><option>This month</option><option>This year</option></select></label>
                    <div className="table-summary">{filteredSales.length} open invoice{filteredSales.length === 1 ? '' : 's'}</div>
                </div>
                <div className="module-content-grid credit-layout">
                    <div className="card"><div className="card-hd"><div><div className="card-title">Credit ledger</div><div className="section-subtitle">Only sales marked CREDIT in the shared sales table.</div></div></div><div className="tbl-wrap"><table><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>{filteredSales.length === 0 ? <tr><td colSpan={7} className="empty-cell">No credit sales match your filters.</td></tr> : filteredSales.map((sale) => <tr key={sale.id} className={selectedSale?.id === sale.id ? 'selected' : ''} onClick={() => setSelectedSaleId(sale.id)}><td><strong>{sale.id}</strong></td><td>{sale.customer}</td><td>{sale.date}</td><td>{formatCurrency(sale.totalAmount)}</td><td>{formatCurrency(sale.paidAmount)}</td><td><strong>{formatCurrency(sale.balance)}</strong></td><td><span className={`badge ${sale.paymentStatus === 'OVERDUE' ? 'b-red' : 'b-amber'}`}>{sale.paymentStatus || 'CREDIT'}</span></td></tr>)}</tbody></table></div></div>
                    <aside className="detail-panel credit-detail"><div className="detail-section credit-detail-intro"><div className="credit-icon"><WalletCards size={22} /></div><div><div className="detail-section-title">Account snapshot</div><div className="metric-note">Selected credit invoice</div></div></div><div className="detail-section"><div className="detail-row"><span>Invoice</span><strong>{selectedSale?.id || '-'}</strong></div><div className="detail-row"><span>Customer</span><strong>{selectedSale?.customer || '-'}</strong></div><div className="detail-row"><span>Sale date</span><strong>{selectedSale?.date || '-'}</strong></div><div className="detail-row"><span>Sales rep</span><strong>{selectedSale?.enteredBy || '-'}</strong></div></div><div className="detail-section credit-balance"><span>Amount outstanding</span><strong>{formatCurrency(selectedSale?.balance || 0)}</strong><div className="metric-note">Payment status: {selectedSale?.paymentStatus || 'No selection'}</div></div><div className="detail-section"><div className="detail-section-title">Products</div>{selectedSale?.items?.length ? selectedSale.items.map((item, index) => <div className="detail-row" key={`${selectedSale.id}-${index}`}><span>{item.product} × {item.qty}</span><strong>{formatCurrency(item.total)}</strong></div>) : <div className="metric-note">Product line items are not available for this invoice.</div>}</div></aside>
                </div>
            </div>
        </AppLayout>
    )
}
