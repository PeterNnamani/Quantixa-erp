export function createId(prefix, fallback = '0001') {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')
    return `${prefix}-${timestamp}-${random}`
}

export function roundCurrency(value) {
    return Number((value || 0).toFixed(2))
}

export function normalizeLine(line) {
    const debit = roundCurrency(line.debit || 0)
    const credit = roundCurrency(line.credit || 0)
    return {
        ...line,
        debit,
        credit,
    }
}

export function findAccountByName(accounts, name) {
    return accounts.find((account) => account.name === name || account.code === name)
}

export function buildSeedChartOfAccounts() {
    return [
        { id: 'acct-cash', code: '1000', name: 'Cash', accountType: 'ASSET', accountSubType: 'CURRENT_ASSET', normalBalance: 'DEBIT', isControlAccount: true, isActive: true, currency: 'NGN' },
        { id: 'acct-ar', code: '1100', name: 'Trade Receivables', accountType: 'ASSET', accountSubType: 'CURRENT_ASSET', normalBalance: 'DEBIT', isControlAccount: true, isActive: true, currency: 'NGN' },
        { id: 'acct-inventory', code: '1200', name: 'Inventory', accountType: 'ASSET', accountSubType: 'CURRENT_ASSET', normalBalance: 'DEBIT', isControlAccount: false, isActive: true, currency: 'NGN' },
        { id: 'acct-grn-clearing', code: '1250', name: 'GRN Clearing', accountType: 'LIABILITY', accountSubType: 'CURRENT_LIABILITY', normalBalance: 'CREDIT', isControlAccount: false, isActive: true, currency: 'NGN' },
        { id: 'acct-pp', code: '1300', name: 'Prepayments', accountType: 'ASSET', accountSubType: 'CURRENT_ASSET', normalBalance: 'DEBIT', isControlAccount: false, isActive: true, currency: 'NGN' },
        { id: 'acct-ap', code: '2000', name: 'Accounts Payable', accountType: 'LIABILITY', accountSubType: 'CURRENT_LIABILITY', normalBalance: 'CREDIT', isControlAccount: true, isActive: true, currency: 'NGN' },
        { id: 'acct-capital', code: '3000', name: 'Capital', accountType: 'EQUITY', accountSubType: 'OWNER_EQUITY', normalBalance: 'CREDIT', isControlAccount: false, isActive: true, currency: 'NGN' },
        { id: 'acct-revenue', code: '4000', name: 'Sales Revenue', accountType: 'INCOME', accountSubType: 'OPERATING_INCOME', normalBalance: 'CREDIT', isControlAccount: false, isActive: true, currency: 'NGN' },
        { id: 'acct-cogs', code: '5000', name: 'Cost of Goods Sold', accountType: 'EXPENSE', accountSubType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isControlAccount: false, isActive: true, currency: 'NGN' },
        { id: 'acct-expense', code: '5010', name: 'Expense Account', accountType: 'EXPENSE', accountSubType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isControlAccount: false, isActive: true, currency: 'NGN' },
    ]
}
