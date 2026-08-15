'use client'

import { useMemo, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { downloadExcel, downloadPdf } from '@/lib/export-utils'
import { formatCurrency, triggerAppToast } from '@/lib/utils'

const expenseCategories = ['Salary', 'Rent', 'Fuel', 'Marketing', 'Utilities', 'Operations']

export default function MonthlyReportPage() {
    const { state } = useAccounting()
    const [activeRange, setActiveRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly')
    const [statusMessage, setStatusMessage] = useState('Report generated for the current month.')

    const totalRevenue = useMemo(() => state.sales.reduce((sum, sale) => sum + sale.totalAmount, 0), [state.sales])
    const totalExpenses = useMemo(() => state.expenses.reduce((sum, expense) => sum + expense.amount, 0), [state.expenses])
    const netProfit = totalRevenue - totalExpenses
    const totalPurchases = useMemo(() => state.purchases.reduce((sum, purchase) => sum + purchase.total, 0), [state.purchases])
    const inventoryValue = useMemo(() => state.inventory.reduce((sum, item) => sum + item.unitCost * item.closing, 0), [state.inventory])

    const overviewCards = [
        { label: 'Total Revenue', value: formatCurrency(totalRevenue), change: 'Database-backed' },
        { label: 'Total Expenses', value: formatCurrency(totalExpenses), change: 'Database-backed' },
        { label: 'Net Profit', value: formatCurrency(netProfit), change: 'Database-backed' },
        { label: 'Purchases', value: formatCurrency(totalPurchases), change: 'Database-backed' },
        { label: 'Transactions', value: String(state.sales.length + state.purchases.length + state.expenses.length), change: 'Database-backed' },
        { label: 'Inventory Value', value: formatCurrency(inventoryValue), change: 'Database-backed' },
    ]

    const pAndL = [
        { label: 'Sales Revenue', amount: formatCurrency(totalRevenue) },
        { label: 'Purchases', amount: formatCurrency(totalPurchases) },
        { label: 'Expenses', amount: formatCurrency(totalExpenses) },
    ]

    const salesCards = [
        { label: 'Total Sales', value: formatCurrency(totalRevenue) },
        { label: 'Orders', value: String(state.sales.length) },
        { label: 'Average Order Value', value: state.sales.length > 0 ? formatCurrency(totalRevenue / state.sales.length) : formatCurrency(0) },
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
            downloadPdf(
                `monthly-report-${activeRange.toLowerCase()}.pdf`,
                'Monthly Report',
                [{ action, range: activeRange }],
                'QUANTIXA'
            )
        }

        if (action === 'Export Excel') {
            downloadExcel(`monthly-report-${activeRange.toLowerCase()}.xlsx`, [{ action, range: activeRange }])
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
                                {pAndL.slice(0, 2).map((row) => (
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
                                {pAndL.slice(2).map((row) => (
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
                                <strong>₦60M</strong>
                            </div>
                            <div className="statement-row">
                                <span>Cash Paid</span>
                                <strong>₦35M</strong>
                            </div>
                            <div className="statement-row net-row">
                                <span>Net Movement</span>
                                <strong>₦25M</strong>
                            </div>
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
                            <p>Your revenue increased 18%.</p>
                            <p><strong>Main growth driver:</strong> Electronics category.</p>
                            <p><strong>Warning:</strong> Fuel expenses increased 22%.</p>
                            <p><strong>Recommendation:</strong> Review transport costs.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
