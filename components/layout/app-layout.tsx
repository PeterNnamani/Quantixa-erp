'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useAccounting } from '@/lib/context'
import { usePathname, useRouter } from 'next/navigation'
import { triggerAppToast, formatCurrencyOrZero } from '@/lib/utils'
import { canAccessRoute } from '@/lib/rbac'
import Navigation from './navigation'
import Topbar from './topbar'

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAccounting()
  const router = useRouter()
  const pathname = usePathname()
  const [isQUANTIXAOpen, setIsQUANTIXAOpen] = useState(false)
  const [orbHovered, setOrbHovered] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  const [queryText, setQueryText] = useState('')
  const [recentCommand, setRecentCommand] = useState('Ask about cash, loans, or audit insights.')
  const [toast, setToast] = useState<{ title: string; description: string } | null>(null)
  const [lastAction, setLastAction] = useState('No action yet')

  const pageConfig = useMemo(() => {
    if (pathname?.startsWith('/loans')) {
      return {
        copy: "I’m tracking company debt, repayment timing, interest, and cash impact for the Loans page.",
        highlights: [
          { label: 'Outstanding', value: formatCurrencyOrZero(0) },
          { label: 'Next payment', value: formatCurrencyOrZero(0) },
          { label: 'Health', value: '—' },
        ],
        prediction: `Upcoming ${formatCurrencyOrZero(0)} debt service is due in 30 days. Keep liquidity in view.`,
        bullets: ['Monitor cash flow before early settlement', 'Review lender exposures', 'Watch covenant or refinance triggers'],
        recommendation: 'Consider prioritizing GTBank and investor loan payments.',
        memory: [
          { date: 'Jul 29', text: 'Loan payment schedule updated.' },
          { date: 'Jul 15', text: 'New GTBank facility approved.' },
          { date: 'Jun 20', text: 'Debt ratio fell below 34%.' },
        ],
        inputHint: 'loan payment, lender risk, debt ratio',
        voiceHint: 'Ask QUANTIXA about loans, repayment, or cash impact.',
      }
    }

    if (pathname?.startsWith('/prepayments')) {
      return {
        copy: 'I’m surfacing prepaid expense recognition, delivery timing, and unused advance balances.',
        highlights: [
          { label: 'Prepaid cash', value: formatCurrencyOrZero(0) },
          { label: 'Remaining', value: formatCurrencyOrZero(0) },
          { label: 'Schedules', value: '0 active' },
        ],
        prediction: 'A large prepaid insurance renewal is nearing recognition in 45 days.',
        bullets: ['Track expiring prepayments', 'Confirm supplier deliveries', 'Adjust recognition schedules'],
        recommendation: 'Audit unused advances before month-end.',
        memory: [
          { date: 'Jul 05', text: 'Insurance prepayment posted.' },
          { date: 'Jun 22', text: 'Recognition schedule created for rent.' },
          { date: 'May 10', text: 'Supplier advance under review.' },
        ],
        inputHint: 'prepayment, schedule, recognition',
        voiceHint: 'Ask QUANTIXA about prepaid expenses or schedules.',
      }
    }

    if (pathname?.startsWith('/supplier-rebates')) {
      return {
        copy: 'I’m highlighting rebate programs, pending settlements, and supplier return performance.',
        highlights: [
          { label: 'Pending', value: formatCurrencyOrZero(0) },
          { label: 'Estimated', value: formatCurrencyOrZero(0) },
          { label: 'Claims', value: '0 open' },
        ],
        prediction: 'Several supplier claims are due for settlement this quarter.',
        bullets: ['Validate rebate contracts', 'Match invoices to claims', 'Anticipate cash receipts'],
        recommendation: 'Escalate rebates with highest maturity.',
        memory: [
          { date: 'Jul 20', text: 'New supplier rebate program added.' },
          { date: 'Jul 12', text: 'Rebate payment received from vendor.' },
          { date: 'Jun 28', text: 'Rebate eligibility review completed.' },
        ],
        inputHint: 'supplier rebate, claim status, payable impact',
        voiceHint: 'Ask QUANTIXA about rebate progress and cash recovery.',
      }
    }

    return {
      copy: 'I’m monitoring your business and surfacing the most relevant insights for the current page.',
      highlights: [
        { label: 'Cash', value: formatCurrencyOrZero(0) },
        { label: 'Revenue', value: '—' },
        { label: 'Expenses', value: '—' },
      ],
      prediction: 'Cash may tighten in 18 days if spend stays elevated.',
      bullets: ['Watch supplier payouts', 'Review month-end accruals', 'Check bank liquidity'],
      recommendation: 'Focus on cash flow and payables timing this week.',
      memory: [
        { date: 'Jul 29', text: 'Revenue spike detected.' },
        { date: 'Jul 22', text: 'Marketing campaign increased sales.' },
        { date: 'Jun 14', text: 'Inventory shortage happened.' },
      ],
      inputHint: 'cash, revenue, or expense health',
      voiceHint: 'Ask QUANTIXA about company financial health.',
    }
  }, [pathname])

  useEffect(() => {
    if (!user) {
      router.replace('/')
      return
    }

    if (!canAccessRoute(user, pathname || '/dashboard')) {
      router.replace('/dashboard')
    }
  }, [router, user, pathname])

  useEffect(() => {
    let timeoutId: number | undefined

    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<{ title?: string; description?: string }>).detail
      setToast({
        title: detail?.title || 'Action completed',
        description: detail?.description || 'The workspace action is now live.',
      })

      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }

      timeoutId = window.setTimeout(() => setToast(null), 2600)
    }

    window.addEventListener('hw:toast', handleToast as EventListener)

    return () => {
      window.removeEventListener('hw:toast', handleToast as EventListener)
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      const interactive = target.closest('button, [role="button"], a[href], .option-card, .faq-question, .history-row, .report-button, .quick-action-button')
      if (!interactive) return

      const labelText = (interactive as HTMLElement).textContent?.trim() || (interactive as HTMLElement).getAttribute('aria-label') || 'Action'
      const isLink = (interactive as HTMLElement).tagName.toLowerCase() === 'a'
      const normalizedLabel = labelText.toLowerCase()

      setLastAction(labelText.slice(0, 60) || 'Action')

      if (isLink) {
        triggerAppToast('Opening view', `Loading ${labelText}`)
        return
      }

      if (/export|print|download|pdf|excel|report/i.test(normalizedLabel)) {
        triggerAppToast('Action ready', `${labelText} is now ready.`)
        return
      }

      if (/new|add|create|generate|save|record|send|reconcile|archive|close|run|schedule|bulk|preview|transfer|compare|import|calculate|review|open|select/i.test(normalizedLabel)) {
        triggerAppToast('Action started', `${labelText} is now running in this workspace.`)
        return
      }

      triggerAppToast(labelText.slice(0, 60), 'The action has been queued for this workspace.')
    }

    window.addEventListener('click', handleGlobalClick, true)

    return () => {
      window.removeEventListener('click', handleGlobalClick, true)
    }
  }, [])

  if (!user) {
    return null
  }

  if (!canAccessRoute(user, pathname || '/dashboard')) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div className="panel-card" style={{ maxWidth: '420px', textAlign: 'center' }}>
          <div className="eyebrow">Permission denied</div>
          <h2 className="page-title" style={{ fontSize: '24px', marginBottom: '8px' }}>This area is not available for your role.</h2>
          <p className="page-subtitle">Ask a Super Admin to grant access to this module or switch to a role with the needed permissions.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="app">
        <Topbar user={user} onLogout={logout} />
        <div className="layout">
          <Navigation userRole={user.role} />
          <div className="main-area">
            {children}
          </div>
        </div>

        <div className="quantixa-root">
          {toast && (
            <div
              style={{
                position: 'fixed',
                right: '20px',
                bottom: '20px',
                zIndex: 9999,
                minWidth: '260px',
                maxWidth: '360px',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(8, 15, 32, 0.95)',
                color: '#f8fafc',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.28)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{toast.title}</div>
              <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{toast.description}</div>
            </div>
          )}
          <button
            type="button"
            className={`quantixa-orb ${orbHovered ? 'hovered' : ''} ${isQUANTIXAOpen ? 'active' : ''}`}
            onMouseEnter={() => setOrbHovered(true)}
            onMouseLeave={() => setOrbHovered(false)}
            onClick={() => setIsQUANTIXAOpen((prev) => !prev)}
            aria-label="Open QUANTIXA Intelligence Core"
          >
            <span className="quantixa-orb-energy" />
            <span className="quantixa-orb-core" aria-hidden="true">
              <img className="quantixa-logo" src="/quantixa.png" alt="QUANTIXA logo" />
            </span>
          </button>

          {isQUANTIXAOpen && (
            <div className="quantixa-panel">
              <div className="quantixa-panel-header">
                <div>
                  <span className="quantixa-panel-title">QUANTIXA</span>
                  <p className="quantixa-panel-subtitle">The Intelligence Core</p>
                </div>
                <button
                  type="button"
                  className="quantixa-close"
                  onClick={() => setIsQUANTIXAOpen(false)}
                  aria-label="Close QUANTIXA"
                >
                  ×
                </button>
              </div>
              <div className="quantixa-panel-copy">
                Good evening {user?.name}. I&apos;m monitoring your business and ready to assist across every page.
              </div>
              <div className="quantixa-highlights">
                <div className="quantixa-highlight-card">
                  <span>Revenue</span>
                  <strong>↑ 18%</strong>
                  <small>Compared to yesterday</small>
                </div>
                <div className="quantixa-highlight-card">
                  <span>Expenses</span>
                  <strong>↓ 6%</strong>
                  <small>Cash efficiency improved</small>
                </div>
                <div className="quantixa-highlight-card">
                  <span>Cash</span>
                  <strong>{formatCurrencyOrZero(0)}</strong>
                  <small>Healthy liquidity position</small>
                </div>
              </div>
              <div className="quantixa-panel-grid">
                <section>
                  <div className="quantixa-section-title">Prediction</div>
                  <p className="quantixa-prediction-copy">Your cash balance may reduce below ₦5M in 18 days.</p>
                  <div className="quantixa-bullet-list">
                    <div className="quantixa-bullet-item">• High supplier payments</div>
                    <div className="quantixa-bullet-item">• Increased expenses</div>
                  </div>
                  <div className="quantixa-recommendation">Delay non-essential purchases.</div>
                </section>
                <section>
                  <div className="quantixa-section-title">Business Memory</div>
                  <div className="quantixa-memory-list">
                    <div className="quantixa-memory-item">
                      <span>July 29</span>
                      <p>Revenue spike detected.</p>
                    </div>
                    <div className="quantixa-memory-item">
                      <span>July 22</span>
                      <p>Marketing campaign increased sales.</p>
                    </div>
                    <div className="quantixa-memory-item">
                      <span>June 14</span>
                      <p>Inventory shortage happened.</p>
                    </div>
                  </div>
                </section>
              </div>
              <div className="quantixa-command-card">
                <div className="quantixa-command-label">QUANTIXA Input</div>
                <div className="quantixa-input-row">
                  <input
                    className="quantixa-input"
                    value={queryText}
                    onChange={(event) => setQueryText(event.target.value)}
                    placeholder={`Type to QUANTIXA about ${pageConfig.inputHint}`}
                  />
                  <button
                    type="button"
                    className="quantixa-input-button"
                    onClick={() => setRecentCommand(queryText || 'Review cash flow and loan timing.')}
                  >
                    Send
                  </button>
                </div>
                <div className="quantixa-command-details">
                  <span>Recent command</span>
                  <strong>{recentCommand}</strong>
                </div>
              </div>
              <div className="quantixa-voice-bar">
                <button
                  type="button"
                  className={`quantixa-voice-button ${voiceActive ? 'listening' : ''}`}
                  onClick={() => setVoiceActive((prev) => !prev)}
                >
                  {voiceActive ? '🎙 Listening…' : '🎙 Ask QUANTIXA'}
                </button>
                <span>{voiceActive ? `Listening for ${pageConfig.inputHint} commands...` : pageConfig.voiceHint}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
