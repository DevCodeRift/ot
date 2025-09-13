'use client'

import { useState, useEffect } from 'react'
import { Search, UserPlus, UserMinus, Shield, Users } from 'lucide-react'

interface Role {
  id: string
  name: string
  description?: string
  color?: string
  permissions: {
    canAssignRoles: boolean
    canCreateQuests: boolean
    canManageMembers: boolean
    canViewWarData: boolean
    canManageEconomics: boolean
    canManageRecruitment: boolean
  }
}

interface Member {
  id: number
  nation_name: string
  leader_name: string
  alliance_position: string
  roles?: Array<{
    id: string
    name: string
    color?: string
    assignedAt: string
  }>
}

interface UserSearchResult {
  id: string
  name: string
  discordUsername?: string
  pwNationName?: string
  pwNationId?: number
  currentAllianceId?: number
}

interface RoleAssignmentProps {
  allianceId: number
  members: Member[]
  onMemberUpdate?: () => void
}

export function RoleAssignmentComponent({ allianceId, members, onMemberUpdate }: RoleAssignmentProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [hasRolePermission, setHasRolePermission] = useState(false)

  useEffect(() => {
    checkPermissions()
    fetchRoles()
  }, [])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const checkPermissions = async () => {
    try {
      // Check if user has role assignment permissions
      const response = await fetch('/api/user/permissions/role-manager')
      if (response.ok) {
        setHasRolePermission(true)
      }
    } catch (err) {
      setHasRolePermission(false)
    }
  }

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/alliance/roles')
      
      if (!response.ok) {
        throw new Error('Failed to fetch roles')
      }

      const data = await response.json()
      
      // Check if database is not ready
      if (data.status === 'pending_setup') {
        setError('Database setup required: ' + data.message)
        setRoles([])
        return
      }
      
      setRoles(data.roles)
    } catch (err) {
      setError('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    try {
      // Search by nation ID (if numeric) or nation name
      const isNationId = !isNaN(Number(searchQuery))
      const searchParam = isNationId ? `nationId=${searchQuery}` : `nationName=${encodeURIComponent(searchQuery)}`
      
      const response = await fetch(`/api/alliance/members/search?${searchParam}`)
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      }
    } catch (err) {
      console.error('Search failed:', err)
    }
  }

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) return

    try {
      setIsAssigning(true)
      setError('')

      const response = await fetch('/api/alliance/roles/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          roleId: selectedRole
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign role')
      }

      // Reset form
      setSelectedUser(null)
      setSelectedRole('')
      setSearchQuery('')
      setSearchResults([])
      
      // Refresh member data
      onMemberUpdate?.()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role')
    } finally {
      setIsAssigning(false)
    }
  }

  const revokeRole = async (userId: string, roleId: string) => {
    try {
      setError('')

      const response = await fetch(`/api/alliance/roles/assign?userId=${userId}&roleId=${roleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to revoke role')
      }

      // Refresh member data
      onMemberUpdate?.()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke role')
    }
  }

  // Don't render if user doesn't have permission
  if (!hasRolePermission) {
    return null
  }

  if (loading) {
    return (
      <div className="cp-card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-cp-bg-tertiary rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-cp-bg-tertiary rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Role Assignment Section */}
      <div className="cp-card p-6">
        <div className="flex items-center mb-6">
          <Shield className="w-6 h-6 text-cp-cyan mr-3" />
          <div>
            <h3 className="text-lg font-cyberpunk text-cp-text-primary">Role Assignment</h3>
            <p className="text-cp-text-secondary text-sm">
              Assign roles to alliance members by searching for their nation name or ID
            </p>
          </div>
        </div>

        {error && (
          <div className="cp-card p-4 border-cp-red bg-cp-red/10 mb-4">
            <p className="text-cp-red">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Search */}
          <div>
            <label className="block text-cp-text-primary font-medium mb-2">
              Search Member
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cp-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nation name or Nation ID..."
                className="w-full pl-10 pr-4 py-3 bg-cp-bg-secondary border border-cp-border rounded text-cp-text-primary focus:border-cp-cyan focus:outline-none"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-cp-bg-secondary border border-cp-border rounded max-h-48 overflow-y-auto">
                {searchResults.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user)
                      setSearchQuery(user.pwNationName || user.name || '')
                      setSearchResults([])
                    }}
                    className="w-full p-3 text-left hover:bg-cp-bg-tertiary transition-colors border-b border-cp-border last:border-b-0"
                  >
                    <div className="text-cp-text-primary font-medium">
                      {user.pwNationName || user.name}
                    </div>
                    {user.pwNationId && (
                      <div className="text-cp-text-muted text-sm">
                        Nation ID: {user.pwNationId}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Selected User */}
            {selectedUser && (
              <div className="mt-3 p-3 bg-cp-cyan/10 border border-cp-cyan rounded">
                <div className="text-cp-text-primary font-medium">
                  Selected: {selectedUser.pwNationName || selectedUser.name}
                </div>
                {selectedUser.pwNationId && (
                  <div className="text-cp-text-muted text-sm">
                    Nation ID: {selectedUser.pwNationId}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-cp-text-primary font-medium mb-2">
              Select Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full p-3 bg-cp-bg-secondary border border-cp-border rounded text-cp-text-primary focus:border-cp-cyan focus:outline-none"
            >
              <option value="">Choose a role...</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>

            {selectedRole && (
              <div className="mt-3">
                {(() => {
                  const role = roles.find(r => r.id === selectedRole)
                  return role ? (
                    <div className="p-3 bg-cp-bg-tertiary border border-cp-border rounded">
                      <div className="flex items-center mb-2">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: role.color || '#00f5ff' }}
                        ></div>
                        <span className="text-cp-text-primary font-medium">{role.name}</span>
                      </div>
                      {role.description && (
                        <p className="text-cp-text-secondary text-sm">{role.description}</p>
                      )}
                    </div>
                  ) : null
                })()}
              </div>
            )}

            {/* Assign Button */}
            <button
              onClick={assignRole}
              disabled={!selectedUser || !selectedRole || isAssigning}
              className="w-full mt-4 cp-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isAssigning ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-cp-cyan border-t-transparent rounded-full mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Role
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Current Role Assignments */}
      <div className="cp-card p-6">
        <div className="flex items-center mb-6">
          <Users className="w-6 h-6 text-cp-cyan mr-3" />
          <div>
            <h3 className="text-lg font-cyberpunk text-cp-text-primary">Current Role Assignments</h3>
            <p className="text-cp-text-secondary text-sm">
              View and manage existing role assignments
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {roles.map(role => {
            const membersWithRole = members.filter(member => 
              member.roles?.some(r => r.id === role.id)
            )

            return (
              <div key={role.id} className="border border-cp-border rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: role.color || '#00f5ff' }}
                    ></div>
                    <span className="text-cp-text-primary font-medium">{role.name}</span>
                  </div>
                  <span className="text-cp-text-muted text-sm">
                    {membersWithRole.length} members
                  </span>
                </div>

                {membersWithRole.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {membersWithRole.map(member => {
                      const memberRole = member.roles?.find(r => r.id === role.id)
                      return (
                        <div key={member.id} className="flex items-center justify-between bg-cp-bg-tertiary p-2 rounded">
                          <div>
                            <div className="text-cp-text-primary text-sm font-medium">
                              {member.nation_name}
                            </div>
                            <div className="text-cp-text-muted text-xs">
                              Assigned: {memberRole ? new Date(memberRole.assignedAt).toLocaleDateString() : 'Unknown'}
                            </div>
                          </div>
                          <button
                            onClick={() => revokeRole(member.id.toString(), role.id)}
                            className="text-cp-red hover:text-cp-red/80 p-1"
                            title="Revoke role"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-cp-text-muted text-sm">No members assigned to this role</p>
                )}
              </div>
            )
          })}

          {roles.length === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-cp-text-muted mx-auto mb-4" />
              <p className="text-cp-text-secondary">
                No roles have been created yet. Contact an Alliance Administrator to create roles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoleAssignmentComponent