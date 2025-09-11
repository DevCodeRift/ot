'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface Alliance {
  id: number
  name: string
  acronym: string
  memberCount: number
  enabledModules: Array<{
    id: string
    name: string
    enabledAt: string
    enabledBy: string
  }>
}

interface Module {
  id: string
  name: string
  description: string
  category: string
}

interface AdminData {
  alliances: Alliance[]
  availableModules: Module[]
}

export default function AdminModulesPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingModule, setUpdatingModule] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      redirect('/auth/signin')
      return
    }

    // Check admin status by trying to fetch admin data
    // If the API returns 403, user is not admin
    fetchData()
  }, [session, status])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/alliance-modules')
      if (response.status === 403) {
        // User is not admin, redirect to dashboard
        redirect('/dashboard')
        return
      }
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      const result = await response.json()
      setData(result)
      setIsAdmin(true) // If we got here, user is admin
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = async (allianceId: number, moduleId: string, enabled: boolean) => {
    const key = `${allianceId}-${moduleId}`
    setUpdatingModule(key)

    try {
      const response = await fetch('/api/admin/alliance-modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allianceId,
          moduleId,
          enabled
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update module')
      }

      // Refresh data after successful update
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update module')
    } finally {
      setUpdatingModule('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center">
        <div className="text-cp-text-primary font-cyberpunk text-xl">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cp-cyan mr-4"></div>
          Loading admin panel...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center">
        <div className="bg-cp-bg-secondary border border-cp-red p-6 rounded max-w-md">
          <h2 className="text-cp-red font-cyberpunk text-xl mb-4">Error</h2>
          <p className="text-cp-text-secondary">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 bg-cp-bg-accent border border-cp-cyan px-4 py-2 rounded text-cp-cyan hover:bg-cp-cyan hover:text-cp-bg-primary transition-colors"
          >
            Retry
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
          <h1 className="text-3xl font-cyberpunk text-cp-cyan mb-2">
            Alliance Module Management
          </h1>
          <p className="text-cp-text-secondary">
            Control which alliances have access to specific modules
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-cp-bg-secondary border border-cp-border p-4 rounded">
            <div className="text-2xl font-cyberpunk text-cp-cyan">
              {data?.alliances?.length || 0}
            </div>
            <div className="text-cp-text-secondary">Active Alliances</div>
          </div>
          <div className="bg-cp-bg-secondary border border-cp-border p-4 rounded">
            <div className="text-2xl font-cyberpunk text-cp-green">
              {data?.availableModules?.length || 0}
            </div>
            <div className="text-cp-text-secondary">Available Modules</div>
          </div>
          <div className="bg-cp-bg-secondary border border-cp-border p-4 rounded">
            <div className="text-2xl font-cyberpunk text-cp-yellow">
              {data?.alliances?.reduce((sum, alliance) => sum + alliance.enabledModules.length, 0) || 0}
            </div>
            <div className="text-cp-text-secondary">Total Assignments</div>
          </div>
        </div>

        {/* Module Grid */}
        <div className="space-y-6">
          {data?.alliances?.map(alliance => (
            <div key={alliance.id} className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6">
              {/* Alliance Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-cyberpunk text-cp-text-primary">
                    {alliance.name} 
                    <span className="text-cp-text-muted ml-2">[{alliance.acronym}]</span>
                  </h3>
                  <p className="text-cp-text-secondary text-sm">
                    {alliance.memberCount} members • {alliance.enabledModules.length} modules enabled
                  </p>
                </div>
              </div>

              {/* Module Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.availableModules.map(module => {
                  const isEnabled = alliance.enabledModules.some(em => em.id === module.id)
                  const isUpdating = updatingModule === `${alliance.id}-${module.id}`
                  
                  return (
                    <div key={module.id} className="bg-cp-bg-tertiary border border-cp-border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-cyberpunk text-cp-text-primary text-sm">
                          {module.name}
                        </h4>
                        <button
                          onClick={() => toggleModule(alliance.id, module.id, !isEnabled)}
                          disabled={isUpdating}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            isEnabled
                              ? 'bg-cp-green text-cp-bg-primary border border-cp-green hover:bg-cp-bg-primary hover:text-cp-green'
                              : 'bg-cp-bg-accent text-cp-text-muted border border-cp-border hover:border-cp-cyan hover:text-cp-cyan'
                          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isUpdating ? '...' : (isEnabled ? 'Enabled' : 'Disabled')}
                        </button>
                      </div>
                      <p className="text-cp-text-muted text-xs">
                        {module.description}
                      </p>
                      <div className="text-cp-text-muted text-xs mt-1">
                        Category: {module.category}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
