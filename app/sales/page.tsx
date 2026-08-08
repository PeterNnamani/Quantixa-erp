'use client'

import { useMemo, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { useAccounting } from '@/lib/context'
import { Sale } from '@/lib/context'
import { formatCurrency, makeID, getCurrentDate, PRODUCTS, PAYMENT_TERMS, canEdit } from '@/lib/utils'

const branchOptions = ['All Branches', 'Head Office', 'Retail Outlet', 'Warehouse 01', 'Warehouse 02']
const paymentMethods = ['All Payment Methods', 'Cash', 'Transfer', 'Cheque', 'Mobile Money', 'POS', 'Credit']
const orderStatuses = ['All Order Status', 'Completed', 'Pending', 'Returned', 'Cancelled']
const categories = ['All Categories', 'Retail', 'Wholesale', 'Services', 'General']

export default function SalesPage() {
  const { state, updateState, user, addAuditLog } = useAccounting()
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedBranch, setSelectedBranch] = useState('All Branches')
  const [selectedCustomer, setSelectedCustomer] = useState('All Customers')
  const [selectedSalesRep, setSelectedSalesRep] = useState('All Sales Reps')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All Payment Methods')
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('All Order Status')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSaleId, setSelectedSaleId] = useState(state.sales[0]?.id ?? '')
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 10

  const sales = useMemo(() => state.sales.filter((sale) => sale.status !== 'VOID'), [state.sales])

  const salesWithMetadata = useMemo(() => {
    return sales.map((sale) => {
      const branch = (sale as any).branch || 'Head Office'
      const salesRep = sale.enteredBy || 'Peter'
      const category = (sale.items?.[0]?.dept as string) || 'Retail'
      const paymentMethod = sale.paymentMethod || 'Transfer'
      const orderStatus = (sale as any).orderStatus || (sale.paymentStatus === 'PAID' ? 'Completed' : 'Pending')
      const paidAmount = (sale as any).amountPaid ?? (sale.paymentStatus === 'PAID' ? sale.totalAmount : 0)
      const balance = Math.max(0, sale.totalAmount - paidAmount)
      const itemCount = sale.items?.length ?? 0
      return {
        ...sale,
        branch,
        salesRep,
        category,
        paymentMethod,
        orderStatus,
        paidAmount,
        balance,
        itemCount,
      }
    })
  }, [sales])

  const uniqueCustomers = useMemo(() => ['All Customers', ...Array.from(new Set(sales.map((sale) => sale.customer)))], [sales])
  const uniqueSalesReps = useMemo(() => ['All Sales Reps', ...Array.from(new Set(sales.map((sale) => sale.enteredBy || 'Peter')))], [sales])
  const uniqueCategories = useMemo(() => ['All Categories', ...Array.from(new Set(salesWithMetadata.map((sale) => sale.category)))], [salesWithMetadata])

  const filteredSales = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return salesWithMetadata.filter((sale) => {
      const matchesSearch =
        !term ||
        [sale.id, sale.customer, sale.paymentMethod, sale.enteredBy, sale.notes, sale.items?.map((item) => item.product).join(' ')].join(' ').toLowerCase().includes(term)

      const matchesStatus = selectedStatus === 'All' || sale.paymentStatus === selectedStatus.toUpperCase()
      const matchesBranch = selectedBranch === 'All Branches' || sale.branch === selectedBranch
      const matchesCustomer = selectedCustomer === 'All Customers' || sale.customer === selectedCustomer
      const matchesSalesRep = selectedSalesRep === 'All Sales Reps' || sale.salesRep === selectedSalesRep
      const matchesPaymentMethod = selectedPaymentMethod === 'All Payment Methods' || sale.paymentMethod === selectedPaymentMethod
      const matchesOrderStatus = selectedOrderStatus === 'All Order Status' || sale.orderStatus === selectedOrderStatus
      const matchesCategory = selectedCategory === 'All Categories' || sale.category === selectedCategory

      return matchesSearch && matchesStatus && matchesBranch && matchesCustomer && matchesSalesRep && matchesPaymentMethod && matchesOrderStatus && matchesCategory
    })
  }, [searchTerm, selectedStatus, selectedBranch, selectedCustomer, selectedSalesRep, selectedPaymentMethod, selectedOrderStatus, selectedCategory, salesWithMetadata])

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / itemsPerPage))
  const activePage = Math.min(currentPage, totalPages)
  const paginatedSales = filteredSales.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage)

  const selectedSale = salesWithMetadata.find((sale) => sale.id === selectedSaleId) || paginatedSales[0] || salesWithMetadata[0]

  const today = getCurrentDate()
  const todaySales = salesWithMetadata.filter((sale) => sale.date === today)
  const monthlySales = salesWithMetadata.filter((sale) => {
    const saleDate = new Date(sale.date)
    const now = new Date()
    return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
  })

  const metrics = {
    todaysSales: todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    monthlySales: monthlySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    invoices: salesWithMetadata.length,
    pendingOrders: salesWithMetadata.filter((sale) => sale.orderStatus !== 'Completed').length,
    creditSales: salesWithMetadata.filter((sale) => sale.paymentStatus === 'CREDIT').reduce((sum, sale) => sum + sale.totalAmount, 0),
    profitToday: todaySales.reduce((sum, sale) => sum + sale.totalAmount * 0.18, 0),
  }

  const customerInfo = selectedSale
    ? {
      customer: selectedSale.customer,
      phone: `+234 ${Math.floor(8000000000 + Math.random() * 99999999)}`,
      email: `${selectedSale.customer.split(' ')[0]?.toLowerCase() || 'customer'}@example.com`,
      address: 'Victoria Island, Lagos',
      creditLimit: 5000000,
      outstandingBalance: selectedSale.balance,
    }
    : null

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', dept: 'BEVERAGES', qty: 1, unitPrice: 0, total: 0 }],
    })
  }

  const [formData, setFormData] = useState({
    date: getCurrentDate(),
    customer: '',
    items: [{ product: '', dept: 'BEVERAGES', qty: 1, unitPrice: 0, total: 0 }],
    paymentMethod: 'Transfer',
    paymentStatus: 'PAID',
    notes: '',
  })

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }

    if (field === 'qty' || field === 'unitPrice') {
      const qty = parseFloat(newItems[index].qty as any) || 0
      const unitPrice = parseFloat(newItems[index].unitPrice as any) || 0
      newItems[index].total = qty * unitPrice
    }

    setFormData({ ...formData, items: newItems })
  }

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const handleSaveSale = () => {
    if (!formData.customer || formData.items.some((i) => !i.product || !i.qty || !i.unitPrice)) {
      alert('Please fill in all fields')
      return
    }

    const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0)
    const sale: Sale = {
      id: makeID('INV'),
      date: formData.date,
      customer: formData.customer,
      items: formData.items,
      totalAmount,
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentStatus,
      notes: formData.notes,
      status: 'ACTIVE',
      enteredBy: user?.name || 'System',
    }

    updateState({ sales: [...state.sales, sale] })
    addAuditLog('CREATE', 'SALE', sale.id, `Sale created for ${sale.customer}: ${formatCurrency(totalAmount)}`)
    setShowForm(false)
    setFormData({
      date: getCurrentDate(),
      customer: '',
      items: [{ product: '', dept: 'BEVERAGES', qty: 1, unitPrice: 0, total: 0 }],
      paymentMethod: 'Transfer',
      paymentStatus: 'PAID',
      notes: '',
    })
  }

  const handleVoidSale = (saleId: string) => {
    const updatedSales = state.sales.map((sale) => (sale.id === saleId ? { ...sale, status: 'VOID' } : sale))
    updateState({ sales: updatedSales })
    addAuditLog('VOID', 'SALE', saleId, `Void sale ${saleId}`)
  }

  return (
    <AppLayout>
      <div className="module-shell">
        {showForm && (
          <div className="card" style={{ position: 'relative', zIndex: 2 }}>
            <div className="card-hd">
              <div className="card-title">Record New Sale</div>
            </div>
            <div className="form-grid">
              <div className="fg">
                <label>Date *</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="fg">
                <label>Customer *</label>
                <input type="text" value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} />
              </div>
              <div className="fg">
                <label>Payment Method *</label>
                <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                  {PAYMENT_TERMS.map((term) => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>Payment Status *</label>
                <select value={formData.paymentStatus} onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}>
                  <option value="PAID">PAID</option>
                  <option value="CREDIT">CREDIT</option>
                </select>
              </div>
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr', marginTop: 8 }}>
              <div className="fg">
                <label>Items</label>
                {formData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', marginBottom: '10px' }}>
                    <select value={item.dept} onChange={(e) => handleItemChange(idx, 'dept', e.target.value)}>
                      {Object.keys(PRODUCTS).map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <select value={item.product} onChange={(e) => handleItemChange(idx, 'product', e.target.value)}>
                      <option value="">Select product</option>
                      {PRODUCTS[item.dept].map((product) => (
                        <option key={product} value={product}>{product}</option>
                      ))}
                    </select>
                    <input type="number" min={1} value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value, 10) || 0)} placeholder="Qty" />
                    <input type="number" min={0} value={item.unitPrice} onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder="Price" />
                    <button className="btn btn-sm btn-danger" type="button" onClick={() => handleRemoveItem(idx)}>?</button>
                  </div>
                ))}
                <button className="btn btn-sm" type="button" onClick={handleAddItem}>+ Add Item</button>
              </div>
            </div>

            <div className="fg">
              <label>Notes</label>
              <input type="text" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>

            <div className="btn-group">
              <button className="btn btn-primary" type="button" onClick={handleSaveSale}>Save Sale</button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="module-header">
          <div>
            <div className="module-title">Sales</div>
            <div className="module-subtitle">Create invoices, manage customer orders, monitor revenue, and track sales performance.</div>
          </div>
          <div className="module-actions">
            {canEdit(user?.role || '') && <button className="btn btn-primary" onClick={() => setShowForm((prev) => !prev)}>{showForm ? 'Close' : '+ New Sale'}</button>}
            <button className="btn btn-secondary">+ New Invoice</button>
            <button className="btn btn-secondary">+ POS Sale</button>
            <button className="btn btn-secondary">Export</button>
            <button className="btn btn-secondary">Print</button>
            <button className="btn btn-secondary">More ▾</button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              aria-label={showFilters ? 'Hide filters' : 'Show filters'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span aria-hidden="true">🔍</span>
              <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
            </button>
          </div>
        </div>

        <div className="dashboard-card-grid">
          <div className="dashboard-card">
            <div className="metric-label">Today's Sales</div>
            <div className="metric-value">{formatCurrency(metrics.todaysSales)}</div>
          </div>
          <div className="dashboard-card">
            <div className="metric-label">Monthly Sales</div>
            <div className="metric-value">{formatCurrency(metrics.monthlySales)}</div>
          </div>
          <div className="dashboard-card">
            <div className="metric-label">Invoices</div>
            <div className="metric-value">{metrics.invoices}</div>
          </div>
          <div className="dashboard-card">
            <div className="metric-label">Pending Orders</div>
            <div className="metric-value">{metrics.pendingOrders}</div>
          </div>
          <div className="dashboard-card">
            <div className="metric-label">Credit Sales</div>
            <div className="metric-value">{formatCurrency(metrics.creditSales)}</div>
          </div>
          <div className="dashboard-card">
            <div className="metric-label">Profit Today</div>
            <div className="metric-value">{formatCurrency(metrics.profitToday)}</div>
          </div>
        </div>

        {showFilters && (
          <div className="filter-panel">
            <div className="section-head">
              <div>
                <div className="card-title">Search & Filters</div>
                <div className="section-subtitle">Search invoices, customers, products, receipts, and sales reps.</div>
              </div>
            </div>
            <div className="filter-row">
              <label>
                Search
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Invoice, customer, product, sales rep, receipt..."
                />
              </label>
              <label>
                Status
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option>All</option>
                  <option>Paid</option>
                  <option>Credit</option>
                </select>
              </label>
              <label>
                Branch
                <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                  {branchOptions.map((branch) => (<option key={branch}>{branch}</option>))}
                </select>
              </label>
              <label>
                Customer
                <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
                  {uniqueCustomers.map((customer) => (<option key={customer}>{customer}</option>))}
                </select>
              </label>
              <label>
                Salesperson
                <select value={selectedSalesRep} onChange={(e) => setSelectedSalesRep(e.target.value)}>
                  {uniqueSalesReps.map((rep) => (<option key={rep}>{rep}</option>))}
                </select>
              </label>
              <label>
                Payment Method
                <select value={selectedPaymentMethod} onChange={(e) => setSelectedPaymentMethod(e.target.value)}>
                  {paymentMethods.map((payment) => (<option key={payment}>{payment}</option>))}
                </select>
              </label>
              <label>
                Order Status
                <select value={selectedOrderStatus} onChange={(e) => setSelectedOrderStatus(e.target.value)}>
                  {orderStatuses.map((status) => (<option key={status}>{status}</option>))}
                </select>
              </label>
              <label>
                Category
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  {uniqueCategories.map((category) => (<option key={category}>{category}</option>))}
                </select>
              </label>
            </div>
          </div>
        )}

        <div className="module-content-grid">
          <div>
            <div className="card">
              <div className="card-hd">
                <div className="card-title">Sales Ledger</div>
                <div className="table-summary">Showing {filteredSales.length} invoice{filteredSales.length === 1 ? '' : 's'}</div>
              </div>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Order</th>
                      <th>Sales Rep</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSales.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
                          No sales match your filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedSales.map((sale) => (
                        <tr key={sale.id} onClick={() => setSelectedSaleId(sale.id)} className={selectedSaleId === sale.id ? 'selected' : ''}>
                          <td>{sale.id}</td>
                          <td>{sale.customer}</td>
                          <td>{sale.date}</td>
                          <td>{sale.itemCount}</td>
                          <td>{formatCurrency(sale.totalAmount)}</td>
                          <td>{formatCurrency(sale.paidAmount)}</td>
                          <td>{formatCurrency(sale.balance)}</td>
                          <td><span className={`badge ${sale.paymentStatus === 'PAID' ? 'b-green' : 'b-amber'}`}>{sale.paymentStatus}</span></td>
                          <td>{sale.orderStatus}</td>
                          <td>{sale.salesRep}</td>
                          <td><button className="btn btn-sm btn-secondary" type="button">View</button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="txn-footer" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-sm btn-secondary" type="button" onClick={() => setCurrentPage(Math.max(1, activePage - 1))} disabled={activePage === 1}>‹</button>
                  <span className="page-info">Page {activePage} of {totalPages}</span>
                  <button className="btn btn-sm btn-secondary" type="button" onClick={() => setCurrentPage(Math.min(totalPages, activePage + 1))} disabled={activePage === totalPages}>›</button>
                </div>
              )}
            </div>
          </div>

          <div className="detail-panel">
            <div className="detail-section">
              <div className="detail-section-title">Invoice Details</div>
              <div className="detail-row"><span>Invoice</span><strong>{selectedSale?.id || '-'}</strong></div>
              <div className="detail-row"><span>Date</span><strong>{selectedSale?.date || '-'}</strong></div>
              <div className="detail-row"><span>Status</span><strong>{selectedSale?.paymentStatus || '-'}</strong></div>
              <div className="detail-row"><span>Order Status</span><strong>{selectedSale?.orderStatus || '-'}</strong></div>
              <div className="detail-row"><span>Branch</span><strong>{selectedSale?.branch || '-'}</strong></div>
              <div className="detail-row"><span>Sales Rep</span><strong>{selectedSale?.salesRep || '-'}</strong></div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Customer Information</div>
              <div className="detail-row"><span>Customer</span><strong>{customerInfo?.customer || '-'}</strong></div>
              <div className="detail-row"><span>Phone</span><strong>{customerInfo?.phone || '-'}</strong></div>
              <div className="detail-row"><span>Email</span><strong>{customerInfo?.email || '-'}</strong></div>
              <div className="detail-row"><span>Address</span><strong>{customerInfo?.address || '-'}</strong></div>
              <div className="detail-row"><span>Credit Limit</span><strong>{formatCurrency(customerInfo?.creditLimit ?? 0)}</strong></div>
              <div className="detail-row"><span>Outstanding</span><strong>{formatCurrency(customerInfo?.outstandingBalance ?? 0)}</strong></div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Products Sold</div>
              <div className="tbl-wrap" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale?.items?.length ? (
                      selectedSale.items.map((item, idx) => (
                        <tr key={`${selectedSale.id}-item-${idx}`}>
                          <td>{item.product || '-'}</td>
                          <td>{item.qty}</td>
                          <td>{formatCurrency(item.unitPrice)}</td>
                          <td>{formatCurrency(item.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: 18, color: 'var(--text3)' }}>No products available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Payment Summary</div>
              <div className="detail-row"><span>Subtotal</span><strong>{formatCurrency(selectedSale?.items?.reduce((sum, item) => sum + (item.total || 0), 0) ?? 0)}</strong></div>
              <div className="detail-row"><span>Discount</span><strong>{formatCurrency(0)}</strong></div>
              <div className="detail-row"><span>VAT</span><strong>{formatCurrency(0)}</strong></div>
              <div className="detail-row"><span>Shipping</span><strong>{formatCurrency(0)}</strong></div>
              <div className="detail-row"><span>Grand Total</span><strong>{formatCurrency(selectedSale?.totalAmount ?? 0)}</strong></div>
              <div className="detail-row"><span>Amount Paid</span><strong>{formatCurrency(selectedSale?.paidAmount ?? 0)}</strong></div>
              <div className="detail-row"><span>Balance</span><strong>{formatCurrency(selectedSale?.balance ?? 0)}</strong></div>
            </div>

            <div className="workflow-panel">
              <div className="detail-section-title">Sales Workflow</div>
              {['Sale Created', 'Invoice Generated', 'Inventory Reduced', 'Receivable Created', 'Payment Received', 'GL Updated', 'Daily Close Updated', 'Audit Logged'].map((step) => (
                <div key={step} className="workflow-step">
                  <strong>{step}</strong>
                  <span>Completed</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card-grid">
          <div className="chart-card">
            <div className="chart-card-title">Daily Sales Trend</div>
            <div className="chart-placeholder">Chart placeholder</div>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">Monthly Revenue</div>
            <div className="chart-placeholder">Chart placeholder</div>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">Sales by Category</div>
            <div className="chart-placeholder">Chart placeholder</div>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">Top Selling Products</div>
            <div className="chart-placeholder">Chart placeholder</div>
          </div>
        </div>

        <div className="reports-row">
          <button className="btn btn-secondary">Sales Summary</button>
          <button className="btn btn-secondary">Sales by Customer</button>
          <button className="btn btn-secondary">Sales by Product</button>
          <button className="btn btn-secondary">Sales by Branch</button>
          <button className="btn btn-secondary">Profit Report</button>
          <button className="btn btn-secondary">Tax Report</button>
          <button className="btn btn-secondary">POS Report</button>
        </div>
      </div>
    </AppLayout>
  )
}
