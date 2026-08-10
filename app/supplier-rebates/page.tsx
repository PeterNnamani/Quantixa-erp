'use client'

import AppLayout from '@/components/layout/app-layout'
import { useMemo, useState } from 'react'
import { formatCurrency, triggerAppToast } from '@/lib/utils'
import { downloadExcel } from '@/lib/export-utils'

const rebateSummary = [
    { label: 'Total Rebates Earned', value: formatCurrency(0), subtitle: 'This Year', tone: 'info' },
    { label: 'Pending Rebates', value: formatCurrency(0), subtitle: 'Awaiting Settlement', tone: 'warning' },
    { label: 'Received Rebates', value: formatCurrency(0), subtitle: 'Completed', tone: 'success' },
    { label: 'Active Agreements', value: formatCurrency(0), subtitle: 'Suppliers', tone: 'purple' },
    { label: 'Expiring Soon', value: '0', subtitle: 'Agreements', tone: 'amber' },
    { label: 'Average Rebate Rate', value: '0%', subtitle: '', tone: 'info' },
]

const agreementCards = []
const rebateTypes = []
const rebateTable = []
const defaultAgreement = {
    supplier: 'No supplier selected',
    title: 'No agreement selected',
    period: '—',
    target: formatCurrency(0),
    current: formatCurrency(0),
    progress: 0,
    rebate: formatCurrency(0),
    status: 'Inactive',
    tone: 'info',
}
const timelineEntries = [
    { date: 'Pending', note: 'Rebate activity will appear here once records are available.', amount: '' },
]

export default function SupplierRebatesPage() {
    const [selectedSupplier, setSelectedSupplier] = useState('All Suppliers')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedAgreement, setSelectedAgreement] = useState(defaultAgreement)

    const filteredAgreements = useMemo(() => {
        const query = searchTerm.toLowerCase()
        return rebateTable.filter((row) => {
            return (
                (!query || [row.supplier, row.agreement, row.period, row.status].join(' ').toLowerCase().includes(query)) &&
                (selectedSupplier === 'All Suppliers' || row.supplier === selectedSupplier)
            )
        })
    }, [searchTerm, selectedSupplier])

    const topSupplier = rebateTable.length > 0 ? rebateTable[0] : defaultAgreement

    const handleAction = (action: string) => {
        triggerAppToast(action, 'The rebate workflow has been prepared for the current cycle.')
        if (action === 'Export') {
            downloadExcel('supplier-rebates-export.xlsx', filteredAgreements)
        }
    }

    return (
        <AppLayout>
            <div className="supplier-rebates-shell">
                <div className="supplier-rebates-header">
                    <div>
                        <div className="pg-title">Supplier Rebates</div>
                        <div className="pg-subtitle">Manage supplier incentives, volume discounts, promotional rewards, and rebate settlements.</div>
                    </div>
                    <div className="supplier-rebates-actions">
                        <button type="button" className="page-btn primary" onClick={() => handleAction('+ Create Rebate Agreement')}>+ Create Rebate Agreement</button>
                        <button type="button" className="page-btn secondary" onClick={() => handleAction('+ Record Rebate Claim')}>+ Record Rebate Claim</button>
                        <button type="button" className="page-btn secondary" onClick={() => handleAction('Calculate Rebates')}>Calculate Rebates</button>
                        <button type="button" className="page-btn secondary" onClick={() => handleAction('Export')}>Export</button>
                        <button type="button" className="page-btn secondary" onClick={() => handleAction('Reports')}>Reports</button>
                    </div>
                </div>

                <div className="supplier-rebates-summary-grid">
                    {rebateSummary.map((card) => (
                        <div key={card.label} className={`summary-card ${card.tone}`}>
                            <div className="summary-label">{card.label}</div>
                            <div className="summary-value">{card.value}</div>
                            {card.subtitle && <div className="summary-subtitle">{card.subtitle}</div>}
                        </div>
                    ))}
                </div>

                <div className="supplier-rebates-main-grid">
                    <div className="supplier-rebates-left">
                        <div className="card">
                            <div className="card-hd">
                                <div>
                                    <div className="card-title">Active Rebate Agreements</div>
                                    <div className="section-subtitle">Track performance, progress, and expected rebate outcomes.</div>
                                </div>
                            </div>
                            <div className="agreement-card-grid">
                                {agreementCards.length > 0 ? agreementCards.map((agreement) => (
                                    <div key={agreement.supplier} className="agreement-card" onClick={() => setSelectedAgreement(agreement)} style={{ cursor: 'pointer' }}>
                                        <div className="agreement-card-top">
                                            <strong>{agreement.supplier}</strong>
                                            <span className={`status-pill ${agreement.tone}`}>{agreement.status}</span>
                                        </div>
                                        <div className="agreement-title">{agreement.title}</div>
                                        <div className="agreement-row"><span>Period</span><strong>{agreement.period}</strong></div>
                                        <div className="agreement-row"><span>Target</span><strong>{agreement.target}</strong></div>
                                        <div className="agreement-row"><span>Current Purchase</span><strong>{agreement.current}</strong></div>
                                        <div className="agreement-progress-bar">
                                            <div className="agreement-progress-fill" style={{ width: `${agreement.progress}%` }} />
                                        </div>
                                        <div className="agreement-footer">
                                            <span>{agreement.progress}%</span>
                                            <strong>{agreement.rebate}</strong>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="agreement-card" style={{ padding: '24px', textAlign: 'center' }}>
                                        <div className="agreement-title">No active rebate agreements</div>
                                        <p style={{ marginTop: '10px', color: 'var(--text2)' }}>Create a rebate agreement to start tracking supplier incentives here.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-hd">
                                <div>
                                    <div className="card-title">Rebate Types</div>
                                    <div className="section-subtitle">Create and manage different rebate rule structures.</div>
                                </div>
                            </div>
                            <div className="rebate-types-grid">
                                {rebateTypes.length > 0 ? rebateTypes.map((item) => (
                                    <div key={item.title} className="rebate-type-card">
                                        <strong>{item.title}</strong>
                                        <p>{item.description}</p>
                                    </div>
                                )) : (
                                    <div className="agreement-card" style={{ padding: '24px', textAlign: 'center' }}>
                                        <div className="agreement-title">No rebate types available</div>
                                        <p style={{ marginTop: '10px', color: 'var(--text2)' }}>Add rebate rules to define incentive programs.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-hd">
                                <div>
                                    <div className="card-title">Rebate Tracking Table</div>
                                    <div className="section-subtitle">Supplier agreements, targets, achievements, and status.</div>
                                </div>
                            </div>
                            <div className="tbl-wrap">
                                <table className="rebate-table">
                                    <thead>
                                        <tr>
                                            <th>Supplier</th>
                                            <th>Agreement</th>
                                            <th>Period</th>
                                            <th>Target</th>
                                            <th>Achieved</th>
                                            <th>Rebate</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAgreements.length > 0 ? filteredAgreements.map((row) => (
                                            <tr key={`${row.supplier}-${row.agreement}`}>
                                                <td>{row.supplier}</td>
                                                <td>{row.agreement}</td>
                                                <td>{row.period}</td>
                                                <td>{row.target}</td>
                                                <td>{row.achieved}</td>
                                                <td>{row.rebate}</td>
                                                <td>{row.status}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={7} style={{ padding: '22px 14px', color: 'var(--text2)', textAlign: 'center' }}>
                                                    No rebate agreement records available.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="supplier-rebates-right">
                        <div className="card">
                            <div className="card-hd">
                                <div>
                                    <div className="card-title">Supplier Rebate Details</div>
                                    <div className="section-subtitle">Selected agreement performance and remaining targets.</div>
                                </div>
                            </div>
                            <div className="detail-panel">
                                <div className="detail-row"><span>{selectedAgreement.supplier}</span><strong>{selectedAgreement.rebate}</strong></div>
                                <div className="detail-row"><span>Purchase Achievement</span><strong>{selectedAgreement.progress}%</strong></div>
                                <div className="detail-row"><span>Target</span><strong>{selectedAgreement.target}</strong></div>
                                <div className="detail-row"><span>Current</span><strong>{selectedAgreement.current}</strong></div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-hd">
                                <div>
                                    <div className="card-title">Rebate Timeline</div>
                                    <div className="section-subtitle">Recent milestones and settlement updates.</div>
                                </div>
                            </div>
                            <div className="timeline-list">
                                {timelineEntries.map((entry) => (
                                    <div key={entry.date} className="timeline-entry">
                                        <strong>{entry.date}</strong>
                                        <p>{entry.note}</p>
                                        {entry.amount && <span>{entry.amount}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-hd">
                                <div>
                                    <div className="card-title">QUANTIXA Rebate Intelligence</div>
                                    <div className="section-subtitle">QUANTIXA recommendations for rebate performance.</div>
                                </div>
                            </div>
                            <div className="ai-insight">
                                <p>Rebate insights will appear once supplier agreement records and claim activity are available.</p>
                            </div>
                            <div className="ai-insight warning">
                                <p>No rebate performance data is currently available to display.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
