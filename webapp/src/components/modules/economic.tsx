'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DollarSign, Users, TrendingUp, ArrowUpDown, Plus, Minus } from 'lucide-react'

interface Alliance {
  id: number
  name: string
  acronym?: string
}

interface TaxBracket {
  id: string
  name: string
  moneyTaxRate: number
  resourceTaxRate: number
  dateCreated: string
  dateModified?: string
  lastModifier?: {
    id: string
    nationName: string
    leaderName: string
  }
}

interface Holdings {
  id: string
  alliance: Alliance
  balances: {
    money: number
    coal: number
    oil: number
    uranium: number
    iron: number
    bauxite: number
    lead: number
    gasoline: number
    munitions: number
    steel: number
    aluminum: number
    food: number
  }
  summary: {
    totalDeposited: number
    totalWithdrawn: number
    lifetimeDeposited: number
    lifetimeWithdrawn: number
  }
  updatedAt: string
}

interface HoldingTransaction {
  id: string
  type: 'deposit' | 'withdraw'
  resources: {
    money?: number
    coal?: number
    oil?: number
    uranium?: number
    iron?: number
    bauxite?: number
    lead?: number
    gasoline?: number
    munitions?: number
    steel?: number
    aluminum?: number
    food?: number
  }
  note?: string
  createdAt: string
}

interface EconomicToolsModuleProps {
  allianceId: number
}

export function EconomicToolsModule({ allianceId }: EconomicToolsModuleProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('tax-management')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Tax Management State
  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>([])
  const [taxLoading, setTaxLoading] = useState(false)

  // Holdings State
  const [holdings, setHoldings] = useState<Holdings | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<HoldingTransaction[]>([])
  const [holdingsLoading, setHoldingsLoading] = useState(false)
  const [showDepositForm, setShowDepositForm] = useState(false)
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    money: '',
    coal: '',
    oil: '',
    uranium: '',
    iron: '',
    bauxite: '',
    lead: '',
    gasoline: '',
    munitions: '',
    steel: '',
    aluminum: '',
    food: '',
    note: ''
  })

  useEffect(() => {
    if (session && activeTab === 'tax-management') {
      fetchTaxBrackets()
    } else if (session && activeTab === 'holdings') {
      fetchHoldings()
    }
  }, [session, activeTab, allianceId])

  const fetchTaxBrackets = async () => {
    setTaxLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/modules/economic/tax-brackets?allianceId=${allianceId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch tax brackets')
      }

      const data = await response.json()
      setTaxBrackets(data.taxBrackets || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tax brackets')
    } finally {
      setTaxLoading(false)
    }
  }

  const fetchHoldings = async () => {
    setHoldingsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/modules/economic/holdings?allianceId=${allianceId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch holdings')
      }

      const data = await response.json()
      setHoldings(data.holdings)
      setRecentTransactions(data.recentTransactions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch holdings')
    } finally {
      setHoldingsLoading(false)
    }
  }

  const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    setLoading(true)
    setError('')

    try {
      // Prepare resources object
      const resources: any = {}
      Object.entries(transactionForm).forEach(([key, value]) => {
        if (key !== 'note' && value && parseFloat(value) > 0) {
          resources[key] = parseFloat(value)
        }
      })

      if (Object.keys(resources).length === 0) {
        throw new Error('Please enter at least one resource amount')
      }

      const endpoint = type === 'deposit' 
        ? `/api/modules/economic/holdings/deposit`
        : `/api/modules/economic/holdings/withdraw`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          allianceId: allianceId,
          resources,
          note: transactionForm.note || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${type}`)
      }

      const data = await response.json()
      
      // Reset form
      setTransactionForm({
        money: '', coal: '', oil: '', uranium: '', iron: '', bauxite: '',
        lead: '', gasoline: '', munitions: '', steel: '', aluminum: '', food: '', note: ''
      })
      
      // Hide forms
      setShowDepositForm(false)
      setShowWithdrawForm(false)
      
      // Refresh holdings
      await fetchHoldings()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${type}`)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const tabs = [
    { id: 'tax-management', name: 'Tax Management', icon: Users },
    { id: 'holdings', name: 'Holdings', icon: DollarSign }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cp-cyan mb-2">Economic Tools</h1>
        <p className="text-cp-text-secondary">
          Manage tax brackets and member holdings for your alliance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-cp-border mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-cp-cyan text-cp-cyan'
                  : 'border-transparent text-cp-text-secondary hover:text-cp-text-primary hover:border-cp-border'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 cp-card bg-cp-red/10 border-cp-red p-4">
          <p className="text-cp-red">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'tax-management' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-cp-text-primary">Tax Brackets</h2>
            <button
              onClick={fetchTaxBrackets}
              disabled={taxLoading}
              className="cp-button-primary"
            >
              {taxLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {taxLoading ? (
            <div className="cp-card p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-cp-bg-tertiary rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="cp-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-cp-border">
                  <thead className="bg-cp-bg-tertiary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cp-text-secondary uppercase tracking-wider">
                        Tax Bracket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cp-text-secondary uppercase tracking-wider">
                        Money Tax Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cp-text-secondary uppercase tracking-wider">
                        Resource Tax Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cp-text-secondary uppercase tracking-wider">
                        Last Modified
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-cp-bg-secondary divide-y divide-cp-border">
                    {taxBrackets.map((bracket) => (
                      <tr key={bracket.id} className="hover:bg-cp-bg-tertiary/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-cp-text-primary">
                              {bracket.name}
                            </div>
                            <div className="text-sm text-cp-text-secondary">
                              ID: {bracket.id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cp-text-primary">
                          {bracket.moneyTaxRate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cp-text-primary">
                          {bracket.resourceTaxRate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cp-text-secondary">
                          {bracket.dateModified ? formatDate(bracket.dateModified) : formatDate(bracket.dateCreated)}
                          {bracket.lastModifier && (
                            <div className="text-xs">
                              by {bracket.lastModifier.leaderName}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {taxBrackets.length === 0 && (
                <div className="p-6 text-center text-cp-text-secondary">
                  No tax brackets found
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'holdings' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-cp-text-primary">Your Holdings</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDepositForm(true)}
                disabled={holdingsLoading}
                className="cp-button-secondary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Deposit
              </button>
              <button
                onClick={() => setShowWithdrawForm(true)}
                disabled={holdingsLoading}
                className="cp-button-secondary flex items-center gap-2"
              >
                <Minus className="w-4 h-4" />
                Withdraw
              </button>
              <button
                onClick={fetchHoldings}
                disabled={holdingsLoading}
                className="cp-button-primary"
              >
                {holdingsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {holdingsLoading ? (
            <div className="cp-card p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-cp-bg-tertiary rounded"></div>
                <div className="h-64 bg-cp-bg-tertiary rounded"></div>
              </div>
            </div>
          ) : holdings ? (
            <div className="space-y-6">
              {/* Holdings Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="cp-card p-4 bg-cp-bg-tertiary">
                  <div className="text-2xl font-bold text-cp-cyan">
                    ${formatNumber(holdings.balances.money)}
                  </div>
                  <div className="text-sm text-cp-text-secondary">Money Balance</div>
                </div>
                <div className="cp-card p-4 bg-cp-bg-tertiary">
                  <div className="text-2xl font-bold text-cp-green">
                    ${formatNumber(holdings.summary.totalDeposited)}
                  </div>
                  <div className="text-sm text-cp-text-secondary">Total Deposited</div>
                </div>
                <div className="cp-card p-4 bg-cp-bg-tertiary">
                  <div className="text-2xl font-bold text-cp-yellow">
                    ${formatNumber(holdings.summary.totalWithdrawn)}
                  </div>
                  <div className="text-sm text-cp-text-secondary">Total Withdrawn</div>
                </div>
                <div className="cp-card p-4 bg-cp-bg-tertiary">
                  <div className="text-2xl font-bold text-cp-text-primary">
                    ${formatNumber(holdings.summary.totalDeposited - holdings.summary.totalWithdrawn)}
                  </div>
                  <div className="text-sm text-cp-text-secondary">Net Holdings</div>
                </div>
              </div>

              {/* Resource Balances */}
              <div className="cp-card">
                <div className="p-6 border-b border-cp-border">
                  <h3 className="text-lg font-medium text-cp-text-primary">Resource Balances</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Object.entries(holdings.balances).map(([resource, amount]) => (
                      <div key={resource} className="text-center">
                        <div className="text-lg font-semibold text-cp-text-primary">
                          {formatNumber(amount)}
                        </div>
                        <div className="text-sm text-cp-text-secondary capitalize">
                          {resource}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="cp-card">
                <div className="p-6 border-b border-cp-border">
                  <h3 className="text-lg font-medium text-cp-text-primary">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-cp-border">
                    <thead className="bg-cp-bg-tertiary">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cp-text-secondary uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cp-text-secondary uppercase tracking-wider">
                          Resources
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cp-text-secondary uppercase tracking-wider">
                          Note
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cp-text-secondary uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-cp-bg-secondary divide-y divide-cp-border">
                      {recentTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-cp-bg-tertiary/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              transaction.type === 'deposit' 
                                ? 'bg-cp-green/20 text-cp-green' 
                                : 'bg-cp-red/20 text-cp-red'
                            }`}>
                              {transaction.type === 'deposit' ? '↑ Deposit' : '↓ Withdraw'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              {Object.entries(transaction.resources)
                                .filter(([_, amount]) => amount && amount > 0)
                                .map(([resource, amount]) => (
                                  <div key={resource} className="text-cp-text-primary">
                                    {formatNumber(amount!)} {resource}
                                  </div>
                                ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-cp-text-secondary">
                            {transaction.note || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-cp-text-secondary">
                            {formatDate(transaction.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {recentTransactions.length === 0 && (
                  <div className="p-6 text-center text-cp-text-secondary">
                    No transactions yet
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="cp-card p-6 text-center text-cp-text-secondary">
              No holdings data available
            </div>
          )}
        </div>
      )}

      {/* Transaction Forms */}
      {(showDepositForm || showWithdrawForm) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="cp-card max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-cp-border">
              <h3 className="text-lg font-medium text-cp-text-primary">
                {showDepositForm ? 'Deposit to Holdings' : 'Withdraw from Holdings'}
              </h3>
              <p className="text-sm text-cp-text-secondary mt-1">
                {showDepositForm 
                  ? 'Deposit resources from your nation to the alliance bank via P&W API'
                  : 'Withdraw resources from alliance bank to your nation via P&W API'
                }
              </p>
              <div className="bg-cp-bg-tertiary border border-cp-yellow rounded p-3 mt-2">
                <p className="text-xs text-cp-yellow">
                  <strong>Note:</strong> This will make actual transfers using the Politics & War API. 
                  Ensure your P&W API key is configured in your profile settings.
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Money Input */}
              <div>
                <label className="block text-sm font-medium text-cp-text-secondary mb-1">
                  Money ($)
                </label>
                <input
                  type="number"
                  value={transactionForm.money}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, money: e.target.value }))}
                  className="w-full px-3 py-2 bg-cp-bg-tertiary border border-cp-border rounded-md text-cp-text-primary focus:border-cp-cyan focus:outline-none"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Resource Grid */}
              <div>
                <label className="block text-sm font-medium text-cp-text-secondary mb-2">
                  Resources
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['coal', 'oil', 'uranium', 'iron', 'bauxite', 'lead', 'gasoline', 'munitions', 'steel', 'aluminum', 'food'].map((resource) => (
                    <div key={resource}>
                      <label className="block text-xs text-cp-text-secondary mb-1 capitalize">
                        {resource}
                      </label>
                      <input
                        type="number"
                        value={transactionForm[resource as keyof typeof transactionForm]}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, [resource]: e.target.value }))}
                        className="w-full px-2 py-1 text-sm bg-cp-bg-tertiary border border-cp-border rounded text-cp-text-primary focus:border-cp-cyan focus:outline-none"
                        placeholder="0"
                        min="0"
                        step="1"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cp-text-secondary mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={transactionForm.note}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full px-3 py-2 bg-cp-bg-tertiary border border-cp-border rounded-md text-cp-text-primary focus:border-cp-cyan focus:outline-none"
                  placeholder="Transaction note..."
                  maxLength={255}
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-cp-border flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDepositForm(false)
                  setShowWithdrawForm(false)
                  setTransactionForm({
                    money: '', coal: '', oil: '', uranium: '', iron: '', bauxite: '',
                    lead: '', gasoline: '', munitions: '', steel: '', aluminum: '', food: '', note: ''
                  })
                }}
                className="cp-button-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleTransaction(showDepositForm ? 'deposit' : 'withdraw')}
                className="cp-button-primary"
                disabled={loading}
              >
                {loading ? 'Processing...' : (showDepositForm ? 'Deposit' : 'Withdraw')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
