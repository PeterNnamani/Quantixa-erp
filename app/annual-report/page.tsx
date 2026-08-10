'use client'

import { useMemo, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { triggerAppToast, formatCurrency } from '@/lib/utils'
import { downloadPdf } from '@/lib/export-utils'

const statements = ['Profit & Loss', 'Balance Sheet', 'Cash Flow', 'Trial Balance', 'General Ledger', 'Tax Summary']

export default function AnnualReportPage() {
    const { state } = useAccounting()
    const [reportMode, setReportMode] = useState<'summary' | 'board' | 'tax'>('summary')
    const [selectedStatement, setSelectedStatement] = useState('Profit & Loss')

    const annualRevenue = state.sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const annualExpenses = state.expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const annualPurchases = state.purchases.reduce((sum, purchase) => sum + purchase.total, 0)
    const annualNetProfit = annualRevenue - annualPurchases - annualExpenses
    const annualCards = [
        { label: 'Annual Revenue', value: formatCurrency(annualRevenue) },
        { label: 'Annual Expenses', value: formatCurrency(annualExpenses) },
        { label: 'Net Profit', value: formatCurrency(annualNetProfit) },
        { label: 'Purchases', value: formatCurrency(annualPurchases) },
        { label: 'Inventory Value', value: formatCurrency(state.inventory.reduce((sum, item) => sum + item.unitCost * item.closing, 0)) },
        { label: 'Transactions', value: String(state.sales.length + state.purchases.length + state.expenses.length) },
    ]

    const scorecard = [
        ['Revenue Growth', annualRevenue > 0 ? '★★★★★' : '—'],
        ['Profitability', annualNetProfit !== 0 || (annualRevenue > 0 || annualExpenses > 0 || annualPurchases > 0) ? '★★★★★' : '—'],
        ['Cash Management', state.banks && Object.keys(state.banks).length > 0 ? '★★★★☆' : '—'],
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
            downloadPdf(
                'annual-report.pdf',
                'Annual Report',
                [{ reportType: 'annual', mode: reportMode, selectedStatement }],
                'QUANTIXA'
            )
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
                        <button className="action-btn secondary" type="button" onClick={() => handleAction('Export PDF')}>Export PDF</button>
                        <button className="action-btn secondary" type="button" onClick={() => { setReportMode('tax'); handleAction('Tax Package') }}>Tax Package</button>
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
                                <div className="year-pill">Transactions<br />{String(state.sales.length + state.purchases.length + state.expenses.length)}</div>
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
                                <div className="statement-row"><span>Cash</span><strong>{formatCurrency(Object.values(state.banks).reduce((sum, balance) => sum + balance, 0))}</strong></div>
                                <div className="statement-row"><span>Inventory</span><strong>{formatCurrency(state.inventory.reduce((sum, item) => sum + item.unitCost * item.closing, 0))}</strong></div>
                                <div className="statement-row"><span>Transactions</span><strong>{String(state.sales.length + state.purchases.length + state.expenses.length)}</strong></div>
                                <div className="statement-row total-row"><span>Total Assets</span><strong>{formatCurrency(Object.values(state.banks).reduce((sum, balance) => sum + balance, 0) + state.inventory.reduce((sum, item) => sum + item.unitCost * item.closing, 0))}</strong></div>
                            </div>
                            <div className="statement-section">
                                <div className="statement-title">Liabilities</div>
                                <div className="statement-row"><span>Loans</span><strong>{formatCurrency(0)}</strong></div>
                                <div className="statement-row"><span>Payables</span><strong>{formatCurrency(0)}</strong></div>
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
                                    <strong>{row === 'Margins' ? '0%' : 'Ready'}</strong>
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
                            <p><strong>Recommendation:</strong> Add accounting records to populate this report.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
