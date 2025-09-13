'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface Alliance {
  id: number
  name: string
  acronym: string
  memberCount: number
  hasApiKey: boolean
  admins: Array<{
    id: string
    discordId: string
    discordUsername?: string
    role: string
    addedAt: string
  }>
}

interface NewAllianceForm {
  allianceId: string
  name: string
  acronym: string
  adminDiscordId: string
}

export default function AllianceManagementPage() {
  const { data: session, status } = useSession()
  const [alliances, setAlliances] = useState<Alliance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAlliance, setNewAlliance] = useState<NewAllianceForm>({
    allianceId: '',
    name: '',
    acronym: '',
    adminDiscordId: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [apiKeyInputs, setApiKeyInputs] = useState<{ [key: number]: string }>({})
  const [savingApiKey, setSavingApiKey] = useState<{ [key: number]: boolean }>({})
  const [showAddAdmin, setShowAddAdmin] = useState<{ [key: number]: boolean }>({})
  const [newAdminInputs, setNewAdminInputs] = useState<{ [key: number]: { discordId: string; role: string } }>({})
  const [managingAdmin, setManagingAdmin] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      redirect('/auth/signin')
      return
    }

    fetchAlliances()
  }, [session, status])

  const fetchAlliances = async () => {
    try {
      const response = await fetch('/api/admin/alliances')
      if (response.status === 403) {
        redirect('/dashboard')
        return
      }
      if (!response.ok) {
        throw new Error('Failed to fetch alliances')
      }
      const data = await response.json()
      setAlliances(data.alliances)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alliances')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAlliance = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/alliances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAlliance)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add alliance')
      }

      // Reset form and refresh data
      setNewAlliance({
        allianceId: '',
        name: '',
        acronym: '',
        adminDiscordId: ''
      })
      setShowAddForm(false)
      await fetchAlliances()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add alliance')
    } finally {
      setSubmitting(false)
    }
  }

  const saveApiKey = async (allianceId: number) => {
    const apiKey = apiKeyInputs[allianceId]
    
    if (!apiKey || !apiKey.trim()) {
      setError('API key is required')
      return
    }

    setSavingApiKey(prev => ({ ...prev, [allianceId]: true }))
    setError('')

    try {
      const response = await fetch(`/api/admin/alliances/${allianceId}/api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save API key')
      }

      // Clear the input and refresh alliances
      setApiKeyInputs(prev => ({ ...prev, [allianceId]: '' }))
      await fetchAlliances()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key')
    } finally {
      setSavingApiKey(prev => ({ ...prev, [allianceId]: false }))
    }
  }

  const removeApiKey = async (allianceId: number) => {
    setSavingApiKey(prev => ({ ...prev, [allianceId]: true }))
    setError('')

    try {
      const response = await fetch(`/api/admin/alliances/${allianceId}/api-key`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove API key')
      }

      await fetchAlliances()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove API key')
    } finally {
      setSavingApiKey(prev => ({ ...prev, [allianceId]: false }))
    }
  }

  const addAllianceAdmin = async (allianceId: number) => {
    const adminData = newAdminInputs[allianceId]
    if (!adminData?.discordId?.trim()) {
      setError('Discord ID is required')
      return
    }

    setManagingAdmin(prev => ({ ...prev, [`add-${allianceId}`]: true }))
    setError('')
    
    try {
      const response = await fetch(`/api/admin/alliances/${allianceId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordId: adminData.discordId.trim(),
          role: adminData.role || 'admin'
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add admin')
      }

      await fetchAlliances()
      setNewAdminInputs(prev => ({ ...prev, [allianceId]: { discordId: '', role: 'admin' } }))
      setShowAddAdmin(prev => ({ ...prev, [allianceId]: false }))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add admin')
    } finally {
      setManagingAdmin(prev => ({ ...prev, [`add-${allianceId}`]: false }))
    }
  }

  const removeAllianceAdmin = async (allianceId: number, adminId: string) => {
    if (!confirm('Are you sure you want to remove this administrator?')) {
      return
    }

    setManagingAdmin(prev => ({ ...prev, [`remove-${adminId}`]: true }))
    setError('')
    
    try {
      const response = await fetch(`/api/admin/alliances/${allianceId}/admins/${adminId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove admin')
      }

      await fetchAlliances()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin')
    } finally {
      setManagingAdmin(prev => ({ ...prev, [`remove-${adminId}`]: false }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center">
        <div className="cp-card p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cp-cyan mx-auto mb-4"></div>
          <p className="text-cp-text-secondary">Loading alliance management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cp-bg-primary">
      {/* Header */}
      <div className="border-b border-cp-border bg-cp-bg-secondary">
        <div className="cp-container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-cyberpunk text-cp-text-primary">
                Alliance Management
              </h1>
              <p className="text-cp-text-secondary mt-1">
                Manage alliances and their administrators
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="cp-button-primary"
            >
              Add New Alliance
            </button>
          </div>
        </div>
      </div>

      <div className="cp-container py-8">
        {error && (
          <div className="cp-card p-4 border-cp-red mb-6">
            <p className="text-cp-red">{error}</p>
          </div>
        )}

        {/* Add Alliance Form */}
        {showAddForm && (
          <div className="cp-card p-6 mb-6">
            <h2 className="text-xl font-cyberpunk text-cp-text-primary mb-4">
              Add New Alliance
            </h2>
            <form onSubmit={handleAddAlliance} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cp-text-primary mb-1">
                    Alliance ID (from Politics & War)
                  </label>
                  <input
                    type="number"
                    value={newAlliance.allianceId}
                    onChange={(e) => setNewAlliance({...newAlliance, allianceId: e.target.value})}
                    className="cp-input"
                    placeholder="e.g. 790"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cp-text-primary mb-1">
                    Alliance Name
                  </label>
                  <input
                    type="text"
                    value={newAlliance.name}
                    onChange={(e) => setNewAlliance({...newAlliance, name: e.target.value})}
                    className="cp-input"
                    placeholder="e.g. Rose"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cp-text-primary mb-1">
                    Alliance Acronym
                  </label>
                  <input
                    type="text"
                    value={newAlliance.acronym}
                    onChange={(e) => setNewAlliance({...newAlliance, acronym: e.target.value})}
                    className="cp-input"
                    placeholder="e.g. ROSE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cp-text-primary mb-1">
                    Admin Discord ID
                  </label>
                  <input
                    type="text"
                    value={newAlliance.adminDiscordId}
                    onChange={(e) => setNewAlliance({...newAlliance, adminDiscordId: e.target.value})}
                    className="cp-input"
                    placeholder="e.g. 989576730165518437"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="cp-button-primary"
                >
                  {submitting ? 'Adding...' : 'Add Alliance'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="cp-button-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Alliances List */}
        <div className="space-y-6">
          {alliances.map(alliance => (
            <div key={alliance.id} className="cp-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-cyberpunk text-cp-text-primary">
                    {alliance.name} ({alliance.acronym})
                  </h3>
                  <p className="text-cp-text-secondary">
                    ID: {alliance.id} • Members: {alliance.memberCount}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    alliance.hasApiKey 
                      ? 'bg-cp-green/20 text-cp-green border border-cp-green' 
                      : 'bg-cp-red/20 text-cp-red border border-cp-red'
                  }`}>
                    {alliance.hasApiKey ? 'API Key Set' : 'No API Key'}
                  </span>
                </div>
              </div>

              {/* Alliance Admins */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-cp-text-primary">
                    Alliance Administrators
                  </h4>
                  <button
                    onClick={() => {
                      setShowAddAdmin(prev => ({ ...prev, [alliance.id]: !prev[alliance.id] }))
                      if (!newAdminInputs[alliance.id]) {
                        setNewAdminInputs(prev => ({ ...prev, [alliance.id]: { discordId: '', role: 'admin' } }))
                      }
                    }}
                    className="cp-button-secondary text-sm"
                  >
                    {showAddAdmin[alliance.id] ? 'Cancel' : 'Add Admin'}
                  </button>
                </div>

                {showAddAdmin[alliance.id] && (
                  <div className="mb-4 p-4 bg-cp-bg-tertiary rounded-lg border border-cp-border">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-cp-text-primary mb-1">
                          Discord ID
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Discord ID..."
                          value={newAdminInputs[alliance.id]?.discordId || ''}
                          onChange={(e) => setNewAdminInputs(prev => ({
                            ...prev,
                            [alliance.id]: { ...prev[alliance.id], discordId: e.target.value }
                          }))}
                          className="cp-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-cp-text-primary mb-1">
                          Role
                        </label>
                        <select
                          value={newAdminInputs[alliance.id]?.role || 'admin'}
                          onChange={(e) => setNewAdminInputs(prev => ({
                            ...prev,
                            [alliance.id]: { ...prev[alliance.id], role: e.target.value }
                          }))}
                          className="cp-input w-full"
                        >
                          <option value="admin">Admin</option>
                          <option value="moderator">Moderator</option>
                          <option value="manager">Manager</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addAllianceAdmin(alliance.id)}
                          disabled={managingAdmin[`add-${alliance.id}`] || !newAdminInputs[alliance.id]?.discordId?.trim()}
                          className="cp-button-primary"
                        >
                          {managingAdmin[`add-${alliance.id}`] ? 'Adding...' : 'Add Admin'}
                        </button>
                        <button
                          onClick={() => setShowAddAdmin(prev => ({ ...prev, [alliance.id]: false }))}
                          className="cp-button-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {alliance.admins.length === 0 ? (
                  <p className="text-cp-text-secondary">No administrators assigned</p>
                ) : (
                  <div className="space-y-2">
                    {alliance.admins.map(admin => (
                      <div key={admin.id} className="flex items-center justify-between p-3 bg-cp-bg-tertiary rounded">
                        <div>
                          <p className="text-cp-text-primary font-medium">
                            {admin.discordUsername || 'Unknown User'}
                          </p>
                          <p className="text-cp-text-secondary text-sm">
                            Discord ID: {admin.discordId} • Role: {admin.role}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-cp-text-muted text-sm">
                            Added: {new Date(admin.addedAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => removeAllianceAdmin(alliance.id, admin.id)}
                            disabled={managingAdmin[`remove-${admin.id}`]}
                            className="cp-button-secondary text-cp-red border-cp-red hover:bg-cp-red/10 text-sm px-3 py-1"
                          >
                            {managingAdmin[`remove-${admin.id}`] ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* API Key Management */}
              <div>
                <h4 className="text-lg font-semibold text-cp-text-primary mb-3">
                  API Key Management
                </h4>
                <div className="space-y-3">
                  {alliance.hasApiKey ? (
                    <div className="flex items-center justify-between p-3 bg-cp-bg-tertiary rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-cp-green rounded-full"></div>
                        <span className="text-cp-text-primary">API Key is configured</span>
                      </div>
                      <button
                        onClick={() => removeApiKey(alliance.id)}
                        disabled={savingApiKey[alliance.id]}
                        className="cp-button-secondary text-cp-red border-cp-red hover:bg-cp-red/10"
                      >
                        {savingApiKey[alliance.id] ? 'Removing...' : 'Remove Key'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-cp-red rounded-full"></div>
                        <span className="text-cp-text-secondary">No API Key configured</span>
                      </div>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Enter Politics & War API Key..."
                          value={apiKeyInputs[alliance.id] || ''}
                          onChange={(e) => setApiKeyInputs(prev => ({ 
                            ...prev, 
                            [alliance.id]: e.target.value 
                          }))}
                          className="cp-input flex-1"
                        />
                        <button
                          onClick={() => saveApiKey(alliance.id)}
                          disabled={savingApiKey[alliance.id] || !apiKeyInputs[alliance.id]?.trim()}
                          className="cp-button-primary"
                        >
                          {savingApiKey[alliance.id] ? 'Saving...' : 'Save Key'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {alliances.length === 0 && (
            <div className="cp-card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cp-cyan/20 flex items-center justify-center">
                <span className="text-cp-cyan text-2xl">🏛️</span>
              </div>
              <h3 className="text-lg font-cyberpunk text-cp-cyan mb-2">No Alliances</h3>
              <p className="text-cp-text-secondary">
                No alliances have been added yet. Click "Add New Alliance" to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
