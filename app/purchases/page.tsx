'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import AppLayout from '@/components/layout/app-layout'
import BulkImport from '@/components/bulk-import'
import { useAccounting } from '@/lib/context'
import { Purchase } from '@/lib/context'
import { formatCurrency, makeID, getCurrentDate, PAYMENT_TERMS, canEdit, getStatusBadgeClass, parseNumeric } from '@/lib/utils'
import { downloadExcel } from '@/lib/export-utils'
import { parseExcelFile } from '@/lib/import-utils'

const branchOptions = ['All Branches', 'Head Office', 'Warehouse 01', 'Warehouse 02', 'Retail Outlet']
const paymentMethods = ['All', 'Cash', 'Bank Transfer', 'Card', 'Cheque', 'Mobile Money', 'Multiple']
const purchaseStatuses = ['All', 'Completed', 'Pending', 'Cancelled', 'Returned']
const categories = ['All Categories', 'Inventory', 'Office Supplies', 'Assets', 'Furniture', 'Electronics', 'Services', 'Fuel', 'Maintenance']
const datePresets = ['This Month', 'Last 30 Days', 'This Quarter', 'This Year', 'Custom Date']

function getDateRange(preset: string, customFrom: string, customTo: string) {
  const today = new Date()
  const start = new Date(today)
  const end = new Date(today)

  switch (preset) {
    case 'This Month':
      start.setDate(1)
      break
    case 'Last 30 Days':
      start.setDate(today.getDate() - 29)
      break
    case 'This Quarter': {
      const quarter = Math.floor(today.getMonth() / 3)
      start.setMonth(quarter * 3)
      start.setDate(1)
      break
    }
    case 'This Year':
      start.setMonth(0)
      start.setDate(1)
      break
    case 'Custom Date':
      return { from: customFrom, to: customTo }
    default:
      return { from: '', to: '' }
  }

  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    from: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    to: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  }
}

export default function PurchasesPage() {
  const { state, updateState, user, addAuditLog } = useAccounting()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('All Suppliers')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All')
  const [selectedBranch, setSelectedBranch] = useState('All Branches')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedDateRange, setSelectedDateRange] = useState('This Month')
  const [customFrom, setCustomFrom] = useState(getCurrentDate())
  const [customTo, setCustomTo] = useState(getCurrentDate())
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importRows, setImportRows] = useState<Record<string, unknown>[]>([])
  const [importFileName, setImportFileName] = useState('')
  const [importError, setImportError] = useState('')
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(state.purchases[0]?.id ?? '')
  const itemsPerPage = 10

  const purchases = useMemo(
    () => state.purchases.filter((purchase) => purchase.status !== 'VOID'),
    [state.purchases]
  )

  const uniqueSuppliers = useMemo(
    () => ['All Suppliers', ...Array.from(new Set(purchases.map((purchase) => purchase.supplier)))],
    [purchases]
  )

  const summary = useMemo(() => {
    const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.total, 0)
    const paidPurchases = purchases
      .filter((purchase) => purchase.paymentStatus === 'PAID')
      .reduce((sum, purchase) => sum + (purchase.amountPaid ?? purchase.total), 0)
    const outstandingBalance = purchases.reduce((sum, purchase) => {
      const paid = purchase.amountPaid ?? (purchase.paymentStatus === 'PAID' ? purchase.total : 0)
      return sum + Math.max(0, purchase.total - paid)
    }, 0)
    const overdueAmount = purchases
      .filter((purchase) => purchase.paymentStatus === 'OVERDUE')
      .reduce((sum, purchase) => sum + purchase.total, 0)
    const monthAmount = purchases
      .filter((purchase) => {
        const date = new Date(purchase.date)
        const today = new Date()
        return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
      })
      .reduce((sum, purchase) => sum + purchase.total, 0)

    const supplierCount = new Set(purchases.map((purchase) => purchase.supplier)).size

    return {
      totalPurchases,
      paidPurchases,
      outstandingBalance,
      overdueAmount,
      monthAmount,
      supplierCount,
    }
  }, [purchases])

  const filteredPurchases = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    const range = getDateRange(selectedDateRange, customFrom, customTo)
    const from = range.from ? new Date(range.from) : null
    const to = range.to ? new Date(range.to) : null

    return purchases
      .filter((purchase) => {
        if (!term) return true
        const content = `${purchase.id} ${purchase.supplier} ${purchase.invoiceNumber ?? ''} ${purchase.product} ${purchase.purchaseOrder ?? ''}`.toLowerCase()
        return content.includes(term)
      })
      .filter((purchase) => selectedSupplier === 'All Suppliers' || purchase.supplier === selectedSupplier)
      .filter((purchase) => selectedStatus === 'All' || purchase.status === selectedStatus)
      .filter((purchase) => selectedPaymentMethod === 'All' || purchase.paymentMethod === selectedPaymentMethod)
      .filter((purchase) => selectedBranch === 'All Branches' || purchase.branch === selectedBranch)
      .filter((purchase) => selectedCategory === 'All Categories' || purchase.category === selectedCategory)
      .filter((purchase) => {
        if (!from || !to) return true
        const date = new Date(purchase.date)
        return date >= from && date <= to
      })
  }, [purchases, searchTerm, selectedSupplier, selectedStatus, selectedPaymentMethod, selectedBranch, selectedCategory, selectedDateRange, customFrom, customTo])

  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / itemsPerPage))
  const activePage = Math.min(currentPage, totalPages)
  const paginatedPurchases = filteredPurchases.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage)
  const selectedPurchase = purchases.find((purchase) => purchase.id === selectedPurchaseId) || paginatedPurchases[0] || purchases[0]

  const topSuppliers = useMemo(() => {
    const counted = purchases.reduce<Record<string, number>>((acc, purchase) => {
      acc[purchase.supplier] = (acc[purchase.supplier] || 0) + purchase.total
      return acc
    }, {})
    return Object.entries(counted)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([supplier, amount]) => ({ supplier, amount }))
  }, [purchases])

  const [formData, setFormData] = useState({
    date: getCurrentDate(),
    supplier: '',
    invoiceNumber: '',
    purchaseOrder: '',
    branch: 'Head Office',
    category: 'Inventory',
    paymentMethod: 'Cash',
    paymentStatus: 'PAID' as 'PAID' | 'CREDIT' | 'PART PAYMENT' | 'OVERDUE',
    amountPaid: 0,
    dueDate: getCurrentDate(),
    product: '',
    qty: 1,
    unitPrice: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    notes: '',
  })

  const handleSavePurchase = () => {
    if (!formData.supplier || !formData.invoiceNumber || !formData.product || !formData.qty || !formData.unitPrice) {
      alert('Supplier, invoice number, product, quantity, and unit price are required.')
      return
    }

    const subtotal = formData.qty * formData.unitPrice
    const total = subtotal - formData.discount + formData.tax + formData.shipping
    const paidAmount = formData.paymentStatus === 'PAID' ? total : formData.amountPaid
    const purchase: Purchase = {
      id: makeID('PUR'),
      date: formData.date,
      dept: formData.category,
      product: formData.product,
      qty: formData.qty,
      unitPrice: formData.unitPrice,
      transCost: formData.shipping,
      discount: formData.discount,
      total,
      supplier: formData.supplier,
      bank: formData.paymentMethod,
      paymentStatus: formData.paymentStatus,
      dueDate: formData.dueDate,
      notes: formData.notes,
      status: formData.paymentStatus === 'CREDIT' ? 'Pending' : 'Completed',
      enteredBy: user?.name || 'System',
      invoiceNumber: formData.invoiceNumber,
      purchaseOrder: formData.purchaseOrder,
      branch: formData.branch,
      category: formData.category,
      paymentMethod: formData.paymentMethod,
      amountPaid: paidAmount,
      balance: Math.max(0, total - paidAmount),
      items: [
        {
          product: formData.product,
          sku: '',
          qty: formData.qty,
          unitPrice: formData.unitPrice,
          discount: formData.discount,
          tax: formData.tax,
          total: subtotal - formData.discount + formData.tax,
        },
      ],
    }

    const updatedSupplierList = state.supplierList.includes(formData.supplier)
      ? state.supplierList
      : [...state.supplierList, formData.supplier]

    const updatedState = {
      purchases: [...state.purchases, purchase],
      supplierList: updatedSupplierList,
    }

    updateState(updatedState)
    addAuditLog('CREATE', 'PURCHASE', purchase.id, `Purchase recorded: ${purchase.invoiceNumber} from ${purchase.supplier}`)
    setShowForm(false)
    setFormData({
      date: getCurrentDate(),
      supplier: '',
      invoiceNumber: '',
      purchaseOrder: '',
      branch: 'Head Office',
      category: 'Inventory',
      paymentMethod: 'Cash',
      paymentStatus: 'PAID',
      amountPaid: 0,
      dueDate: getCurrentDate(),
      product: '',
      qty: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0,
      shipping: 0,
      notes: '',
    })
  }

  const handleExportPurchases = () => {
    downloadExcel('purchases-report.xlsx', filteredPurchases)
    addAuditLog('EXPORT', 'PURCHASE', 'ALL', 'Purchases exported.')
  }

  const handleRefreshPurchases = () => {
    setSearchTerm('')
    setSelectedSupplier('All Suppliers')
    setSelectedStatus('All')
    setSelectedPaymentMethod('All')
    setSelectedBranch('All Branches')
    setSelectedCategory('All Categories')
    setSelectedDateRange('This Month')
    setCustomFrom(getCurrentDate())
    setCustomTo(getCurrentDate())
    setCurrentPage(1)
    setShowFilters(false)
    alert('Purchase list refreshed.')
  }

  const handleNewPurchase = () => {
    setShowForm((prev) => !prev)
  }

  const handlePurchaseFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.name.match(/\.xls(x)?$/i)) {
      setImportError('Please upload a valid Excel file (.xls or .xlsx).')
      setImportRows([])
      setImportFileName('')
      return
    }

    try {
      const rows = await parseExcelFile(file)
      if (rows.length === 0) {
        setImportError('The Excel file contains no rows.')
        setImportRows([])
        setImportFileName(file.name)
        return
      }
      setImportRows(rows)
      setImportFileName(file.name)
      setImportError('')
    } catch (error) {
      setImportError('Unable to parse the Excel file. Verify the format and try again.')
      setImportRows([])
      setImportFileName(file.name)
    }
  }

  const processPurchaseImport = () => {
    if (importRows.length === 0) {
      setImportError('No rows are ready for import.')
      return
    }

    const importedPurchases: Purchase[] = []
    const suppliers = new Set(state.supplierList)
    const inventoryUpdates = [...state.inventory]

    importRows.forEach((row, index) => {
      const supplier = String(row['Supplier'] || row['vendor'] || row['supplier'] || 'Unknown Supplier').trim()
      const product = String(row['Product'] || row['Item'] || row['Description'] || '').trim()
      const invoiceNumber = String(row['Invoice Number'] || row['InvoiceNo'] || row['Invoice'] || `IMP-${Date.now()}-${index}`).trim()
      const purchaseOrder = String(row['Purchase Order'] || row['PO'] || row['Order Number'] || '').trim()
      const date = String(row['Date'] || row['date'] || getCurrentDate()).trim()
      const category = String(row['Category'] || row['Dept'] || row['Department'] || 'Inventory').trim() || 'Inventory'
      const branch = String(row['Branch'] || row['Location'] || 'Head Office').trim() || 'Head Office'
      const paymentMethod = String(row['Payment Method'] || row['Bank'] || 'Cash').trim() || 'Cash'
      const paymentStatus = String(row['Payment Status'] || row['Status'] || 'PAID').trim().toUpperCase() as 'PAID' | 'CREDIT' | 'PART PAYMENT' | 'OVERDUE'
      const qty = Math.max(0, parseNumeric(row['Quantity'] || row['Qty'] || row['quantity'] || 1))
      const unitPrice = Math.max(0, parseNumeric(row['Unit Price'] || row['UnitPrice'] || row['Price'] || 0))
      const discount = Math.max(0, parseNumeric(row['Discount'] || 0))
      const tax = Math.max(0, parseNumeric(row['Tax'] || 0))
      const shipping = Math.max(0, parseNumeric(row['Shipping'] || row['Freight'] || 0))
      const amountPaid = Math.max(0, parseNumeric(row['Amount Paid'] || row['Paid'] || (paymentStatus === 'PAID' ? (qty * unitPrice - discount + tax + shipping) : 0)))
      const dueDate = String(row['Due Date'] || row['dueDate'] || row['Due'] || getCurrentDate()).trim()
      const notes = String(row['Notes'] || row['Memo'] || row['Description'] || '').trim()

      const subtotal = qty * unitPrice
      const total = subtotal - discount + tax + shipping
      const balance = Math.max(0, total - amountPaid)
      const status = paymentStatus === 'CREDIT' || paymentStatus === 'OVERDUE' ? 'Pending' : 'Completed'

      const purchase: Purchase = {
        id: makeID('PUR'),
        date: date || getCurrentDate(),
        dept: category,
        product,
        qty,
        unitPrice,
        transCost: shipping,
        discount,
        total,
        supplier,
        bank: paymentMethod,
        paymentStatus,
        dueDate: dueDate || getCurrentDate(),
        notes,
        status,
        enteredBy: user?.name || 'System',
        invoiceNumber,
        purchaseOrder,
        branch,
        category,
        paymentMethod,
        amountPaid,
        balance,
        items: [
          {
            product,
            sku: String(row['SKU'] || row['sku'] || ''),
            qty,
            unitPrice,
            discount,
            tax,
            total: subtotal - discount + tax,
          },
        ],
      }

      importedPurchases.push(purchase)
      suppliers.add(supplier)

      const inventoryIndex = inventoryUpdates.findIndex((item) => item.product?.toLowerCase() === product.toLowerCase())
      if (inventoryIndex >= 0) {
        const existing = inventoryUpdates[inventoryIndex]
        inventoryUpdates[inventoryIndex] = {
          ...existing,
          purchased: (existing.purchased || 0) + qty,
          closing: (existing.closing || 0) + qty,
        }
      } else if (product) {
        inventoryUpdates.push({
          product,
          dept: category,
          openQty: qty,
          purchased: qty,
          sold: 0,
          unitCost: unitPrice,
          closing: qty,
        })
      }
    })

    updateState({
      purchases: [...state.purchases, ...importedPurchases],
      supplierList: Array.from(suppliers),
      inventory: inventoryUpdates,
    })

    addAuditLog('IMPORT', 'PURCHASE', 'BULK', `Imported ${importedPurchases.length} purchase rows from ${importFileName}`)
    setShowImportModal(false)
    setImportRows([])
    setImportFileName('')
    setImportError('')
  }

  const handleCancelPurchase = (purchaseId: string) => {
    updateState({
      purchases: state.purchases.map((purchase) =>
        purchase.id === purchaseId ? { ...purchase, status: 'Cancelled' } : purchase
      ),
    })
    addAuditLog('CANCEL', 'PURCHASE', purchaseId, `Purchase ${purchaseId} was cancelled.`)
  }

  const purchaseDetailItems = selectedPurchase?.items?.length
    ? selectedPurchase.items
    : [{
      product: selectedPurchase?.product ?? '-',
      qty: selectedPurchase?.qty ?? 0,
      unitPrice: selectedPurchase?.unitPrice ?? 0,
      total: selectedPurchase?.total ?? 0,
    }]

  return (
    <AppLayout>
      <div className="module-shell">
        {showForm && (
          <div className="card">
            <div className="card-hd">
              <div className="card-title">New Purchase Request</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Close</button>
            </div>
            <div className="form-grid">
              <div className="fg">
                <label>Supplier</label>
                <input value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} placeholder="Supplier name" />
              </div>
              <div className="fg">
                <label>Invoice Number</label>
                <input value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} placeholder="INV-1001" />
              </div>
              <div className="fg">
                <label>Purchase Order</label>
                <input value={formData.purchaseOrder} onChange={(e) => setFormData({ ...formData, purchaseOrder: e.target.value })} placeholder="PO-2026-001" />
              </div>
              <div className="fg">
                <label>Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="fg">
                <label>Branch</label>
                <select value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })}>
                  {branchOptions.map((branch) => (<option key={branch}>{branch}</option>))}
                </select>
              </div>
              <div className="fg">
                <label>Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  {categories.slice(1).map((category) => (<option key={category}>{category}</option>))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="fg">
                <label>Product</label>
                <input value={formData.product} onChange={(e) => setFormData({ ...formData, product: e.target.value })} placeholder="Product or item description" />
              </div>
              <div className="fg">
                <label>Quantity</label>
                <input type="number" min={1} value={formData.qty} onChange={(e) => setFormData({ ...formData, qty: parseInt(e.target.value, 10) || 1 })} />
              </div>
              <div className="fg">
                <label>Unit Price</label>
                <input type="number" min={0} value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="fg">
                <label>Discount</label>
                <input type="number" min={0} value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="fg">
                <label>Tax</label>
                <input type="number" min={0} value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="fg">
                <label>Shipping</label>
                <input type="number" min={0} value={formData.shipping} onChange={(e) => setFormData({ ...formData, shipping: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="form-grid">
              <div className="fg">
                <label>Payment Method</label>
                <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                  {PAYMENT_TERMS.map((method) => (<option key={method}>{method}</option>))}
                </select>
              </div>
              <div className="fg">
                <label>Payment Status</label>
                <select value={formData.paymentStatus} onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as 'PAID' | 'CREDIT' | 'PART PAYMENT' | 'OVERDUE' })}>
                  <option value="PAID">Paid</option>
                  <option value="PART PAYMENT">Part Payment</option>
                  <option value="CREDIT">Credit</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
              <div className="fg">
                <label>Amount Paid</label>
                <input type="number" min={0} value={formData.amountPaid} onChange={(e) => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="fg">
                <label>Due Date</label>
                <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
              </div>
              <div className="fg">
                <label>Notes</label>
                <input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional remarks" />
              </div>
            </div>

            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSavePurchase}>Save Purchase</button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {showImportModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="card-hd">
                <div>
                  <div className="card-title">Import Purchases</div>
                  <div className="section-subtitle">Upload an Excel file to import purchase history.</div>
                </div>
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => setShowImportModal(false)}>Close</button>
              </div>
              <div className="form-grid" style={{ gap: '16px' }}>
                <div className="fg">
                  <label>Excel file</label>
                  <input type="file" accept=".xlsx,.xls" onChange={handlePurchaseFileChange} />
                </div>
                {importFileName && <div className="import-summary">Selected file: {importFileName}</div>}
                {importError && <div className="error-text">{importError}</div>}
                {importRows.length > 0 && (
                  <div className="import-summary">{importRows.length} purchase rows ready to import.</div>
                )}
              </div>
              <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" type="button" disabled={importRows.length === 0} onClick={processPurchaseImport}>Import {importRows.length} rows</button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowImportModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="module-header">
          <div>
            <div className="module-title">Purchases</div>
            <div className="module-subtitle">Centralize supplier orders, manage procurement approvals, and keep outstanding payables in control.</div>
          </div>
          <div className="module-actions">
            <BulkImport label="Bulk upload" />
            <button className="btn btn-secondary" onClick={() => setShowFilters((prev) => !prev)}>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>Import</button>
            <button className="btn btn-secondary allow-readonly" onClick={handleExportPurchases}>Export</button>
            <button className="btn btn-secondary" onClick={handleRefreshPurchases}>Refresh</button>
            <button className="btn btn-primary" onClick={handleNewPurchase}>{showForm ? 'Close Form' : '+ New Purchase'}</button>
          </div>
        </div>

        <div className="dashboard-card-grid">
          <div className="dashboard-card">
            <div className="metric-label">Total Purchases</div>
            <div className="metric-value">{formatCurrency(summary.totalPurchases)}</div>
          </div>
          <div className="dashboard-card">
            <div className="metric-label">Paid Purchases</div>
            <div className="metric-value">{formatCurrency(summary.paidPurchases)}</div>
          </div>
          <div className="dashboard-card">
            <div className="metric-label">Outstanding</div>
            <div className="metric-value">{formatCurrency(summary.outstandingBalance)}</div>
          </div>
          <div className="dashboard-card">
            <div className="metric-label">Overdue</div>
            <div className="metric-value">{formatCurrency(summary.overdueAmount)}</div>
          </div>
          <div className="dashboard-card">
            <div className="metric-label">This Month</div>
            <div className="metric-value">{formatCurrency(summary.monthAmount)}</div>
          </div>
          <div className="dashboard-card">
            <div className="metric-label">Supplier Count</div>
            <div className="metric-value">{summary.supplierCount}</div>
          </div>
        </div>

        {showFilters && (
          <div className="filter-panel">
            <div className="section-head">
              <div>
                <div className="card-title">Purchase Filters</div>
                <div className="section-subtitle">Narrow purchase entries by supplier, status, branch, category, and date.</div>
              </div>
            </div>
            <div className="filter-row">
              <label>
                Search
                <input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} placeholder="Invoice, supplier, product, purchase order..." />
              </label>
              <label>
                Supplier
                <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                  {uniqueSuppliers.map((supplier) => (<option key={supplier}>{supplier}</option>))}
                </select>
              </label>
              <label>
                Purchase Status
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  {purchaseStatuses.map((status) => (<option key={status}>{status}</option>))}
                </select>
              </label>
              <label>
                Payment Method
                <select value={selectedPaymentMethod} onChange={(e) => setSelectedPaymentMethod(e.target.value)}>
                  {paymentMethods.map((method) => (<option key={method}>{method}</option>))}
                </select>
              </label>
              <label>
                Branch
                <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                  {branchOptions.map((branch) => (<option key={branch}>{branch}</option>))}
                </select>
              </label>
              <label>
                Category
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  {categories.map((category) => (<option key={category}>{category}</option>))}
                </select>
              </label>
              <label>
                Date Range
                <select value={selectedDateRange} onChange={(e) => setSelectedDateRange(e.target.value)}>
                  {datePresets.map((preset) => (<option key={preset}>{preset}</option>))}
                </select>
              </label>
              {selectedDateRange === 'Custom Date' && (
                <>
                  <label>
                    From
                    <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                  </label>
                  <label>
                    To
                    <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                  </label>
                </>
              )}
            </div>
          </div>
        )}

        <div className="module-content-grid">
          <div>
            <div className="card">
              <div className="card-hd">
                <div className="card-title">Procurement Ledger</div>
                <div className="table-summary">Showing {filteredPurchases.length} purchase{filteredPurchases.length === 1 ? '' : 's'}</div>
              </div>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Purchase ID</th>
                      <th>Date</th>
                      <th>Supplier</th>
                      <th>Invoice</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
                          No purchases match current filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedPurchases.map((purchase) => {
                        const paid = purchase.amountPaid ?? (purchase.paymentStatus === 'PAID' ? purchase.total : 0)
                        const balance = Math.max(0, purchase.total - paid)
                        return (
                          <tr key={purchase.id} onClick={() => setSelectedPurchaseId(purchase.id)} className={selectedPurchaseId === purchase.id ? 'selected' : ''}>
                            <td>{purchase.id}</td>
                            <td>{purchase.date}</td>
                            <td>{purchase.supplier}</td>
                            <td>{purchase.invoiceNumber || '-'}</td>
                            <td>{purchase.items?.length ?? 1}</td>
                            <td>{formatCurrency(purchase.total)}</td>
                            <td>{formatCurrency(paid)}</td>
                            <td>{formatCurrency(balance)}</td>
                            <td><span className={`badge ${getStatusBadgeClass(purchase.status)}`}>{purchase.status}</span></td>
                            <td><span className={`badge ${getStatusBadgeClass(purchase.paymentStatus)}`}>{purchase.paymentStatus}</span></td>
                            <td>
                              <button className="btn btn-sm btn-secondary" type="button">Details</button>
                              {canEdit(user?.role || '') && purchase.status !== 'Cancelled' && (
                                <button className="btn btn-sm btn-danger" type="button" onClick={() => handleCancelPurchase(purchase.id)}>Cancel</button>
                              )}
                            </td>
                          </tr>
                        )
                      })
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
              <div className="detail-section-title">Purchase Details</div>
              <div className="detail-row"><span>ID</span><strong>{selectedPurchase?.id || '-'}</strong></div>
              <div className="detail-row"><span>Date</span><strong>{selectedPurchase?.date || '-'}</strong></div>
              <div className="detail-row"><span>Supplier</span><strong>{selectedPurchase?.supplier || '-'}</strong></div>
              <div className="detail-row"><span>Invoice</span><strong>{selectedPurchase?.invoiceNumber || '-'}</strong></div>
              <div className="detail-row"><span>Purchase Order</span><strong>{selectedPurchase?.purchaseOrder || '-'}</strong></div>
              <div className="detail-row"><span>Branch</span><strong>{selectedPurchase?.branch || '-'}</strong></div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Supplier Snapshot</div>
              <div className="detail-row"><span>Supplier</span><strong>{selectedPurchase?.supplier || '-'}</strong></div>
              <div className="detail-row"><span>Last Invoice</span><strong>{selectedPurchase?.invoiceNumber || '-'}</strong></div>
              <div className="detail-row"><span>Payment Method</span><strong>{selectedPurchase?.paymentMethod || '-'}</strong></div>
              <div className="detail-row"><span>Due Date</span><strong>{selectedPurchase?.dueDate || '-'}</strong></div>
              <div className="detail-row"><span>Status</span><strong>{selectedPurchase?.status || '-'}</strong></div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Line Items</div>
              <div className="tbl-wrap" style={{ maxHeight: 240, overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseDetailItems.map((item, index) => (
                      <tr key={`${selectedPurchase?.id}-item-${index}`}>
                        <td>{item.product}</td>
                        <td>{item.qty}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td>{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Payment Summary</div>
              <div className="detail-row"><span>Subtotal</span><strong>{formatCurrency((selectedPurchase?.qty ?? 0) * (selectedPurchase?.unitPrice ?? 0))}</strong></div>
              <div className="detail-row"><span>Discount</span><strong>{formatCurrency(selectedPurchase?.discount ?? 0)}</strong></div>
              <div className="detail-row"><span>Tax</span><strong>{formatCurrency(selectedPurchase?.tax ?? 0)}</strong></div>
              <div className="detail-row"><span>Shipping</span><strong>{formatCurrency(selectedPurchase?.transCost ?? 0)}</strong></div>
              <div className="detail-row"><span>Grand Total</span><strong>{formatCurrency(selectedPurchase?.total ?? 0)}</strong></div>
              <div className="detail-row"><span>Paid</span><strong>{formatCurrency(selectedPurchase?.amountPaid ?? 0)}</strong></div>
              <div className="detail-row"><span>Balance</span><strong>{formatCurrency(Math.max(0, (selectedPurchase?.total ?? 0) - (selectedPurchase?.amountPaid ?? 0)))}</strong></div>
            </div>

            <div className="workflow-panel">
              <div className="detail-section-title">Procurement workflow</div>
              {['Supplier requested', 'Order approved', 'Goods received', 'Invoice recorded', 'Payment processed', 'Ledger updated', 'Monthly close captured'].map((step) => (
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
            <div className="chart-card-title">Supplier Spend Trend</div>
            <div className="chart-placeholder">Chart placeholder</div>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">Outstanding Payments</div>
            <div className="chart-placeholder">Chart placeholder</div>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">Top Supplier Spend</div>
            <div className="chart-placeholder">{topSuppliers.map((supplier) => (
              <div key={supplier.supplier} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span>{supplier.supplier}</span>
                <strong>{formatCurrency(supplier.amount)}</strong>
              </div>
            ))}</div>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">Purchase Category Mix</div>
            <div className="chart-placeholder">Chart placeholder</div>
          </div>
        </div>

        <div className="reports-row">
          <button className="btn btn-secondary">Supplier Statement</button>
          <button className="btn btn-secondary">Purchase Ledger</button>
          <button className="btn btn-secondary">Outstanding Payables</button>
          <button className="btn btn-secondary">Inventory Receipts</button>
          <button className="btn btn-secondary">Payment History</button>
          <button className="btn btn-secondary">Approval Audit</button>
        </div>
      </div>
    </AppLayout>
  )
}
