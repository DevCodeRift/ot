'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function BankingPage() {
  const { data: session, status } = useSession()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      redirect('/auth/signin')
      return
    }

    checkAccess()
  }, [session, status])

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/modules/banking/access')
      const result = await response.json()
      
      if (response.ok) {
        setHasAccess(true)
      } else {
        setHasAccess(false)
        setError(result.error || 'Access denied')
      }
    } catch (err) {
      setHasAccess(false)
      setError('Failed to check module access')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center">
        <div className="text-cp-text-primary font-cyberpunk text-xl">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cp-cyan mr-4"></div>
          Verifying access...
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center">
        <div className="bg-cp-bg-secondary border border-cp-red p-8 rounded-lg max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cp-red/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-cp-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-cp-red font-cyberpunk text-xl mb-4">Access Denied</h2>
          <p className="text-cp-text-secondary mb-6">{error}</p>
          <button 
            onClick={() => redirect('/dashboard')}
            className="bg-cp-bg-accent border border-cp-cyan px-4 py-2 rounded text-cp-cyan hover:bg-cp-cyan hover:text-cp-bg-primary transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cp-bg-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-cyberpunk text-cp-yellow mb-2 glowing-text">
            Banking & Economics
          </h1>
          <p className="text-cp-text-secondary text-lg">
            Manage alliance bank, track taxes, and monitor economic metrics
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-yellow transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-yellow/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Bank Overview</h3>
            <p className="text-cp-text-secondary text-sm">Monitor alliance bank balance, transactions, and resource management.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-yellow transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-green/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Tax Management</h3>
            <p className="text-cp-text-secondary text-sm">Configure tax brackets, collect taxes, and track member contributions.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-yellow transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-cyan/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Transactions</h3>
            <p className="text-cp-text-secondary text-sm">Track all bank transactions, transfers, and payment history.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-yellow transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-purple/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Financial Analytics</h3>
            <p className="text-cp-text-secondary text-sm">Analyze spending patterns, revenue trends, and financial health.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-yellow transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-orange/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V9a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2h8a2 2 0 002-2z" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Loan Management</h3>
            <p className="text-cp-text-secondary text-sm">Manage member loans, grants, and repayment tracking.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-yellow transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-red/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Resource Trading</h3>
            <p className="text-cp-text-secondary text-sm">Manage resource trades, market analysis, and trading strategies.</p>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-cp-bg-secondary border border-cp-yellow rounded-lg p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cp-yellow/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-cp-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="text-2xl font-cyberpunk text-cp-yellow mb-4">Development In Progress</h2>
          <p className="text-cp-text-secondary mb-6">
            The Banking & Economics module is currently under development. 
            Advanced financial management features will be available soon.
          </p>
          <div className="text-cp-text-muted text-sm">
            Expected features: Bank dashboard, tax collection system, 
            transaction tracking, loan management, and financial analytics.
          </div>
        </div>
      </div>
    </div>
  )
}
