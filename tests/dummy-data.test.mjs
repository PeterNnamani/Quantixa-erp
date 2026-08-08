import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const dashboardPath = path.join(repoRoot, 'app/dashboard/page.tsx')
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8')

test('dashboard computes inventory counts from state.inventory', () => {
    assert.match(dashboardContent, /const lowStock = state\.inventory\.filter\(\(item\) => item\.closing > 0 && item\.closing <= 10\)\.length/)
    assert.match(dashboardContent, /const outOfStock = state\.inventory\.filter\(\(item\) => item\.closing <= 0\)\.length/)
    assert.match(dashboardContent, /const expiring = state\.inventory\.filter\(\(item\) => item\.closing > 0 && item\.closing <= 5\)\.length/)
})

test('dashboard uses derived sales and activity values instead of placeholders', () => {
    assert.equal(dashboardContent.includes('<strong>143</strong>'), false, 'dashboard still contains placeholder orders count')
    assert.equal(dashboardContent.includes('<strong>86</strong>'), false, 'dashboard still contains placeholder invoices count')
    assert.equal(dashboardContent.includes('Invoice INV-1034 created'), false, 'dashboard still contains placeholder recent activity message')
})

const filesToCheck = [
    'app/inventory/page.tsx',
    'app/product-manager/page.tsx',
    'app/daily-close/page.tsx',
    'app/annual-report/page.tsx',
    'app/supplier-rebates/page.tsx',
    'app/receivables/page.tsx',
    'app/payables/page.tsx',
]

const bannedPatterns = [
    { pattern: /value:\s*'19'/, description: 'inventory expiring-soon placeholder' },
    { pattern: /value:\s*formatNumber\(128\)/, description: 'product manager inactive placeholder' },
    { pattern: /value:\s*'53'/, description: 'product manager brands placeholder' },
    { pattern: /value:\s*'1,420'/, description: 'product manager variants placeholder' },
    { pattern: /const otherIncome = 15000/, description: 'daily close dummy other-income value' },
    { pattern: /const taxAmount = 22000/, description: 'daily close dummy tax value' },
    { pattern: /₦500M|₦700M|₦850M|19\.4%/, description: 'annual report dummy chart values' },
    { pattern: /value:\s*'\$4,850,000'|value:\s*'\$1,250,000'|value:\s*'\$3,600,000'|value:\s*'24'|value:\s*'5'|value:\s*'4\.8%'/, description: 'supplier rebate dummy summary values' },
    { pattern: /ABC Ltd|John Enterprises|Prime Stores|Elite Ventures|Tomorrow ·|This Week ·|Next Week ·|ap@dangotecement\.com/, description: 'receivables/payables demo content' },
]

for (const file of filesToCheck) {
    test(`does not contain dummy data in ${file}`, () => {
        const filePath = path.join(repoRoot, file)
        const content = fs.readFileSync(filePath, 'utf8')

        for (const { pattern, description } of bannedPatterns) {
            assert.equal(pattern.test(content), false, `${file} still contains ${description}`)
        }
    })
}
