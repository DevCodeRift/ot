'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function WarPage() {
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
      const response = await fetch('/api/modules/war/access')
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
          <h1 className="text-4xl font-cyberpunk text-cp-red mb-2 glowing-text">
            War Management
          </h1>
          <p className="text-cp-text-secondary text-lg">
            Coordinate wars, assign targets, and plan military operations
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-red transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-red/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">War Coordination</h3>
            <p className="text-cp-text-secondary text-sm">Plan and coordinate alliance wars with strategic target assignment.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-red transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-orange/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Target Assignment</h3>
            <p className="text-cp-text-secondary text-sm">Assign specific targets to members based on military capabilities.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-red transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-yellow/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Battle Tracking</h3>
            <p className="text-cp-text-secondary text-sm">Monitor ongoing battles and track damage dealt/received.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-red transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-purple/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Military Planning</h3>
            <p className="text-cp-text-secondary text-sm">Strategic planning tools for military operations and campaigns.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-red transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-green/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Blitz Coordination</h3>
            <p className="text-cp-text-secondary text-sm">Coordinate synchronized attacks and blitz operations.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-red transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-cyan/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">War Analytics</h3>
            <p className="text-cp-text-secondary text-sm">Analyze war performance, damage statistics, and success rates.</p>
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
            The War Management module is currently under development. 
            Advanced military coordination features will be available soon.
          </p>
          <div className="text-cp-text-muted text-sm">
            Expected features: War planning tools, target assignment system, 
            battle tracking, damage analytics, and blitz coordination.
          </div>
        </div>
      </div>
    </div>
  )
}
