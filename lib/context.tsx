'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase.browser'
import { getDefaultRoles, type PermissionKey, type RoleDefinition } from '@/lib/rbac'
import { createSeedLedgerData, postJournalEntry, findAccountByName } from '@/lib/ledger'
import { generateSku } from '@/lib/sku'

export interface User {
  companyId?: string
  companyName?: string
  name: string
  role: string
  roleId?: string
  permissions?: string[]
  dataScope?: 'own' | 'team' | 'branch' | 'all'
  branchId?: string
  staffId?: string
}

export interface StaffMember {
  id: string
  name: string
  staffId: string
  pin: string
  roleId: string
  roleName: string
  permissions: PermissionKey[]
  dataScope: 'own' | 'team' | 'branch' | 'all'
  status: 'active' | 'disabled'
  createdAt: string
  username?: string
  password?: string
  branch?: string
  department?: string
  position?: string
  phone?: string
  email?: string
  dateOfBirth?: string
  gender?: string
  passportPhoto?: string
  employeeId?: string
  lastLogin?: string
}

export interface Sale {
  id: string
  date: string
  customer: string
  items: Array<{
    product: string
    dept: string
    qty: number
    unitPrice: number
    total: number
  }>
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  notes: string
  status: string
  enteredBy: string
}

export interface Purchase {
  id: string
  date: string
  dept: string
  product: string
  qty: number
  unitPrice: number
  transCost: number
  discount: number
  total: number
  supplier: string
  bank: string
  paymentStatus: string
  dueDate: string
  notes: string
  status: string
  enteredBy: string
  invoiceNumber?: string
  purchaseOrder?: string
  branch?: string
  warehouse?: string
  category?: string
  paymentMethod?: string
  items?: Array<{
    product: string
    sku?: string
    qty: number
    unitPrice: number
    discount: number
    tax?: number
    total: number
  }>
  amountPaid?: number
  balance?: number
  employee?: string
}

export interface Expense {
  id: string
  date: string
  desc: string
  category: string
  amount: number
  bank: string
  notes: string
  status: string
  enteredBy: string
}

export interface InventoryItem {
  product: string
  sku?: string
  barcode?: string
  description?: string
  branch?: string
  dept: string
  subCategory?: string
  brand?: string
  uom?: string
  packSize?: string
  baseUnit?: string
  conversionFactor?: number
  openQty: number
  purchased: number
  sold: number
  reserved?: number
  unitCost: number
  averageCost?: number
  sellingPrice?: number
  closing: number
  reorderLevel?: number
  reorderQuantity?: number
  maximumStockLevel?: number
  supplier?: string
  batchNumber?: string
  expiryDate?: string
  manufacturingDate?: string
  lastPurchaseDate?: string
  lastSaleDate?: string
  active?: boolean
  remarks?: string
  damagedExpired?: number
}

export interface PrepaymentSchedule {
  id: string
  period: string
  amount: number
  recognized: boolean
  completed: boolean
  recognitionDate: string | null
}

export interface Prepayment {
  id: string
  reference: string
  type: string
  supplier: string
  originalAmount: number
  usedAmount: number
  remainingAmount: number
  startDate: string
  endDate: string
  paymentMethod: string
  bankAccount: string
  referenceNo: string
  recordedBy: string
  recognitionStatus: string
  recognitionProgress: number
  status: string
  notes: string
  datePaid: string
  category: string
  paymentSource: string
  schedule: PrepaymentSchedule[]
}

export interface AuditLog {
  timestamp: string
  action: string
  type: string
  reference: string
  details: string
  user: string
}

export interface LedgerAccount {
  id: string
  code: string
  name: string
  accountType: string
  accountSubType?: string
  normalBalance: string
  isControlAccount?: boolean
  isActive?: boolean
  currency?: string
}

export interface JournalEntry {
  id: string
  entryDate: string
  periodId: string
  reference: string
  description: string
  sourceModule: string
  sourceId?: string | null
  status: string
  createdBy: string
  createdAt: string
}

export interface JournalLine {
  id: string
  entryId: string
  accountId: string
  debit: number
  credit: number
  description: string
}

export interface JournalPostInput {
  id?: string
  entryDate?: string
  periodId?: string
  reference?: string
  description?: string
  sourceModule?: string
  sourceId?: string | null
  status?: string
  createdBy?: string
  lines: Array<{ accountId: string; debit?: number; credit?: number; description?: string }>
}

export interface JournalPostResult {
  entry?: JournalEntry
  lines?: JournalLine[]
  error?: string
}

export interface AppState {
  sales: Sale[]
  purchases: Purchase[]
  expenses: Expense[]
  inventory: InventoryItem[]
  banks: Record<string, number>
  bankTxns: any[]
  receivables: any[]
  payables: any[]
  prepayments: Prepayment[]
  loans: any[]
  supplierList: string[]
  customerList: string[]
  auditLogs: AuditLog[]
  openingCapital: number
  dailyClose: any[]
  roles: RoleDefinition[]
  staffMembers: StaffMember[]
  chartOfAccounts: LedgerAccount[]
  accountingPeriods: any[]
  journalEntries: JournalEntry[]
  journalLines: JournalLine[]
}

export interface AccountingContextType {
  user: User | null
  state: AppState
  updateState: (updates: Partial<AppState>) => void
  login: (userData: User, remember: boolean) => void
  logout: () => void
  addAuditLog: (action: string, type: string, reference: string, details: string) => void
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined)

const STORAGE_KEY = 'hw_accounting_data'
const AUTH_KEY = 'hw_auth_user'
const REMEMBER_USERNAME_KEY = 'hw_remembered_username'

const defaultState: AppState = {
  sales: [],
  purchases: [],
  expenses: [],
  inventory: [],
  banks: {},
  bankTxns: [],
  receivables: [],
  payables: [],
  prepayments: [],
  loans: [],
  supplierList: [],
  customerList: [],
  auditLogs: [],
  openingCapital: 0,
  dailyClose: [],
  roles: getDefaultRoles(),
  staffMembers: [],
  chartOfAccounts: [],
  accountingPeriods: [],
  journalEntries: [],
  journalLines: [],
}

function normalizeRemoteSales(data: any[]): AppState['sales'] {
  return (data || []).map((item: any) => ({
    id: item.id,
    date: item.sale_date || item.created_at?.slice(0, 10) || '',
    customer: item.customer_name || item.customer_id || 'Unknown Customer',
    items: [],
    totalAmount: Number(item.total_amount || 0),
    paymentMethod: item.payment_method || '',
    paymentStatus: item.payment_status || '',
    notes: item.notes || '',
    status: item.status || '',
    enteredBy: item.created_by || 'System',
  }))
}

function normalizeRemotePurchases(data: any[]): AppState['purchases'] {
  return (data || []).map((item: any) => ({
    id: item.id,
    date: item.purchase_date || item.created_at?.slice(0, 10) || '',
    dept: item.department || '',
    product: item.product_name || item.reference || '',
    qty: Number(item.qty || 0),
    unitPrice: Number(item.unit_price || 0),
    transCost: Number(item.shipping || 0),
    discount: Number(item.discount || 0),
    total: Number(item.total || 0),
    supplier: item.supplier_name || item.supplier_id || 'Unknown Supplier',
    bank: item.bank || '',
    paymentStatus: item.payment_status || '',
    dueDate: item.due_date || '',
    notes: item.notes || '',
    status: item.status || '',
    enteredBy: item.created_by || 'System',
    invoiceNumber: item.invoice_number || '',
    purchaseOrder: item.purchase_order || '',
    branch: item.branch || '',
    warehouse: item.warehouse || '',
    category: item.category || '',
    paymentMethod: item.payment_method || '',
  }))
}

function normalizeRemoteExpenses(data: any[]): AppState['expenses'] {
  return (data || []).map((item: any) => ({
    id: item.id,
    date: item.expense_date || item.created_at?.slice(0, 10) || '',
    desc: item.description || item.reference || '',
    category: item.category || '',
    amount: Number(item.amount || 0),
    bank: item.bank_account_id || '',
    notes: item.notes || '',
    status: item.status || '',
    enteredBy: item.entered_by || 'System',
  }))
}

function normalizeRemoteInventory(data: any[]): AppState['inventory'] {
  return (data || []).map((item: any) => ({
    product: item.name || item.sku || item.id,
    sku: item.sku || '',
    barcode: item.barcode || '',
    description: item.description || '',
    branch: item.branch || '',
    dept: item.category || item.branch || 'General',
    subCategory: item.sub_category || '',
    brand: item.brand || '',
    uom: item.uom || 'Unit',
    packSize: item.pack_size || '',
    baseUnit: item.base_unit || '',
    conversionFactor: Number(item.conversion_factor || 1),
    openQty: Number(item.stock_qty || 0),
    purchased: 0,
    sold: 0,
    reserved: Number(item.reserved_qty || 0),
    unitCost: Number(item.unit_cost || 0),
    averageCost: Number(item.average_cost || item.unit_cost || 0),
    sellingPrice: Number(item.unit_price || 0),
    closing: Number(item.stock_qty || 0),
    reorderLevel: Number(item.reorder_level || 0),
    reorderQuantity: Number(item.reorder_quantity || 0),
    maximumStockLevel: Number(item.maximum_stock_level || 0),
    supplier: item.supplier || '',
    batchNumber: item.batch_number || '',
    expiryDate: item.expiry_date || '',
    manufacturingDate: item.manufacturing_date || '',
    lastPurchaseDate: item.last_purchase_date || '',
    lastSaleDate: item.last_sale_date || '',
    active: item.status !== 'inactive',
    remarks: item.remarks || '',
    damagedExpired: Number(item.damaged_expired || 0),
  }))
}

function normalizeInventorySkus(inventory: InventoryItem[]): InventoryItem[] {
  const usedSkus = inventory.map((item) => item.sku).filter((sku): sku is string => Boolean(sku))
  return inventory.map((item) => {
    if (item.sku) return item
    const sku = generateSku(item.product, usedSkus)
    usedSkus.push(sku)
    return { ...item, sku }
  })
}

function normalizeRemotePrepayments(data: any[]): AppState['prepayments'] {
  return (data || []).map((item: any) => ({
    id: item.id,
    reference: item.reference || item.id,
    type: item.prepayment_type || item.type || 'Prepayment',
    supplier: item.supplier || 'Unknown Supplier',
    originalAmount: Number(item.original_amount || item.amount || 0),
    usedAmount: Number(item.used_amount || item.amount_recognized || 0),
    remainingAmount: Number(item.remaining_amount || item.balance || 0),
    startDate: item.start_date || item.created_at?.slice(0, 10) || '',
    endDate: item.end_date || '',
    paymentMethod: item.payment_method || '',
    bankAccount: item.bank_account || '',
    referenceNo: item.reference_no || '',
    recordedBy: item.recorded_by || item.created_by || 'System',
    recognitionStatus: item.recognition_status || 'Not Started',
    recognitionProgress: Number(item.recognition_progress || 0),
    status: item.status || 'Active',
    notes: item.notes || '',
    datePaid: item.start_date || item.created_at?.slice(0, 10) || '',
    category: item.category || 'Supplier Advances',
    paymentSource: item.payment_method || 'Bank Account',
    schedule: Array.isArray(item.prepayment_schedules)
      ? item.prepayment_schedules.map((schedule: any) => ({
        id: schedule.id,
        period: schedule.period || '',
        amount: Number(schedule.amount || 0),
        recognized: Boolean(schedule.recognized),
        completed: Boolean(schedule.recognized),
        recognitionDate: schedule.recognition_date || null,
      }))
      : Array.isArray(item.schedule)
        ? item.schedule.map((schedule: any) => ({
          id: schedule.id || '',
          period: schedule.period || '',
          amount: Number(schedule.amount || 0),
          recognized: Boolean(schedule.recognized),
          completed: Boolean(schedule.recognized),
          recognitionDate: schedule.recognitionDate || null,
        }))
        : [],
  }))
}

function normalizeRemoteContacts(data: any[]) {
  const supplierList = (data || []).filter((item: any) => item.type === 'supplier').map((item: any) => item.name)
  const customerList = (data || []).filter((item: any) => item.type === 'customer').map((item: any) => item.name)
  return { supplierList, customerList }
}

export function AccountingProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [state, setState] = useState<AppState>(defaultState)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch persisted banks and bank transactions from Supabase when available
  useEffect(() => {
    let mounted = true

    async function loadRemoteData() {
      if (!supabase || !user?.companyId) return
      const companyId = user.companyId
      try {
        const [{ data: salesData, error: salesErr }, { data: purchasesData, error: purchasesErr }, { data: expensesData, error: expensesErr }, { data: inventoryData, error: inventoryErr }, { data: prepaymentsData, error: prepaymentsErr }, { data: contactsData, error: contactsErr }, { data: banksData, error: banksErr }, { data: txnsData, error: txnsErr }] = await Promise.all([
          supabase.from('sales').select('*').eq('company_id', companyId).order('sale_date', { ascending: false }).limit(200),
          supabase.from('purchases').select('*').eq('company_id', companyId).order('purchase_date', { ascending: false }).limit(200),
          supabase.from('expenses').select('*').eq('company_id', companyId).order('expense_date', { ascending: false }).limit(200),
          supabase.from('products').select('*').eq('company_id', companyId).order('updated_at', { ascending: false }).limit(200),
          supabase.from('prepayments').select('*, prepayment_schedules(*)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(200),
          supabase.from('contacts').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(200),
          supabase.from('bank_accounts').select('id,name,balance').eq('company_id', companyId).order('created_at', { ascending: false }).limit(100),
          supabase.from('bank_transactions').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(200),
        ])

        if (salesErr) console.error('Error loading sales from Supabase', salesErr)
        if (purchasesErr) console.error('Error loading purchases from Supabase', purchasesErr)
        if (expensesErr) console.error('Error loading expenses from Supabase', expensesErr)
        if (inventoryErr) console.error('Error loading inventory from Supabase', inventoryErr)
        if (prepaymentsErr) {
          if (prepaymentsErr.code === 'PGRST205') {
            console.warn('Supabase prepayments table not found. Skipping prepayments remote load.')
          } else {
            console.error('Error loading prepayments from Supabase', prepaymentsErr)
          }
        }
        if (contactsErr) console.error('Error loading contacts from Supabase', contactsErr)
        if (banksErr) console.error('Error loading bank accounts from Supabase', banksErr)
        if (txnsErr) console.error('Error loading bank transactions from Supabase', txnsErr)

        if (!mounted) return

        const remoteSales = salesData && salesData.length > 0 ? normalizeRemoteSales(salesData) : []
        const remotePurchases = purchasesData && purchasesData.length > 0 ? normalizeRemotePurchases(purchasesData) : []
        const remoteExpenses = expensesData && expensesData.length > 0 ? normalizeRemoteExpenses(expensesData) : []
        const remoteInventory = inventoryData && inventoryData.length > 0 ? normalizeRemoteInventory(inventoryData) : []
        const remotePrepayments = prepaymentsErr && prepaymentsErr.code === 'PGRST205'
          ? []
          : prepaymentsData && prepaymentsData.length > 0
            ? normalizeRemotePrepayments(prepaymentsData)
            : []
        const { supplierList, customerList } = normalizeRemoteContacts(contactsData || [])

        if (remoteSales.length > 0 || remotePurchases.length > 0 || remoteExpenses.length > 0 || remoteInventory.length > 0 || remotePrepayments.length > 0 || supplierList.length > 0 || customerList.length > 0) {
          setState((prev) => ({
            ...prev,
            sales: remoteSales.length > 0 ? remoteSales : prev.sales,
            purchases: remotePurchases.length > 0 ? remotePurchases : prev.purchases,
            expenses: remoteExpenses.length > 0 ? remoteExpenses : prev.expenses,
            inventory: remoteInventory.length > 0 ? remoteInventory : prev.inventory,
            prepayments: remotePrepayments.length > 0 ? remotePrepayments : prev.prepayments,
            supplierList: supplierList.length > 0 ? supplierList : prev.supplierList,
            customerList: customerList.length > 0 ? customerList : prev.customerList,
          }))
        }

        if (banksData && banksData.length > 0) {
          const banksMap: Record<string, number> = {}
          banksData.forEach((b: any) => { banksMap[b.name] = Number(b.balance || 0) })
          setState((prev) => ({ ...prev, banks: { ...prev.banks, ...banksMap } }))
        }

        if (txnsData && txnsData.length > 0) {
          const normalized = txnsData.map((t: any) => ({
            id: t.id,
            date: t.txn_date?.toString?.() || (t.txn_date ?? new Date().toISOString().slice(0, 10)),
            name: t.description ?? '',
            activity: t.description ?? '',
            method: 'Unknown',
            amount: Number(t.amount || 0),
            status: t.is_reconciled ? 'Completed' : 'Processing',
            description: t.description ?? '',
            attachments: 0,
            type: Number(t.amount) >= 0 ? 'Deposit' : 'Withdrawal',
            bank: t.bank_account_id,
            created_at: t.created_at,
          }))
          setState((prev) => ({ ...prev, bankTxns: normalized.concat(prev.bankTxns) }))
        }
      } catch (err) {
        console.error('Unable to load remote accounting data', err)
      }
    }

    loadRemoteData()

    return () => { mounted = false }
  }, [user?.companyId])

  useEffect(() => {
    // Intentionally do not seed demo ledger data on first load.
    // New installations should start with an empty `defaultState` so
    // the owner or super-admin can register the company and configure
    // the system (staff, banks, chart of accounts, opening balances, etc.).
    const savedState = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
    if (savedState) return
    // No action: keep `state` as `defaultState` until the owner performs setup.
  }, [])

  // Load from localStorage or sessionStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_KEY) ?? sessionStorage.getItem(AUTH_KEY)
    const savedState = user?.companyId
      ? localStorage.getItem(`${STORAGE_KEY}:${user.companyId}`)
      : null

    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      setState({
        ...defaultState,
        ...parsedState,
        inventory: Array.isArray(parsedState.inventory) ? normalizeInventorySkus(parsedState.inventory) : defaultState.inventory,
        roles: Array.isArray(parsedState.roles) && parsedState.roles.length > 0 ? parsedState.roles : defaultState.roles,
        staffMembers: Array.isArray(parsedState.staffMembers) ? parsedState.staffMembers : defaultState.staffMembers,
      })
    }
    setIsLoading(false)
  }, [user?.companyId])

  const updateState = (updates: Partial<AppState>) => {
    const companyId = user?.companyId
    setState((prev) => {
      const normalizedUpdates = updates.inventory
        ? { ...updates, inventory: normalizeInventorySkus(updates.inventory) }
        : updates
      const newState = { ...prev, ...normalizedUpdates }
      if (companyId) {
        localStorage.setItem(`${STORAGE_KEY}:${companyId}`, JSON.stringify(newState))
      }
      // Persist banks and bank transactions to Supabase where possible
      ; (async () => {
        if (!supabase || !companyId) return

        try {
          if (updates.prepayments) {
            const prepayments = updates.prepayments as Prepayment[]
            const prepaymentRows = prepayments.map((p) => ({
              company_id: companyId,
              id: p.id || undefined,
              reference: p.reference,
              prepayment_type: p.type,
              supplier: p.supplier,
              original_amount: p.originalAmount,
              used_amount: p.usedAmount,
              remaining_amount: p.remainingAmount,
              start_date: p.startDate || null,
              end_date: p.endDate || null,
              payment_method: p.paymentMethod,
              bank_account: p.bankAccount,
              reference_no: p.referenceNo,
              recorded_by: p.recordedBy,
              recognition_status: p.recognitionStatus,
              recognition_progress: p.recognitionProgress,
              status: p.status,
              notes: p.notes,
              updated_at: new Date().toISOString(),
            }))

            const { error: prepaymentsPersistErr } = await supabase.from('prepayments').upsert(prepaymentRows, { onConflict: 'reference' })
            if (prepaymentsPersistErr) {
              if (prepaymentsPersistErr.code === 'PGRST205') {
                console.warn('Supabase prepayments table not found. Skipping prepayments persistence.')
              } else {
                throw prepaymentsPersistErr
              }
            }
            const scheduleInserts = scheduleRows.filter((row) => !row.id && row.prepayment_id)

            if (scheduleUpserts.length > 0) {
              await supabase.from('prepayment_schedules').upsert(scheduleUpserts, { onConflict: 'id' })
            }
            if (scheduleInserts.length > 0) {
              await supabase.from('prepayment_schedules').insert(scheduleInserts)
            }
          }

          if (normalizedUpdates.inventory) {
            const inventoryRows = (normalizedUpdates.inventory as InventoryItem[]).map((item) => ({
              company_id: companyId,
              sku: item.sku,
              name: item.product,
              description: item.description || null,
              category: item.dept || 'General',
              unit_cost: item.unitCost || 0,
              average_cost: item.averageCost ?? item.unitCost ?? 0,
              unit_price: item.sellingPrice ?? item.unitCost ?? 0,
              stock_qty: item.closing || 0,
              reserved_qty: item.reserved || 0,
              expiry_date: item.expiryDate || null,
              damaged_expired: item.damagedExpired || 0,
              reorder_level: item.reorderLevel || 0,
              reorder_quantity: item.reorderQuantity || 0,
              maximum_stock_level: item.maximumStockLevel || 0,
              branch: item.branch || null,
              updated_at: new Date().toISOString(),
            }))
            const { error: inventoryPersistErr } = await supabase.from('products').upsert(inventoryRows, { onConflict: 'sku' })
            if (inventoryPersistErr) throw inventoryPersistErr
          }

          if (normalizedUpdates.banks) {
            const banksArray = Object.entries(normalizedUpdates.banks).map(([name, balance]) => ({ company_id: companyId, name, institution: name, balance }))
            await supabase.from('bank_accounts').upsert(banksArray, { onConflict: 'name' })
          }

          if (normalizedUpdates.bankTxns) {
            // Fetch bank accounts to get IDs by name
            const { data: accounts } = await supabase.from('bank_accounts').select('id,name').eq('company_id', companyId)
            const nameToId: Record<string, string> = {}
              ; (accounts || []).forEach((a: any) => { nameToId[a.name] = a.id })

            const txnsToInsert = (normalizedUpdates.bankTxns as any[]).map((t: any) => ({
              company_id: companyId,
              id: t.id?.startsWith('TXN-') ? undefined : t.id,
              bank_account_id: nameToId[t.bank] ?? null,
              txn_date: t.date ?? new Date().toISOString().slice(0, 10),
              description: t.description ?? t.name ?? '',
              amount: t.amount ?? 0,
              is_reconciled: t.status === 'Completed',
            })).filter((x) => x.bank_account_id)

            if (txnsToInsert.length > 0) {
              await supabase.from('bank_transactions').insert(txnsToInsert)
            }
          }
        } catch (err) {
          console.error('Error persisting accounting updates to Supabase', err)
        }
      })()

      return newState
    })
  }

  const login = (userData: User, remember: boolean) => {
    setUser(userData)
    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)

    const storage = remember ? localStorage : sessionStorage
    storage.setItem(AUTH_KEY, JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)
    window.location.href = '/'
  }

  const addAuditLog = (action: string, type: string, reference: string, details: string) => {
    const log: AuditLog = {
      timestamp: new Date().toISOString(),
      action,
      type,
      reference,
      details,
      user: user?.name || 'System',
    }
    updateState({
      auditLogs: [log, ...state.auditLogs].slice(0, 1000),
    })
  }

  const value: AccountingContextType = {
    user,
    state,
    updateState,
    login,
    logout,
    addAuditLog,
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <AccountingContext.Provider value={value}>
      {children}
    </AccountingContext.Provider>
  )
}

export function useAccounting() {
  const context = useContext(AccountingContext)
  if (!context) {
    throw new Error('useAccounting must be used within AccountingProvider')
  }
  return context
}
