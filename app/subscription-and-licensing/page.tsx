'use client'

import AppLayout from '@/components/layout/app-layout'

type FeatureSection = {
    title: string
    items: string[]
}

type PlanCard = {
    name: string
    price: string
    description: string
    idealFor: string[]
    sections: FeatureSection[]
    supportFee: string
    highlight?: boolean
}

const plans: PlanCard[] = [
    {
        name: 'Growth Edition',
        price: '₦450,000',
        description: 'Ideal for small businesses, retail stores, pharmacies, start-ups, and small distributors.',
        idealFor: ['Small businesses', 'Retail stores', 'Pharmacies', 'Start-ups', 'Small distributors'],
        supportFee: '₦15,000',
        sections: [
            {
                title: 'Core Operations',
                items: [
                    'Sales Management',
                    'Purchase Management',
                    'Inventory Management',
                    'Customer Management',
                    'Supplier Management',
                    'Expense Management',
                    'Cash & Bank Management',
                ],
            },
            {
                title: 'Accounting',
                items: ['General Ledger', 'Accounts Receivable', 'Accounts Payable', 'Basic Financial Statements'],
            },
            {
                title: 'Reports',
                items: ['Sales Reports', 'Inventory Reports', 'Customer Statements', 'Profit & Loss', 'Balance Sheet'],
            },
            {
                title: 'Administration',
                items: ['1 User Only', 'Role-Based Access Control', 'Audit Trail', 'Basic Dashboard'],
            },
        ],
    },
    {
        name: 'Professional Edition',
        price: '₦650,000',
        description: 'Designed for growing businesses that need broader operational control and deeper reporting.',
        idealFor: ['Growing businesses', 'Multi-location operations', 'Businesses with stock movement complexity', 'Teams that need approvals'],
        supportFee: '₦25,000',
        sections: [
            {
                title: 'Multi-Location',
                items: ['Multiple Warehouses', 'Multiple Store Locations'],
            },
            {
                title: 'Inventory',
                items: ['Batch Tracking', 'Expiry Date Tracking', 'Barcode Support', 'Stock Transfers'],
            },
            {
                title: 'Sales',
                items: ['Sales Quotations', 'Sales Orders', 'Customer Credit Limits'],
            },
            {
                title: 'Purchasing',
                items: ['Purchase Orders', 'Supplier Price Lists'],
            },
            {
                title: 'Accounting',
                items: ['Bank Reconciliation', 'Budget Management'],
            },
            {
                title: 'Reports',
                items: ['Executive Dashboard', 'Profitability Analysis', 'Sales Performance Analysis'],
            },
            {
                title: 'Administration',
                items: ['Up to 5 Users', 'Approval Workflow', 'Activity Monitoring'],
            },
        ],
        highlight: true,
    },
    {
        name: 'Enterprise Edition',
        price: '₦900,000',
        description: 'For medium and large organizations that need branch consolidation, governance, and advanced analytics.',
        idealFor: ['Medium & large organizations', 'Multi-branch businesses', 'Organizations with HR & CRM needs', 'Enterprises requiring advanced reporting'],
        supportFee: '₦60,000',
        sections: [
            {
                title: 'Multi-Branch',
                items: ['Unlimited Branches', 'Branch Consolidation'],
            },
            {
                title: 'Human Resources',
                items: ['Staff Management', 'Leave Management', 'Payroll Integration'],
            },
            {
                title: 'CRM',
                items: ['Lead Management', 'Opportunity Tracking', 'Customer Interaction History'],
            },
            {
                title: 'Procurement',
                items: ['Purchase Approval Workflow', 'Supplier Evaluation'],
            },
            {
                title: 'Advanced Accounting',
                items: ['Cost Centres', 'Departmental Reporting', 'Project Accounting', 'Advanced Financial Reports'],
            },
            {
                title: 'Executive Features',
                items: ['KPI Dashboard', 'Business Intelligence Reports', 'Custom Report Builder'],
            },
            {
                title: 'Administration',
                items: ['Unlimited Users', 'Multi-Level Approval', 'Advanced Security', 'Two-Factor Authentication'],
            },
        ],
    },
]

export default function SubscriptionAndLicensingPage() {
    return (
        <AppLayout>
            <div className="pricing-page">
                <div className="pricing-hero">
                    <div>
                        <div className="eyebrow">Subscription & Licensing</div>
                        <h1 className="pricing-title">QUANTIXA licensing structure</h1>
                        <p className="pricing-copy">Choose the edition that matches your business today and your growth plans tomorrow. Every edition is backed by a one-time licence fee and a monthly support and maintenance subscription.</p>
                    </div>
                    <div className="hero-actions">
                        <div className="pricing-note">All plans include support, maintenance, and access to core ERP capabilities.</div>
                    </div>
                </div>

                <div className="pricing-card-grid">
                    {plans.map((plan) => (
                        <div key={plan.name} className={plan.highlight ? 'pricing-card highlight' : 'pricing-card'}>
                            <div className="plan-preface">
                                <span className="plan-label">{plan.name}</span>
                                {plan.highlight && <span className="plan-badge">Most popular</span>}
                            </div>
                            <div className="plan-price">
                                <span>{plan.price}</span>
                                <span>One-time licence</span>
                            </div>
                            <div className="plan-maintenance-highlight">
                                <span className="plan-maintenance-label">Support & Maintenance</span>
                                <span className="plan-maintenance-value">{plan.supportFee}/mo</span>
                            </div>
                            <p className="plan-description">{plan.description}</p>
                            <div className="plan-ideal">
                                <h3>Ideal for</h3>
                                <p>{plan.idealFor.join(' • ')}</p>
                            </div>
                            <div className="plan-sections">
                                {plan.sections.map((section) => (
                                    <div className="plan-section" key={section.title}>
                                        <h4 className="plan-section-title">{section.title}</h4>
                                        <ul className="plan-features">
                                            {section.items.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <button type="button" className="btn btn-primary plan-button">
                                Purchase
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    )
}
