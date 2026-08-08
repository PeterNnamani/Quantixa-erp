'use client'

import { useMemo, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { formatCurrency, formatNumber } from '@/lib/utils'

export default function ProductManagerPage() {
    const { state } = useAccounting()
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All Categories')
    const [selectedStatus, setSelectedStatus] = useState('Active')
    const [selectedRow, setSelectedRow] = useState(0)
    const [showFilters, setShowFilters] = useState(false)

    const products = useMemo(() => {
        return state.inventory.map((item, index) => ({
            id: `PRD-${index + 1}`,
            name: item.product,
            sku: `SKU-${index + 1}`,
            category: item.dept || 'Uncategorized',
            brand: '—',
            costPrice: item.unitCost,
            sellingPrice: item.unitCost * 1.35,
            stockStatus: item.closing <= 0 ? 'Out of Stock' : item.closing <= 10 ? 'Low Stock' : 'In Stock',
            status: 'Active',
            supplier: '—',
            stock: item.closing,
        }))
    }, [state.inventory])

    const filteredProducts = useMemo(() => {
        const query = search.toLowerCase()
        return products.filter((product) => {
            const matchesQuery = !query || [product.name, product.sku, product.category, product.brand, product.supplier].join(' ').toLowerCase().includes(query)
            const matchesCategory = selectedCategory === 'All Categories' || product.category === selectedCategory
            const matchesStatus = selectedStatus === 'All Status' || product.status === selectedStatus
            return matchesQuery && matchesCategory && matchesStatus
        })
    }, [products, search, selectedCategory, selectedStatus])

    const selectedProduct = filteredProducts[selectedRow] || filteredProducts[0]

    const summaryCards = [
        { label: 'Total Products', value: formatNumber(products.length), tone: 'info' },
        { label: 'Active Products', value: formatNumber(products.filter((product) => product.status === 'Active').length), tone: 'info' },
        { label: 'Inactive Products', value: formatNumber(products.filter((product) => product.status === 'Inactive').length), tone: 'warning' },
        { label: 'Categories', value: formatNumber(new Set(products.map((product) => product.category)).size), tone: 'info' },
        { label: 'Brands', value: formatNumber(new Set(products.map((product) => product.category)).size), tone: 'info' },
        { label: 'Variants', value: formatNumber(products.length), tone: 'info' },
    ]

    return (
        <AppLayout>
            <div className="product-manager-shell">
                <div className="product-manager-header">
                    <div>
                        <div className="pg-title">Product Manager</div>
                        <div className="pg-subtitle">Manage products, pricing, categories, variants, suppliers, and product settings.</div>
                    </div>
                    <div className="product-manager-actions">
                        <button className="product-manager-btn secondary">+ Add Product</button>
                        <button className="product-manager-btn secondary">Import Products</button>
                        <button className="product-manager-btn secondary">Export Products</button>
                        <button className="product-manager-btn secondary" onClick={() => setShowFilters((prev) => !prev)}>{showFilters ? 'Hide Filters' : 'Show Filters'}</button>
                        <button className="product-manager-btn primary">Bulk Update</button>
                    </div>
                </div>

                <div className="product-manager-summary-grid">
                    {summaryCards.map((card) => (
                        <div className={`product-manager-summary-card ${card.tone}`} key={card.label}>
                            <div className="product-manager-summary-label">{card.label}</div>
                            <div className="product-manager-summary-value">{card.value}</div>
                        </div>
                    ))}
                </div>

                {showFilters && (
                    <div className="product-manager-card">
                        <div className="section-head">
                            <div>
                                <div className="card-title">Search & Filters</div>
                                <div className="section-subtitle">Filter products by catalog, supplier, and availability.</div>
                            </div>
                        </div>
                        <div className="product-manager-search-row">
                            <div className="product-manager-search-field">
                                <span>🔎</span>
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product name, SKU, or brand..." />
                            </div>
                            <div className="product-manager-chip-row">
                                <span className="product-manager-chip success">Catalog ready</span>
                                <span className="product-manager-chip">Price updates</span>
                            </div>
                        </div>
                        <div className="product-manager-filters-grid">
                            <label>
                                <span>Category</span>
                                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                    <option>All Categories</option>
                                    {Array.from(new Set(products.map((product) => product.category))).map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </label>
                            <label>
                                <span>Brand</span>
                                <select defaultValue="All Brands">
                                    <option>All Brands</option>
                                    {Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </label>
                            <label>
                                <span>Supplier</span>
                                <select defaultValue="All Suppliers">
                                    <option>All Suppliers</option>
                                    {Array.from(new Set(products.map((product) => product.supplier).filter(Boolean))).map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </label>
                            <label>
                                <span>Status</span>
                                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                                    <option>All Status</option><option>Active</option><option>Inactive</option>
                                </select>
                            </label>
                            <label>
                                <span>Tax Class</span>
                                <select defaultValue="All">
                                    <option>All</option><option>VAT</option><option>Exempt</option>
                                </select>
                            </label>
                            <label>
                                <span>Stock Status</span>
                                <select defaultValue="All">
                                    <option>All</option><option>In Stock</option><option>Low Stock</option><option>Out of Stock</option>
                                </select>
                            </label>
                        </div>
                    </div>
                )}

                <div className="product-manager-content-grid">
                    <div className="product-manager-card">
                        <div className="section-head">
                            <div>
                                <div className="card-title">Product Table</div>
                                <div className="section-subtitle">Showing {filteredProducts.length} products.</div>
                            </div>
                        </div>
                        <div className="product-manager-table-wrap">
                            <table className="product-manager-table">
                                <thead>
                                    <tr>
                                        <th>SKU</th>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Brand</th>
                                        <th>Cost Price</th>
                                        <th>Selling Price</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product, index) => (
                                        <tr key={product.id} onClick={() => setSelectedRow(index)} className={selectedProduct?.id === product.id ? 'selected' : ''}>
                                            <td>{product.sku}</td>
                                            <td>{product.name}</td>
                                            <td>{product.category}</td>
                                            <td>{product.brand}</td>
                                            <td>{formatCurrency(product.costPrice)}</td>
                                            <td>{formatCurrency(product.sellingPrice)}</td>
                                            <td>{product.stock}</td>
                                            <td><span className={`product-manager-pill ${product.stockStatus === 'Out of Stock' ? 'danger' : product.stockStatus === 'Low Stock' ? 'warning' : 'success'}`}>{product.stockStatus}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="product-manager-side-stack">
                        <div className="product-manager-card">
                            <div className="section-head">
                                <div>
                                    <div className="card-title">Product Details</div>
                                    <div className="section-subtitle">Catalog information for the selected item.</div>
                                </div>
                            </div>
                            <div className="product-manager-detail-panel">
                                <div className="product-manager-detail-row"><span>Product Name</span><strong>{selectedProduct?.name || 'Not selected'}</strong></div>
                                <div className="product-manager-detail-row"><span>SKU</span><strong>{selectedProduct?.sku || '—'}</strong></div>
                                <div className="product-manager-detail-row"><span>Category</span><strong>{selectedProduct?.category || '—'}</strong></div>
                                <div className="product-manager-detail-row"><span>Brand</span><strong>—</strong></div>
                                <div className="product-manager-detail-row"><span>Cost Price</span><strong>{selectedProduct?.costPrice ? formatCurrency(selectedProduct.costPrice) : formatCurrency(0)}</strong></div>
                                <div className="product-manager-detail-row"><span>Selling Price</span><strong>{selectedProduct?.sellingPrice ? formatCurrency(selectedProduct.sellingPrice) : formatCurrency(0)}</strong></div>
                            </div>
                        </div>

                        <div className="product-manager-card">
                            <div className="section-head">
                                <div>
                                    <div className="card-title">Inventory Settings</div>
                                    <div className="section-subtitle">Operational controls tied to stock.</div>
                                </div>
                            </div>
                            <div className="product-manager-detail-panel">
                                <div className="product-manager-detail-row"><span>Track Inventory</span><strong>—</strong></div>
                                <div className="product-manager-detail-row"><span>Minimum Stock</span><strong>—</strong></div>
                                <div className="product-manager-detail-row"><span>Reorder Level</span><strong>—</strong></div>
                                <div className="product-manager-detail-row"><span>Preferred Warehouse</span><strong>—</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
