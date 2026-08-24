'use client'

import { useMemo, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { calculateVAT, triggerAppToast, formatCurrency } from '@/lib/utils'
import { downloadFinancialReportPdf } from '@/lib/export-utils'

const statements = ['Profit & Loss', 'Balance Sheet', 'Cash Flow', 'Trial Balance', 'General Ledger', 'Tax Summary']

export default function AnnualReportPage() {
    const { state } = useAccounting()
    const [reportMode, setReportMode] = useState<'summary' | 'board' | 'tax'>('summary')
    const [selectedStatement, setSelectedStatement] = useState('Profit & Loss')
    const [includeVAT, setIncludeVAT] = useState(false)

    const currentYear = new Date().getUTCFullYear().toString()
    const annualSales = state.sales.filter((sale) => sale.date?.startsWith(currentYear) && sale.status !== 'VOID')
    const annualPurchaseRows = state.purchases.filter((purchase) => purchase.date?.startsWith(currentYear) && purchase.status !== 'VOID')
    const annualExpenseRows = state.expenses.filter((expense) => expense.date?.startsWith(currentYear) && expense.status !== 'VOID')
    const annualBankTransactions = state.bankTxns.filter((txn) => txn.date?.startsWith(currentYear))
    const annualRevenue = annualSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const annualExpenses = annualExpenseRows.reduce((sum, expense) => sum + expense.amount, 0)
    const annualPurchases = annualPurchaseRows.reduce((sum, purchase) => sum + purchase.total, 0)
    const annualNetProfit = annualRevenue - annualPurchases - annualExpenses
    const bankAccounts = Object.entries(state.banks)
    const bankBalance = bankAccounts.reduce((sum, [, balance]) => sum + Number(balance || 0), 0)
    const cashReceived = annualBankTransactions.filter((txn) => Number(txn.amount) > 0).reduce((sum, txn) => sum + Number(txn.amount), 0)
    const cashPaid = annualBankTransactions.filter((txn) => Number(txn.amount) < 0).reduce((sum, txn) => sum + Math.abs(Number(txn.amount)), 0)
    const cashAccount = state.chartOfAccounts.find((account) => account.name.toLowerCase().includes('cash') && !account.name.toLowerCase().includes('bank'))
    const postedEntryIds = new Set(state.journalEntries.filter((entry) => entry.status === 'POSTED' && entry.entryDate?.startsWith(currentYear)).map((entry) => entry.id))
    const cashAccountBalance = cashAccount
        ? Number(cashAccount.openingBalance || 0) + state.journalLines.filter((line) => line.accountId === cashAccount.id && postedEntryIds.has(line.entryId)).reduce((sum, line) => sum + line.debit - line.credit, 0)
        : 0
    const inventoryValue = state.inventory.reduce((sum, item) => sum + item.unitCost * item.closing, 0)
    const loansBalance = state.loans.reduce((sum, loan) => sum + Number(loan.balance ?? loan.amount ?? 0), 0)
    const payablesBalance = state.payables.reduce((sum, item) => sum + Number(item.outstanding_amount ?? item.outstandingAmount ?? item.amount ?? 0), 0)
    const reportVAT = includeVAT ? calculateVAT(annualRevenue) : 0
    const totalAssets = bankBalance + cashAccountBalance + inventoryValue
    const totalLiabilities = loansBalance + payablesBalance
    const transactionCount = annualSales.length + annualPurchaseRows.length + annualExpenseRows.length
    const annualCards = [
        { label: 'Annual Revenue', value: formatCurrency(annualRevenue) },
        { label: 'Annual Expenses', value: formatCurrency(annualExpenses) },
        { label: 'Net Profit', value: formatCurrency(annualNetProfit) },
        { label: 'Purchases', value: formatCurrency(annualPurchases) },
        { label: 'Inventory Value', value: formatCurrency(inventoryValue) },
        { label: 'Transactions', value: String(annualSales.length + annualPurchaseRows.length + annualExpenseRows.length) },
    ]

    const scorecard = [
        ['Revenue Growth', annualRevenue > 0 ? '★★★★★' : '—'],
        ['Profitability', annualNetProfit !== 0 || (annualRevenue > 0 || annualExpenses > 0 || annualPurchases > 0) ? '★★★★★' : '—'],
        ['Cash Management', bankAccounts.length > 0 || cashAccount ? '★★★★☆' : '—'],
        ['Debt Control', '—'],
        ['Inventory Efficiency', state.inventory.length > 0 ? '★★★★★' : '—'],
    ]

    const statementRows = useMemo(() => {
        if (selectedStatement === 'Balance Sheet') return ['Cash', 'Inventory', 'Equipment', 'Loans', 'Payables']
        if (selectedStatement === 'Cash Flow') return ['Operating', 'Investing', 'Financing']
        if (selectedStatement === 'Tax Summary') return ['VAT', 'CIT', 'WHT']
        return ['Revenue', 'Expenses', 'Net Profit', 'Margins']
    }, [selectedStatement])

    const handleAction = (action: string) => {
        triggerAppToast(action, 'The report workflow has been prepared for the current year.')
        if (action === 'Export PDF') {
            void downloadFinancialReportPdf({
                filename: 'annual-report.pdf', reportTitle: 'Annual Report', periodLabel: currentYear,
                highlights: [{ label: 'Revenue', value: formatCurrency(annualRevenue) }, { label: 'Net profit', value: formatCurrency(annualNetProfit) }, { label: 'Total assets', value: formatCurrency(totalAssets) }, { label: 'Cash movement', value: formatCurrency(cashReceived - cashPaid) }],
                sections: [
                    { title: 'Profit and Loss Statement', columns: ['Description', 'Amount'], rows: [['Revenue', annualRevenue], ['Cost of purchases', annualPurchases], ['Operating expenses', annualExpenses], ...(includeVAT ? [['VAT on revenue', reportVAT] as [string, number]] : [])], total: ['Net profit', annualNetProfit] },
                    { title: 'Statement of Financial Position', columns: ['Description', 'Amount'], rows: [['Bank accounts', bankBalance], ['Cash account', cashAccountBalance], ['Inventory', inventoryValue], ['Loans', loansBalance], ['Payables', payablesBalance]], total: ['Net assets', totalAssets - totalLiabilities] },
                    { title: 'Cash Flow Statement', columns: ['Description', 'Amount'], rows: [['Cash received', cashReceived], ['Cash paid', -cashPaid]], total: ['Net movement', cashReceived - cashPaid] },
                    { title: 'Activity Schedule', columns: ['Description', 'Count', 'Amount'], rows: [['Sales', annualSales.length, annualRevenue], ['Purchases', annualPurchaseRows.length, annualPurchases], ['Expenses', annualExpenseRows.length, annualExpenses]], total: ['Total activity', transactionCount, annualRevenue + annualPurchases + annualExpenses] },
                ],
                notes: [`Report mode: ${reportMode}; selected statement: ${selectedStatement}.`, `VAT is ${includeVAT ? 'included in the report calculation.' : 'not included in this export.'}`, 'Amounts are calculated from non-void records in the current accounting year.'],
            })
        }
    }

    return (
        <AppLayout>
            <div className="report-shell">
                <div className="page-header report-header">
                    <div>
                        <div className="pg-title">Annual Reports</div>
                        <div className="pg-subtitle">Complete yearly financial analysis, business growth, and strategic performance.</div>
                    </div>
                    <div className="page-actions">
                        <button className="action-btn primary" type="button" onClick={() => { setReportMode('summary'); handleAction('Generate Annual Report') }}>Generate Annual Report</button>
                        <button className="action-btn secondary" type="button" onClick={() => { setReportMode('board'); handleAction('Board Report') }}>Board Report</button>
                        <button className="action-btn secondary allow-readonly" type="button" onClick={() => handleAction('Export PDF')}>Export PDF</button>
                        <button className="action-btn secondary" type="button" onClick={() => { setReportMode('tax'); handleAction('Tax Package') }}>Tax Package</button>
                        <label><input type="checkbox" checked={includeVAT} onChange={(event) => setIncludeVAT(event.target.checked)} /> Calculate VAT on export</label>
                    </div>
                </div>

                <div className="report-grid report-summary-grid">
                    {annualCards.map((card) => (
                        <div key={card.label} className="metric-card report-card">
                            <div className="metric-label">{card.label}</div>
                            <div className="metric-value">{card.value}</div>
                        </div>
                    ))}
                </div>

                <div className="report-grid two-col">
                    <div className="report-card large-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Year Comparison</div>
                                <div className="section-subtitle">Performance comparison across recent years</div>
                            </div>
                        </div>
                        <div className="chart-placeholder large">
                            <div className="year-bars">
                                <div className="year-pill">Current<br />{formatCurrency(annualRevenue)}</div>
                                <div className="year-pill active">Net Profit<br />{formatCurrency(annualNetProfit)}</div>
                                <div className="year-pill">Transactions<br />{String(annualSales.length + annualPurchaseRows.length + annualExpenseRows.length)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Annual Financial Statements</div>
                                <div className="section-subtitle">Board-level reporting views</div>
                            </div>
                        </div>
                        <div className="statement-block compact">
                            {statements.map((item) => (
                                <div key={item} className={`statement-row ${selectedStatement === item ? 'active' : ''}`} onClick={() => setSelectedStatement(item)} style={{ cursor: 'pointer' }}>
                                    <span>{item}</span>
                                    <strong>{selectedStatement === item ? 'Active' : 'Ready'}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="report-grid two-col">
                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Balance Sheet View</div>
                                <div className="section-subtitle">Assets, liabilities, and equity snapshot</div>
                            </div>
                        </div>
                        <div className="statement-block">
                            <div className="statement-section">
                                <div className="statement-title">Assets</div>
                                <div className="statement-row"><span>Bank Accounts</span><strong>{formatCurrency(bankBalance)}</strong></div>
                                <div className="statement-row"><span>Cash Account (Ledger)</span><strong>{formatCurrency(cashAccountBalance)}</strong></div>
                                <div className="statement-row"><span>Inventory</span><strong>{formatCurrency(inventoryValue)}</strong></div>
                                <div className="statement-row total-row"><span>Total Assets</span><strong>{formatCurrency(bankBalance + cashAccountBalance + inventoryValue)}</strong></div>
                            </div>
                            <div className="statement-section">
                                <div className="statement-title">Liabilities</div>
                                <div className="statement-row"><span>Loans</span><strong>{formatCurrency(loansBalance)}</strong></div>
                                <div className="statement-row"><span>Payables</span><strong>{formatCurrency(payablesBalance)}</strong></div>
                                <div className="statement-row net-row"><span>Equity</span><strong>{formatCurrency(annualNetProfit)}</strong></div>
                            </div>
                        </div>
                    </div>

                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Annual KPI Scorecard</div>
                                <div className="section-subtitle">Executive performance indicators</div>
                            </div>
                        </div>
                        <div className="scorecard-list">
                            {scorecard.map(([label, stars]) => (
                                <div key={label} className="score-row">
                                    <span>{label}</span>
                                    <strong>{stars}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="report-grid two-col">
                    <div className="report-card">
                        <div className="card-hd"><div><div className="card-title">Bank Accounts</div><div className="section-subtitle">Live balances from the database</div></div></div>
                        <div className="statement-block compact">
                            {bankAccounts.map(([bank, balance]) => <div key={bank} className="statement-row"><span>{bank}</span><strong>{formatCurrency(Number(balance))}</strong></div>)}
                            {bankAccounts.length === 0 && <div className="statement-row"><span>No bank accounts configured</span><strong>{formatCurrency(0)}</strong></div>}
                            <div className="statement-row total-row"><span>Total Bank Balance</span><strong>{formatCurrency(bankBalance)}</strong></div>
                            <div className="statement-row"><span>Cash Account (Ledger)</span><strong>{formatCurrency(cashAccountBalance)}</strong></div>
                        </div>
                    </div>
                    <div className="report-card">
                        <div className="card-hd"><div><div className="card-title">Cash Flow</div><div className="section-subtitle">Bank transactions for {currentYear}</div></div></div>
                        <div className="statement-block compact">
                            <div className="statement-row"><span>Cash Received</span><strong>{formatCurrency(cashReceived)}</strong></div>
                            <div className="statement-row"><span>Cash Paid</span><strong>{formatCurrency(cashPaid)}</strong></div>
                            <div className="statement-row net-row"><span>Net Movement</span><strong>{formatCurrency(cashReceived - cashPaid)}</strong></div>
                        </div>
                    </div>
                </div>

                <div className="report-grid two-col">
                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Business Growth Analytics</div>
                                <div className="section-subtitle">Revenue growth, margins, customers, branches</div>
                            </div>
                        </div>
                        <div className="chart-footer">Revenue Growth • Profit Margin • Customer Growth • Branch Performance</div>
                        <div className="statement-block compact" style={{ marginTop: 12 }}>
                            {statementRows.map((row) => (
                                <div key={row} className="statement-row">
                                    <span>{row}</span>
                                    <strong>{row === 'Margins' ? formatCurrency(annualRevenue > 0 ? (annualNetProfit / annualRevenue) * 100 : 0) + '%' : row === 'Revenue' ? formatCurrency(annualRevenue) : row === 'Expenses' ? formatCurrency(annualExpenses) : row === 'Net Profit' ? formatCurrency(annualNetProfit) : '—'}</strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="report-card ai-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">QUANTIXA Annual Review</div>
                                <div className="section-subtitle">Board-ready strategic insight</div>
                            </div>
                        </div>
                        <div className="ai-panel">
                            <p><strong>Business Review</strong></p>
                            <p>{annualRevenue > 0 ? 'Revenue data is available from the database.' : 'No revenue records are present yet.'}</p>
                            <p>{annualExpenses > 0 ? 'Expense data is available from the database.' : 'No expense records are present yet.'}</p>
                            <p><strong>Bank position:</strong> {formatCurrency(bankBalance)} across {bankAccounts.length} account{bankAccounts.length === 1 ? '' : 's'}.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
