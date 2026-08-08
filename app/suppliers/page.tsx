'use client'

import { useMemo, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { downloadExcel } from '@/lib/export-utils'
import { triggerAppToast } from '@/lib/utils'

const summaryCards = [
    { label: 'Total Suppliers', value: '268', tone: 'royal' },
    { label: 'Active Suppliers', value: '241', tone: 'green' },
    { label: 'Outstanding Balance', value: '₦18.4M', tone: 'amber' },
    { label: 'Avg. Payment Time', value: '24 Days', tone: 'blue' },
    { label: 'Avg. Rating', value: '4.8★', tone: 'green' },
    { label: 'Suspended', value: '27', tone: 'amber' },
]

const suppliers = [
    { name: 'Dangote Cement', category: 'Building Materials', balance: '₦4.8M', status: 'Active', rating: '4.9', terms: 'Net 30' },
    { name: 'ABC Supplies', category: 'Office & Stationery', balance: '₦1.2M', status: 'Pending', rating: '4.2', terms: 'Net 15' },
    { name: 'Global Foods', category: 'Food & Beverage', balance: '₦980K', status: 'Review', rating: '4.7', terms: 'Net 45' },
    { name: 'Northstar Logistics', category: 'Transport', balance: '₦2.6M', status: 'Active', rating: '4.5', terms: 'Net 30' },
]

export default function SuppliersPage() {
    const [selectedSupplier, setSelectedSupplier] = useState(suppliers[0])
    const [searchTerm, setSearchTerm] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    const filteredSuppliers = useMemo(() => {
        const query = searchTerm.toLowerCase()
        return suppliers.filter((supplier) => !query || [supplier.name, supplier.category, supplier.status].join(' ').toLowerCase().includes(query))
    }, [searchTerm])

    const handleAction = (action: string) => {
        triggerAppToast(action, 'The supplier workflow has been activated.')
        if (action === 'Export') {
            downloadExcel('suppliers-export.xlsx', filteredSuppliers)
        }
    }

    return (
        <AppLayout>
            <div className="page-shell">
                <div className="page-hero">
                    <div>
                        <div className="eyebrow">Supplier Management Center</div>
                        <h1 className="page-title">Suppliers</h1>
                        <p className="page-subtitle">Manage supplier relationships, purchase history, balances, and supply performance in one calm workspace.</p>
                    </div>
                    <div className="page-actions">
                        <button className="action-btn primary" onClick={() => handleAction('+ New Supplier')}>+ New Supplier</button>
                        <button className="action-btn" onClick={() => handleAction('Import')}>Import</button>
                        <button className="action-btn" onClick={() => handleAction('Export')}>Export</button>
                    </div>
                </div>

                <div className="ai-insight">
                    <div>
                        <span className="ai-badge">AURA AI Insight</span>
                        <h3>Three suppliers account for 62% of your monthly purchases. Consider diversifying to reduce supply risk.</h3>
                    </div>
                    <div className="ai-pill">Supply Risk</div>
                </div>

                <div className="metric-grid">
                    {summaryCards.map((card) => (
                        <div className={`metric-card ${card.tone}`} key={card.label}>
                            <div className="metric-label">{card.label}</div>
                            <div className="metric-value">{card.value}</div>
                        </div>
                    ))}
                </div>

                <div className="panel-card">
                    <div className="panel-head">
                        <div>
                            <div className="panel-title">Supplier directory</div>
                            <div className="panel-subtitle">Search and filter by region, status, category, or credit posture.</div>
                        </div>
                        <button className="btn btn-secondary" type="button" onClick={() => setShowFilters((prev) => !prev)}>{showFilters ? 'Hide Filters' : 'Show Filters'}</button>
                    </div>

                    {showFilters && (
                        <div className="filter-row">
                            <input className="search-box" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="🔍 Search supplier name, category, or status..." />
                            <div className="filter-pills">
                                <span className="pill">Category</span>
                                <span className="pill">Branch</span>
                                <span className="pill">Payment Terms</span>
                                <span className="pill">Status</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="content-grid">
                    <div className="panel-card">
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Supplier</th>
                                        <th>Category</th>
                                        <th>Balance</th>
                                        <th>Status</th>
                                        <th>Rating</th>
                                        <th>Terms</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSuppliers.map((supplier) => (
                                        <tr key={supplier.name} onClick={() => setSelectedSupplier(supplier)} style={{ cursor: 'pointer' }}>
                                            <td>
                                                <div className="table-strong">{supplier.name}</div>
                                                <div className="table-muted">{supplier.category}</div>
                                            </td>
                                            <td>{supplier.category}</td>
                                            <td>{supplier.balance}</td>
                                            <td><span className="status-pill active">{supplier.status}</span></td>
                                            <td>{supplier.rating} ★</td>
                                            <td>{supplier.terms}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="side-panel">
                        <div className="profile-card">
                            <div className="profile-header">
                                <div>
                                    <div className="eyebrow">Supplier Profile</div>
                                    <h3>{selectedSupplier.name}</h3>
                                </div>
                                <span className="status-pill active">{selectedSupplier.status}</span>
                            </div>
                            <div className="profile-body">
                                <div className="profile-row"><span className="profile-label">Supplier ID</span><span>{selectedSupplier.name.toUpperCase().slice(0, 3)}-014</span></div>
                                <div className="profile-row"><span className="profile-label">Category</span><span>{selectedSupplier.category}</span></div>
                                <div className="profile-row"><span className="profile-label">Outstanding</span><span>{selectedSupplier.balance}</span></div>
                                <div className="profile-row"><span className="profile-label">Terms</span><span>{selectedSupplier.terms}</span></div>
                                <div className="profile-row"><span className="profile-label">Rating</span><span>{selectedSupplier.rating} ★</span></div>
                            </div>
                        </div>
                        <div className="mini-card">
                            <div className="mini-label">Key note</div>
                            <div className="mini-value">On-time delivery performance is holding at 96% this quarter.</div>
                        </div>
                    </div>
                </div>

                <div className="panel-card">
                    <div className="panel-head">
                        <div>
                            <div className="panel-title">Performance analytics</div>
                            <div className="panel-subtitle">A lighter view of supplier concentration and quality trends.</div>
                        </div>
                    </div>
                    <div className="analytics-grid">
                        <div className="mini-chart">
                            <div className="bar-stack">
                                <div className="bar-col"><div className="bar-fill tall"></div><span>Jan</span></div>
                                <div className="bar-col"><div className="bar-fill"></div><span>Feb</span></div>
                                <div className="bar-col"><div className="bar-fill tall"></div><span>Mar</span></div>
                                <div className="bar-col"><div className="bar-fill mid"></div><span>Apr</span></div>
                                <div className="bar-col"><div className="bar-fill tall"></div><span>May</span></div>
                            </div>
                        </div>
                        <div className="mini-card">
                            <div className="mini-label">Top suppliers</div>
                            <div className="mini-value">Dangote Cement • Global Foods • Northstar Logistics</div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
