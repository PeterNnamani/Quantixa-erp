'use client'

import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { formatCurrency, formatCurrencyOrZero, formatNumber, triggerAppToast } from '@/lib/utils'
import { downloadExcel } from '@/lib/export-utils'

const fixedAssetCategories = ['Assets', 'Furniture', 'Electronics']

type AssetRow = {
    id: string
    name: string
    category: string
    purchaseDate: string
    cost: string
    depreciation: string
    bookValue: string
    status: string
    supplier: string
    branch: string
    paymentMethod: string
}

export default function AssetSchedulePage() {
    const { state } = useAccounting()
    const assetPurchases = useMemo(
        () => state.purchases.filter((purchase) => fixedAssetCategories.includes(purchase.category)),
        [state.purchases]
    )

    const maintenanceCount = useMemo(
        () => state.purchases.filter((purchase) => purchase.category === 'Maintenance' && purchase.status !== 'VOID').length,
        [state.purchases]
    )

    const disposedCount = useMemo(
        () => assetPurchases.filter((purchase) => purchase.status === 'Returned' || purchase.status === 'VOID').length,
        [assetPurchases]
    )

    const activeAssetsCount = useMemo(
        () => assetPurchases.filter((purchase) => purchase.status !== 'Returned' && purchase.status !== 'VOID').length,
        [assetPurchases]
    )

    const totalAssetValue = useMemo(
        () => assetPurchases.reduce((sum, purchase) => sum + (purchase.total || 0), 0),
        [assetPurchases]
    )

    const accumulatedDepreciation = 0
    const currentBookValue = Math.max(0, totalAssetValue - accumulatedDepreciation)

    const assetCategoryCounts = useMemo(
        () => {
            const counts = assetPurchases.reduce<Record<string, number>>((acc, purchase) => {
                acc[purchase.category] = (acc[purchase.category] || 0) + 1
                return acc
            }, {})

            return fixedAssetCategories.map((name) => ({ name, count: counts[name] ?? 0 }))
        },
        [assetPurchases]
    )

    const assetRows = useMemo<AssetRow[]>(
        () =>
            assetPurchases.map((purchase) => ({
                id: purchase.id,
                name: purchase.product,
                category: purchase.category,
                purchaseDate: purchase.date,
                cost: formatCurrency(purchase.total || 0),
                depreciation: formatCurrencyOrZero(0),
                bookValue: formatCurrencyOrZero(purchase.total || 0),
                status: purchase.status || 'Unknown',
                supplier: purchase.supplier,
                branch: purchase.branch || 'Head Office',
                paymentMethod: purchase.paymentMethod || 'Cash',
            }))
        ,
        [assetPurchases]
    )

    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(assetRows[0]?.id ?? null)
    const [assetMode, setAssetMode] = useState<'view' | 'add' | 'transfer' | 'dispose' | 'depreciation'>('view')

    useEffect(() => {
        if (!selectedAssetId && assetRows.length > 0) {
            setSelectedAssetId(assetRows[0].id)
        }
    }, [assetRows, selectedAssetId])

    const selectedAsset = assetRows.find((asset) => asset.id === selectedAssetId) || assetRows[0] || null

    const detailRows = useMemo(
        () =>
            selectedAsset
                ? [
                    { label: 'Asset ID', value: selectedAsset.id },
                    { label: 'Category', value: selectedAsset.category },
                    { label: 'Purchase Date', value: selectedAsset.purchaseDate },
                    { label: 'Purchase Cost', value: selectedAsset.cost },
                    { label: 'Current Value', value: selectedAsset.bookValue },
                    { label: 'Assigned Branch', value: selectedAsset.branch },
                    { label: 'Supplier', value: selectedAsset.supplier },
                    { label: 'Payment Method', value: selectedAsset.paymentMethod },
                ]
                : [],
        [selectedAsset]
    )

    const assetCards = [
        { label: 'Total Asset Value', value: formatCurrency(totalAssetValue) },
        { label: 'Current Book Value', value: formatCurrency(currentBookValue) },
        { label: 'Accumulated Depreciation', value: formatCurrency(accumulatedDepreciation) },
        { label: 'Active Assets', value: formatNumber(activeAssetsCount) },
        { label: 'Assets Due Maintenance', value: formatNumber(maintenanceCount) },
        { label: 'Disposed Assets', value: formatNumber(disposedCount) },
    ]

    const handleAction = (action: string) => {
        triggerAppToast(action, 'The asset workflow has been prepared for the current register.')
        if (action === 'Export Register' && selectedAsset) {
            downloadExcel('asset-schedule-register.xlsx', [{ action, ...selectedAsset }])
        }
    }

    return (
        <AppLayout>
            <div className="report-shell">
                <div className="page-header report-header">
                    <div>
                        <div className="pg-title">Asset Schedule</div>
                        <div className="pg-subtitle">Manage fixed assets, depreciation, maintenance, and asset lifecycle.</div>
                    </div>
                    <div className="page-actions">
                        <button className="action-btn primary" type="button" onClick={() => { setAssetMode('add'); handleAction('+ Add Asset') }}>+ Add Asset</button>
                        <button className="action-btn secondary" type="button" onClick={() => { setAssetMode('transfer'); handleAction('Transfer Asset') }}>Transfer Asset</button>
                        <button className="action-btn secondary" type="button" onClick={() => { setAssetMode('dispose'); handleAction('Dispose Asset') }}>Dispose Asset</button>
                        <button className="action-btn secondary" type="button" onClick={() => { setAssetMode('depreciation'); handleAction('Run Depreciation') }}>Run Depreciation</button>
                        <button className="action-btn secondary" type="button" onClick={() => handleAction('Export Register')}>Export Register</button>
                    </div>
                    <div className="asset-mode-banner">Current workflow mode: {assetMode}</div>
                </div>

                <div className="report-grid report-summary-grid">
                    {assetCards.map((card) => (
                        <div key={card.label} className="metric-card report-card">
                            <div className="metric-label">{card.label}</div>
                            <div className="metric-value">{card.value}</div>
                        </div>
                    ))}
                </div>

                <div className="report-grid two-col">
                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Asset Categories</div>
                                <div className="section-subtitle">Current fixed asset mix</div>
                            </div>
                        </div>
                        <div className="asset-category-grid">
                            {assetCategoryCounts.map((item) => (
                                <div key={item.name} className="asset-category-card">
                                    <div className="asset-category-name">{item.name}</div>
                                    <div className="asset-category-count">{item.count}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Asset Detail Panel</div>
                                <div className="section-subtitle">{selectedAsset ? selectedAsset.name : 'No asset selected'}</div>
                            </div>
                        </div>
                        <div className="statement-block compact">
                            {detailRows.map((row) => (
                                <div key={row.label} className="statement-row">
                                    <span>{row.label}</span>
                                    <strong>{row.value}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="report-card">
                    <div className="card-hd">
                        <div>
                            <div className="card-title">Asset Table</div>
                            <div className="section-subtitle">Main fixed asset register</div>
                        </div>
                    </div>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Asset ID</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Purchase Date</th>
                                    <th>Cost</th>
                                    <th>Depreciation</th>
                                    <th>Book Value</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assetRows.map((asset) => (
                                    <tr key={asset.id} onClick={() => setSelectedAssetId(asset.id)} style={{ cursor: 'pointer' }}>
                                        <td>{asset.id}</td>
                                        <td>{asset.name}</td>
                                        <td>{asset.category}</td>
                                        <td>{asset.purchaseDate}</td>
                                        <td>{asset.cost}</td>
                                        <td>{asset.depreciation}</td>
                                        <td>{asset.bookValue}</td>
                                        <td>{asset.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="report-grid two-col">
                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Depreciation Schedule</div>
                                <div className="section-subtitle">Accounting control over asset value</div>
                            </div>
                        </div>
                        <div className="statement-block compact">
                            <div className="statement-row"><span>Recorded schedules</span><strong>None</strong></div>
                            <div className="statement-row net-row"><span>Accumulated Depreciation</span><strong>{formatCurrency(accumulatedDepreciation)}</strong></div>
                        </div>
                    </div>

                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Asset Maintenance</div>
                                <div className="section-subtitle">Upcoming service and repairs</div>
                            </div>
                        </div>
                        <div className="statement-block compact">
                            <div className="statement-row"><span>Maintenance records</span><strong>{maintenanceCount}</strong></div>
                        </div>
                    </div>
                </div>

                <div className="report-grid two-col">
                    <div className="report-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">Asset Disposal</div>
                                <div className="section-subtitle">Manage sold or damaged assets</div>
                            </div>
                        </div>
                        <div className="statement-block compact">
                            <div className="statement-row"><span>Disposed assets</span><strong>{disposedCount}</strong></div>
                        </div>
                    </div>

                    <div className="report-card ai-card">
                        <div className="card-hd">
                            <div>
                                <div className="card-title">QUANTIXA Asset Intelligence</div>
                                <div className="section-subtitle">Asset lifecycle insight</div>
                            </div>
                        </div>
                        <div className="ai-panel">
                            <p>No asset intelligence is available from the current register.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
