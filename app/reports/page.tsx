'use client'

import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { formatCurrency } from '@/lib/utils'

export default function ReportsPage() {
  const { state } = useAccounting()

  const totalSales = state.sales.filter(s => s.status !== 'VOID').reduce((sum, s) => sum + s.totalAmount, 0)
  const totalPurchases = state.purchases.filter(p => p.status !== 'VOID').reduce((sum, p) => sum + p.total, 0)
  const totalExpenses = state.expenses.filter(e => e.status !== 'VOID').reduce((sum, e) => sum + e.amount, 0)
  const totalBanks = Object.values(state.banks).reduce((sum, b) => sum + b, 0)
  const grossProfit = totalSales - totalPurchases
  const netProfit = grossProfit - totalExpenses

  return (
    <AppLayout>
      <div>
        <div className="pg-hd">
          <div>
            <div className="pg-title">Financial Reports</div>
            <div className="pg-subtitle">Income statement and key metrics</div>
          </div>
        </div>

        {/* Income Statement */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-hd">
            <div className="card-title">Income Statement</div>
          </div>
          <table>
            <tbody>
              <tr style={{ fontWeight: 700, backgroundColor: 'var(--green-bg)', color: 'var(--green-text)' }}>
                <td>Sales Revenue</td>
                <td className="td-r">{formatCurrency(totalSales)}</td>
              </tr>
              <tr style={{ fontWeight: 700, backgroundColor: 'var(--red-bg)', color: 'var(--red-text)' }}>
                <td>Cost of Purchases</td>
                <td className="td-r">({formatCurrency(totalPurchases)})</td>
              </tr>
              <tr style={{ fontWeight: 700, backgroundColor: 'var(--blue-bg)' }}>
                <td>Gross Profit</td>
                <td className="td-r" style={{ color: 'var(--green-dark)' }}>{formatCurrency(grossProfit)}</td>
              </tr>
              <tr style={{ fontWeight: 700, backgroundColor: 'var(--red-bg)', color: 'var(--red-text)' }}>
                <td>Operating Expenses</td>
                <td className="td-r">({formatCurrency(totalExpenses)})</td>
              </tr>
              <tr style={{ fontWeight: 800, backgroundColor: 'var(--gold-light)', padding: '12px', fontSize: '14px' }}>
                <td>NET PROFIT</td>
                <td className="td-r" style={{ color: netProfit >= 0 ? 'var(--green-dark)' : 'var(--red)' }}>
                  {formatCurrency(netProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div className="metric-card">
            <div className="metric-label">Total Sales</div>
            <div className="metric-value pos">{formatCurrency(totalSales)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Purchases</div>
            <div className="metric-value">{formatCurrency(totalPurchases)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Expenses</div>
            <div className="metric-value neg">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="metric-card" style={{ borderTop: '3px solid var(--green)' }}>
            <div className="metric-label">Bank Balance</div>
            <div className="metric-value pos">{formatCurrency(totalBanks)}</div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
