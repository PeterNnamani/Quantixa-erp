'use client'

import { useMemo, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { formatCurrency, formatNumber, triggerAppToast } from '@/lib/utils'
import { downloadExcel } from '@/lib/export-utils'

export default function InventoryPage() {
  const { state, updateState, addAuditLog } = useAccounting()
  const [search, setSearch] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('Main Warehouse')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedStatus, setSelectedStatus] = useState('All Status')
  const [selectedRow, setSelectedRow] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const inventoryRows = useMemo(() => {
    return state.inventory.map((item, index) => ({
      id: `SKU-${index + 1}`,
      product: item.product,
      category: item.dept || 'Uncategorized',
      warehouse: 'Main Warehouse',
      available: item.closing,
      reserved: Math.max(0, Math.floor(item.closing * 0.08)),
      reorderLevel: Math.max(5, Math.floor((item.closing || 0) * 0.2)),
      unitCost: item.unitCost,
      stockValue: item.closing * item.unitCost,
      status: item.closing <= 0 ? 'Out of Stock' : item.closing <= 10 ? 'Low Stock' : 'In Stock',
    }))
  }, [state.inventory])

  const filteredRows = useMemo(() => {
    const query = search.toLowerCase()
    return inventoryRows.filter((row) => {
      const matchesQuery = !query || [row.product, row.category, row.id].join(' ').toLowerCase().includes(query)
      const matchesWarehouse = selectedWarehouse === 'All Warehouses' || row.warehouse === selectedWarehouse
      const matchesCategory = selectedCategory === 'All Categories' || row.category === selectedCategory
      const matchesStatus = selectedStatus === 'All Status' || row.status === selectedStatus
      return matchesQuery && matchesWarehouse && matchesCategory && matchesStatus
    })
  }, [inventoryRows, search, selectedCategory, selectedStatus, selectedWarehouse])

  const selectedItem = filteredRows[selectedRow] || filteredRows[0]

  const handleInventoryAction = (action: string) => {
    triggerAppToast(action, 'Inventory action queued and logged for the warehouse team.')
    if (action === 'Export Excel') {
      downloadExcel('inventory-export.xlsx', filteredRows)
    }
    if (action === '+ Stock Adjustment') {
      const updatedInventory = state.inventory.map((item) => ({ ...item, closing: Math.max(0, item.closing - 1) }))
      updateState({ inventory: updatedInventory })
      addAuditLog('UPDATE', 'INVENTORY', 'INV-ADJ', 'Stock adjustment recorded for the selected warehouse.')
    }
  }

  const summaryCards = [
    { label: 'Total Products', value: formatNumber(inventoryRows.length), tone: 'info' },
    { label: 'Items in Stock', value: formatNumber(inventoryRows.reduce((sum, row) => sum + row.available, 0)), tone: 'info' },
    { label: 'Inventory Value', value: formatCurrency(inventoryRows.reduce((sum, row) => sum + row.stockValue, 0)), tone: 'info' },
    { label: 'Low Stock Items', value: formatNumber(inventoryRows.filter((row) => row.status === 'Low Stock').length), tone: 'warning' },
    { label: 'Out of Stock', value: formatNumber(inventoryRows.filter((row) => row.status === 'Out of Stock').length), tone: 'critical' },
    { label: 'Expiring Soon', value: formatNumber(inventoryRows.filter((row) => row.status === 'Expired').length), tone: 'warning' },
  ]

  return (
    <AppLayout>
      <div className="inventory-page">
        <div className="inventory-header">
          <div>
            <div className="pg-title">Inventory</div>
            <div className="pg-subtitle">Monitor stock levels, warehouse activities, inventory movements, and stock valuation.</div>
          </div>
          <div className="inventory-actions">
            <button className="inventory-btn secondary" onClick={() => handleInventoryAction('+ Stock Adjustment')}>+ Stock Adjustment</button>
            <button className="inventory-btn secondary" onClick={() => handleInventoryAction('+ Stock Transfer')}>+ Stock Transfer</button>
            <button className="inventory-btn secondary" onClick={() => handleInventoryAction('+ Receive Stock')}>+ Receive Stock</button>
            <button className="inventory-btn secondary" onClick={() => handleInventoryAction('+ Stock Count')}>+ Stock Count</button>
            <button className="inventory-btn secondary" onClick={() => setShowFilters((prev) => !prev)}>{showFilters ? 'Hide Filters' : 'Show Filters'}</button>
            <button className="inventory-btn primary" onClick={() => handleInventoryAction('Export Excel')}>Export Excel</button>
          </div>
        </div>

        <div className="inventory-summary-grid">
          {summaryCards.map((card) => (
            <div className={`inventory-summary-card ${card.tone}`} key={card.label}>
              <div className="inventory-summary-label">{card.label}</div>
              <div className="inventory-summary-value">{card.value}</div>
            </div>
          ))}
        </div>

        {showFilters && (
          <div className="inventory-card">
            <div className="section-head">
              <div>
                <div className="card-title">Search & Filters</div>
                <div className="section-subtitle">Search stock records by product, SKU, warehouse, category, or status.</div>
              </div>
            </div>
            <div className="inventory-search-row">
              <div className="inventory-search-field">
                <span>🔎</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product, SKU, or category..." />
              </div>
              <div className="inventory-chip-row">
                <span className="inventory-chip success">Multi-warehouse</span>
                <span className="inventory-chip">Barcode ready</span>
              </div>
            </div>
            <div className="inventory-filters-grid">
              <label>
                <span>Warehouse</span>
                <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)}>
                  <option>All Warehouses</option>
                  <option>Main Warehouse</option>
                  <option>Warehouse A</option>
                  <option>Warehouse B</option>
                  <option>Store Front</option>
                  <option>Production</option>
                </select>
              </label>
              <label>
                <span>Category</span>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option>All Categories</option>
                  {Array.from(new Set(inventoryRows.map((row) => row.category))).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Stock Status</span>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option>All Status</option>
                  <option>In Stock</option>
                  <option>Low Stock</option>
                  <option>Out of Stock</option>
                  <option>Expired</option>
                  <option>Damaged</option>
                  <option>Reserved</option>
                </select>
              </label>
              <label>
                <span>Supplier</span>
                <select defaultValue="All Suppliers">
                  <option>All Suppliers</option>
                  <option>Vinta Supplier</option>
                  <option>Local Vendor</option>
                </select>
              </label>
              <label>
                <span>Branch</span>
                <select defaultValue="All Branches">
                  <option>All Branches</option>
                  <option>Lagos</option>
                  <option>Abuja</option>
                  <option>Enugu</option>
                </select>
              </label>
            </div>
          </div>
        )}

        <div className="inventory-content-grid">
          <div className="inventory-card">
            <div className="section-head">
              <div>
                <div className="card-title">Inventory Table</div>
                <div className="section-subtitle">Showing {filteredRows.length} stock records.</div>
              </div>
            </div>
            <div className="inventory-table-wrap">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Warehouse</th>
                    <th>Available</th>
                    <th>Reserved</th>
                    <th>Reorder</th>
                    <th>Unit Cost</th>
                    <th>Stock Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, index) => (
                    <tr key={row.id} onClick={() => setSelectedRow(index)} className={selectedItem?.id === row.id ? 'selected' : ''}>
                      <td>{row.id}</td>
                      <td>{row.product}</td>
                      <td>{row.category}</td>
                      <td>{row.warehouse}</td>
                      <td>{row.available}</td>
                      <td>{row.reserved}</td>
                      <td>{row.reorderLevel}</td>
                      <td>{formatCurrency(row.unitCost)}</td>
                      <td>{formatCurrency(row.stockValue)}</td>
                      <td>
                        <span className={`inventory-pill ${row.status === 'Out of Stock' ? 'danger' : row.status === 'Low Stock' ? 'warning' : 'success'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="inventory-side-stack">
            <div className="inventory-card">
              <div className="section-head">
                <div>
                  <div className="card-title">Stock Summary</div>
                  <div className="section-subtitle">Selected item movement overview.</div>
                </div>
              </div>
              <div className="inventory-detail-panel">
                <div className="inventory-detail-row"><span>Available Quantity</span><strong>{selectedItem?.available || 0}</strong></div>
                <div className="inventory-detail-row"><span>Reserved</span><strong>{selectedItem?.reserved || 0}</strong></div>
                <div className="inventory-detail-row"><span>Committed</span><strong>{Math.max(0, Math.floor((selectedItem?.available || 0) * 0.05))}</strong></div>
                <div className="inventory-detail-row"><span>Damaged</span><strong>0</strong></div>
                <div className="inventory-detail-row"><span>In Transit</span><strong>0</strong></div>
                <div className="inventory-detail-row"><span>On Order</span><strong>0</strong></div>
              </div>
            </div>

            <div className="inventory-card">
              <div className="section-head">
                <div>
                  <div className="card-title">Inventory Alerts</div>
                  <div className="section-subtitle">Operational exceptions needing attention.</div>
                </div>
              </div>
              <div className="inventory-alert-list">
                <div className="inventory-alert warning">Low stock on selected items.</div>
                <div className="inventory-alert danger">Negative stock detected in one location.</div>
                <div className="inventory-alert success">Pending transfer ready for approval.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
