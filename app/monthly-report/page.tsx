'use client'

import { useMemo, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { downloadExcel, downloadFinancialReportPdf } from '@/lib/export-utils'
import { calculateVAT, formatCurrency, triggerAppToast } from '@/lib/utils'

const expenseCategories = ['Salary', 'Rent', 'Fuel', 'Marketing', 'Utilities', 'Operations']

export default function MonthlyReportPage() {
    const { state } = useAccounting()
    const [activeRange, setActiveRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly')
    const [statusMessage, setStatusMessage] = useState('Report generated for the current month.')
    const [includeVAT, setIncludeVAT] = useState(false)

    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthStart = `${currentMonth}-01`
    const monthEnd = new Date(Date.UTC(Number(currentMonth.slice(0, 4)), Number(currentMonth.slice(5, 7)), 0)).toISOString().slice(0, 10)
    const inMonth = (date?: string) => Boolean(date && date >= monthStart && date <= monthEnd)
    const monthlySales = useMemo(() => state.sales.filter((sale) => inMonth(sale.date) && sale.status !== 'VOID'), [state.sales, monthStart, monthEnd])
    const monthlyPurchases = useMemo(() => state.purchases.filter((purchase) => inMonth(purchase.date) && purchase.status !== 'VOID'), [state.purchases, monthStart, monthEnd])
    const monthlyExpenses = useMemo(() => state.expenses.filter((expense) => inMonth(expense.date) && expense.status !== 'VOID'), [state.expenses, monthStart, monthEnd])
    const monthlyTransactions = useMemo(() => state.bankTxns.filter((txn) => inMonth(txn.date)), [state.bankTxns, monthStart, monthEnd])
    const totalRevenue = useMemo(() => monthlySales.reduce((sum, sale) => sum + sale.totalAmount, 0), [monthlySales])
    const totalExpenses = useMemo(() => monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0), [monthlyExpenses])
    const totalPurchases = useMemo(() => monthlyPurchases.reduce((sum, purchase) => sum + purchase.total, 0), [monthlyPurchases])
    const monthlyPostedEntryIds = new Set(state.journalEntries.filter((entry) => entry.status === 'POSTED' && inMonth(entry.entryDate)).map((entry) => entry.id))
    const cogsAccountIds = new Set(state.chartOfAccounts.filter((account) => account.name.toLowerCase().includes('cost of goods sold')).map((account) => account.id))
    const costOfGoodsSold = state.journalLines.filter((line) => cogsAccountIds.has(line.accountId) && monthlyPostedEntryIds.has(line.entryId)).reduce((sum, line) => sum + line.debit - line.credit, 0)
    const netProfit = totalRevenue - costOfGoodsSold - totalExpenses
    const inventoryValue = useMemo(() => state.inventory.reduce((sum, item) => sum + item.unitCost * item.closing, 0), [state.inventory])
    const bankAccounts = Object.entries(state.banks)
    const totalBankBalance = bankAccounts.reduce((sum, [, balance]) => sum + Number(balance || 0), 0)
    const cashAccount = state.chartOfAccounts.find((account) => account.name.toLowerCase().includes('cash') && !account.name.toLowerCase().includes('bank'))
    const cashAccountBalance = cashAccount
        ? Number(cashAccount.openingBalance || 0) + state.journalLines.filter((line) => line.accountId === cashAccount.id && state.journalEntries.some((entry) => entry.id === line.entryId && entry.status === 'POSTED' && entry.entryDate <= monthEnd)).reduce((sum, line) => sum + line.debit - line.credit, 0)
        : 0
    const cashReceived = monthlyTransactions.filter((txn) => Number(txn.amount) > 0).reduce((sum, txn) => sum + Number(txn.amount), 0)
    const cashPaid = monthlyTransactions.filter((txn) => Number(txn.amount) < 0).reduce((sum, txn) => sum + Math.abs(Number(txn.amount)), 0)
    const reportVAT = includeVAT ? calculateVAT(totalRevenue) : 0

    const overviewCards = [
        { label: 'Total Revenue', value: formatCurrency(totalRevenue), change: 'Database-backed' },
        { label: 'Total Expenses', value: formatCurrency(totalExpenses), change: 'Database-backed' },
        { label: 'Net Profit', value: formatCurrency(netProfit), change: 'Database-backed' },
        { label: 'Purchases', value: formatCurrency(totalPurchases), change: 'Database-backed' },
        { label: 'Transactions', value: String(monthlySales.length + monthlyPurchases.length + monthlyExpenses.length), change: 'Database-backed' },
        { label: 'Inventory Value', value: formatCurrency(inventoryValue), change: 'Database-backed' },
    ]

    const pAndL = [
        { label: 'Sales Revenue', amount: formatCurrency(totalRevenue) },
        { label: 'Cost of Goods Sold', amount: formatCurrency(costOfGoodsSold) },
        { label: 'Expenses', amount: formatCurrency(totalExpenses) },
    ]

    const reportExportData = { Period: currentMonth, Revenue: totalRevenue, Purchases: totalPurchases, CostOfGoodsSold: costOfGoodsSold, Expenses: totalExpenses, NetProfit: netProfit, Transactions: monthlySales.length + monthlyPurchases.length + monthlyExpenses.length }

    const salesCards = [
        { label: 'Total Sales', value: formatCurrency(totalRevenue) },
        { label: 'Orders', value: String(monthlySales.length) },
        { label: 'Average Order Value', value: monthlySales.length > 0 ? formatCurrency(totalRevenue / monthlySales.length) : formatCurrency(0) },
        { label: 'Best Product', value: state.inventory[0]?.product || 'Not available' },
    ]

    const inventoryStats = [
        { label: 'Products', value: String(state.inventory.length) },
        { label: 'Purchases', value: formatCurrency(totalPurchases) },
        { label: 'Sales', value: formatCurrency(totalRevenue) },
        { label: 'Inventory Value', value: formatCurrency(inventoryValue) },
    ]

    const handleAction = (action: string) => {
        setStatusMessage(`${action} completed for this month.`)
        triggerAppToast(action, `${action} completed for the current month.`)
        if (action === 'Export PDF') {
            void downloadFinancialReportPdf({
                filename: `monthly-report-${activeRange.toLowerCase()}.pdf`, reportTitle: 'Monthly Report', periodLabel: `${currentMonth} | ${activeRange} view`,
                highlights: [{ label: 'Revenue', value: formatCurrency(totalRevenue) }, { label: 'Net profit', value: formatCurrency(netProfit) }, { label: 'Inventory value', value: formatCurrency(inventoryValue) }, { label: 'Cash movement', value: formatCurrency(cashReceived - cashPaid) }],
                sections: [
                    { title: 'Profit and Loss Statement', columns: ['Description', 'Amount'], rows: [['Sales revenue', totalRevenue], ['Cost of goods sold', costOfGoodsSold], ['Operating expenses', totalExpenses], ...(includeVAT ? [['VAT on revenue', reportVAT] as [string, number]] : [])], total: ['Net profit', netProfit] },
                    { title: 'Statement of Financial Position', columns: ['Description', 'Amount'], rows: [['Bank accounts', totalBankBalance], ['Cash account', cashAccountBalance], ['Inventory', inventoryValue]], total: ['Current assets', totalBankBalance + cashAccountBalance + inventoryValue] },
                    { title: 'Cash Flow Statement', columns: ['Description', 'Amount'], rows: [['Cash received', cashReceived], ['Cash paid', -cashPaid]], total: ['Net movement', cashReceived - cashPaid] },
                    { title: 'Activity Schedule', columns: ['Description', 'Count', 'Amount'], rows: [['Sales', monthlySales.length, totalRevenue], ['Purchases', monthlyPurchases.length, totalPurchases], ['Expenses', monthlyExpenses.length, totalExpenses]], total: ['Total activity', monthlySales.length + monthlyPurchases.length + monthlyExpenses.length, totalRevenue + totalPurchases + totalExpenses] },
                ],
                notes: [`Report range: ${activeRange}.`, `VAT is ${includeVAT ? 'included in the report calculation.' : 'not included in this export.'}`, 'Amounts are calculated from non-void records in the selected calendar month.'],
            })
        }

        if (action === 'Export Excel') {
            downloadExcel(`monthly-report-${activeRange.toLowerCase()}.xlsx`, [{ ...reportExportData, action }])
        }
    }

    return (
        <AppLayout>
            <div className="report-shell">
                <div className="page-header report-header">
                    <div>
                        <div className="pg-title">Monthly Reports</div>
                        <div className="pg-subtitle">Analyze monthly financial performance, operations, sales, expenses, and business trends.</div>
                    </div>
                    <div className="page-actions">
                        <button className="action-btn primary" onClick={() => handleAction('+ Generate Report')}>+ Generate Report</button>
                        <button className="action-btn secondary" onClick={() => handleAction('Compare Months')}>Compare Months</button>
                        <button className="action-btn secondary allow-readonly" onClick={() => handleAction('Export PDF')}>Export PDF</button>
                        <button className="action-btn secondary allow-readonly" onClick={() => handleAction('Export Excel')}>Export Excel</button>
                        <button className="action-btn secondary" onClick={() => handleAction('Schedule Report')}>Schedule Report</button>
                        <label><input type="checkbox" checked={includeVAT} onChange={(event) => setIncludeVAT(event.target.checked)} /> Calculate VAT on export</label>
                    </div>
                </div>

                <div className="report-grid report-summary-grid">
                    {overviewCards.map((card) => (
                        <div key={card.label} className="metric-card report-card">
                            <div className="metric-label">{card.label}</div>
                            <div className="metric-value">{card.value}</div>
                            <div className="metric-note">{card.change}</div>
                        </div>
                    ))}
                </div>

                <div className="report-grid two-col">
                    <div className="report-card large-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Financial Performance</div>
                                <div className="section-subtitle">Income vs Expenses vs Profit</div>
                            </div>
                            <div className="segmented-control">
                                {(['Daily', 'Weekly', 'Monthly'] as const).map((range) => (
                                    <button key={range} type="button" className={`seg-chip ${activeRange === range ? 'active' : ''}`} onClick={() => { setActiveRange(range); setStatusMessage(`${range} view selected.`) }}>{range}</button>
                                ))}
                            </div>
                        </div>
                        <div className="chart-placeholder">
                            <div className="chart-bars">
                                <div className="bar revenue" />
                                <div className="bar expenses" />
                                <div className="bar profit" />
                            </div>
                            <div className="chart-legend">
                                <span><i className="dot revenue" /> Revenue</span>
                                <span><i className="dot expenses" /> Expenses</span>
                                <span><i className="dot profit" /> Profit</span>
                            </div>
                        </div>
                    </div>

                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Profit & Loss Summary</div>
                                <div className="section-subtitle">Professional accounting view</div>
                            </div>
                        </div>
                        <div className="statement-block">
                            <div className="statement-section">
                                <div className="statement-title">Income</div>
                                {pAndL.slice(0, 1).map((row) => (
                                    <div key={row.label} className="statement-row">
                                        <span>{row.label}</span>
                                        <strong>{row.amount}</strong>
                                    </div>
                                ))}
                                <div className="statement-row total-row">
                                    <span>Total Income</span>
                                    <strong>{formatCurrency(totalRevenue)}</strong>
                                </div>
                            </div>
                            <div className="statement-section">
                                <div className="statement-title">Expenses</div>
                                {pAndL.slice(1).map((row) => (
                                    <div key={row.label} className="statement-row">
                                        <span>{row.label}</span>
                                        <strong>{row.amount}</strong>
                                    </div>
                                ))}
                                <div className="statement-row total-row">
                                    <span>Total Expenses</span>
                                    <strong>{formatCurrency(totalExpenses)}</strong>
                                </div>
                                <div className="statement-row net-row">
                                    <span>Net Profit</span>
                                    <strong>{formatCurrency(netProfit)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="report-grid three-col">
                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Sales Analysis</div>
                                <div className="section-subtitle">Revenue performance by business unit</div>
                            </div>
                        </div>
                        <div className="mini-grid">
                            {salesCards.map((card) => (
                                <div key={card.label} className="mini-card">
                                    <div className="mini-label">{card.label}</div>
                                    <div className="mini-value">{card.value}</div>
                                </div>
                            ))}
                        </div>
                        <div className="chart-footer">Sales by category • Sales by branch • Top products • Top customers</div>
                    </div>

                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Expense Analysis</div>
                                <div className="section-subtitle">Spending mix by category</div>
                            </div>
                        </div>
                        <div className="expense-list">
                            {expenseCategories.map((item) => (
                                <div key={item} className="expense-pill">{item}</div>
                            ))}
                        </div>
                        <div className="donut-placeholder">Donut chart</div>
                    </div>

                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Inventory Report</div>
                                <div className="section-subtitle">Stock movement and carrying value</div>
                            </div>
                        </div>
                        <div className="mini-grid">
                            {inventoryStats.map((item) => (
                                <div key={item.label} className="mini-card">
                                    <div className="mini-label">{item.label}</div>
                                    <div className="mini-value">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="report-grid two-col">
                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Cash Flow Report</div>
                                <div className="section-subtitle">Operational liquidity view</div>
                            </div>
                        </div>
                        <div className="statement-block compact">
                            <div className="statement-row">
                                <span>Cash Received</span>
                                <strong>{formatCurrency(cashReceived)}</strong>
                            </div>
                            <div className="statement-row">
                                <span>Cash Paid</span>
                                <strong>{formatCurrency(cashPaid)}</strong>
                            </div>
                            <div className="statement-row net-row">
                                <span>Net Movement</span>
                                <strong>{formatCurrency(cashReceived - cashPaid)}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="report-card">
                        <div className="card-hd"><div><div className="card-title">Bank Accounts</div><div className="section-subtitle">Live balances from the database</div></div></div>
                        <div className="statement-block compact">
                            {bankAccounts.map(([bank, balance]) => <div key={bank} className="statement-row"><span>{bank}</span><strong>{formatCurrency(Number(balance))}</strong></div>)}
                            {bankAccounts.length === 0 && <div className="statement-row"><span>No bank accounts configured</span><strong>{formatCurrency(0)}</strong></div>}
                            <div className="statement-row total-row"><span>Total Bank Balance</span><strong>{formatCurrency(totalBankBalance)}</strong></div>
                            <div className="statement-row"><span>Cash Account (Ledger)</span><strong>{formatCurrency(cashAccountBalance)}</strong></div>
                        </div>
                    </div>

                    <div className="report-card ai-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">QUANTIXA Monthly Summary</div>
                                <div className="section-subtitle">CFO intelligence and action plan</div>
                            </div>
                        </div>
                        <div className="ai-panel">
                            <p><strong>Monthly Intelligence</strong></p>
                            <p>{statusMessage}</p>
                            <p>{monthlySales.length} sales, {monthlyExpenses.length} expenses, and {monthlyTransactions.length} bank transactions were loaded for {currentMonth}.</p>
                            <p><strong>Bank balance:</strong> {formatCurrency(totalBankBalance)} across {bankAccounts.length} account{bankAccounts.length === 1 ? '' : 's'}.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
