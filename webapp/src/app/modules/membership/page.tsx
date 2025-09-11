'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { checkModuleAccess } from '@/lib/module-access'

export default function MembershipPage() {
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
      const response = await fetch('/api/modules/membership/access')
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
          <h1 className="text-4xl font-cyberpunk text-cp-cyan mb-2 glowing-text">
            Membership Management
          </h1>
          <p className="text-cp-text-secondary text-lg">
            Manage alliance members, track activity, and monitor performance
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-cyan transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-cyan/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Member Directory</h3>
            <p className="text-cp-text-secondary text-sm">View and manage all alliance members with detailed profiles and statistics.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-cyan transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-green/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Activity Tracking</h3>
            <p className="text-cp-text-secondary text-sm">Monitor member activity, login frequency, and engagement metrics.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-cyan transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-yellow/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Role Management</h3>
            <p className="text-cp-text-secondary text-sm">Assign and manage member roles, permissions, and responsibilities.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-cyan transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-purple/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5zm0 0V9a5.002 5.002 0 00-4.95-5A5.002 5.002 0 005 9v8" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Performance Analytics</h3>
            <p className="text-cp-text-secondary text-sm">Track member performance, contributions, and growth metrics.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-cyan transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-orange/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Onboarding</h3>
            <p className="text-cp-text-secondary text-sm">Streamline new member onboarding with automated workflows.</p>
          </div>

          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 hover:border-cp-cyan transition-colors">
            <div className="w-12 h-12 mb-4 rounded bg-cp-red/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cp-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="font-cyberpunk text-cp-text-primary text-lg mb-2">Disciplinary Actions</h3>
            <p className="text-cp-text-secondary text-sm">Manage warnings, sanctions, and disciplinary procedures.</p>
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
            The Membership Management module is currently under development. 
            Advanced member management features will be available soon.
          </p>
          <div className="text-cp-text-muted text-sm">
            Expected features: Member profiles, activity dashboards, role management, 
            performance tracking, and automated onboarding workflows.
          </div>
        </div>
      </div>
    </div>
  )
}
