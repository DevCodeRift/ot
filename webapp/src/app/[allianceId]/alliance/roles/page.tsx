'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { 
  Plus, 
  Settings, 
  Users, 
  Shield, 
  Trash2, 
  Edit,
  UserPlus,
  UserMinus,
  Search,
  X
} from 'lucide-react'

interface Role {
  id: string
  name: string
  description?: string
  color?: string
  modulePermissions: string[]
  permissions: {
    canAssignRoles: boolean
    canCreateQuests: boolean
    canManageMembers: boolean
    canViewWarData: boolean
    canManageEconomics: boolean
    canManageRecruitment: boolean
  }
  assignedUsers: Array<{
    id: string
    name: string
    discordUsername?: string
    pwNationName?: string
    assignedAt: string
  }>
  createdAt: string
}

interface CreateRoleData {
  name: string
  description: string
  color: string
  modulePermissions: string[]
  canAssignRoles: boolean
  canCreateQuests: boolean
  canManageMembers: boolean
  canViewWarData: boolean
  canManageEconomics: boolean
  canManageRecruitment: boolean
}

const AVAILABLE_MODULES = [
  { id: 'membership', name: 'Membership Management', icon: '👥' },
  { id: 'war', name: 'War Management', icon: '⚔️' },
  { id: 'quests', name: 'Quest & Achievement System', icon: '🏆' },
  { id: 'recruitment', name: 'Recruitment System', icon: '📋' },
  { id: 'economic-tools', name: 'Economic Tools', icon: '💰' }
]

const ROLE_COLORS = [
  '#00f5ff', // Cyan
  '#fcee0a', // Yellow
  '#ff003c', // Red
  '#00ff9f', // Green
  '#b847ca', // Purple
  '#ff6b35'  // Orange
]

export default function RoleManagementPage() {
  const { data: session } = useSession()
  const params = useParams()
  const allianceId = params.allianceId as string
  
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Role assignment management state
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isAssigning, setIsAssigning] = useState(false)

  const [newRole, setNewRole] = useState<CreateRoleData>({
    name: '',
    description: '',
    color: ROLE_COLORS[0],
    modulePermissions: [],
    canAssignRoles: false,
    canCreateQuests: false,
    canManageMembers: false,
    canViewWarData: false,
    canManageEconomics: false,
    canManageRecruitment: false
  })

  useEffect(() => {
    fetchRoles()
  }, [allianceId])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/alliance/roles?allianceId=${allianceId}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch roles')
      }

      const data = await response.json()
      
      // Check if database is not ready
      if (data.status === 'pending_setup') {
        setError('Database Setup Required: ' + data.message)
        setRoles([])
        return
      }
      
      setRoles(data.roles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async () => {
    try {
      setIsCreating(true)
      setError('')

      const response = await fetch(`/api/alliance/roles?allianceId=${allianceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRole)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create role')
      }

      const data = await response.json()
      setRoles([...roles, data.role])
      setShowCreateModal(false)
      setNewRole({
        name: '',
        description: '',
        color: ROLE_COLORS[0],
        modulePermissions: [],
        canAssignRoles: false,
        canCreateQuests: false,
        canManageMembers: false,
        canViewWarData: false,
        canManageEconomics: false,
        canManageRecruitment: false
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role')
    } finally {
      setIsCreating(false)
    }
  }

  const toggleModulePermission = (moduleId: string) => {
    setNewRole(prev => ({
      ...prev,
      modulePermissions: prev.modulePermissions.includes(moduleId)
        ? prev.modulePermissions.filter(id => id !== moduleId)
        : [...prev.modulePermissions, moduleId]
    }))
  }

  const getPermissionCount = (role: Role) => {
    const permissions = role.permissions
    return Object.values(permissions).filter(Boolean).length + role.modulePermissions.length
  }

  // Role assignment functions
  const handleManageRole = (role: Role) => {
    setSelectedRole(role)
    setShowAssignModal(true)
    setSearchQuery('')
    setSearchResults([])
  }

  const searchUsers = async () => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    try {
      // Search by nation ID (if numeric) or nation name
      const isNationId = !isNaN(Number(searchQuery))
      const searchParam = isNationId ? `nationId=${searchQuery}` : `nationName=${encodeURIComponent(searchQuery)}`
      
      const response = await fetch(`/api/alliance/members/search?${searchParam}&allianceId=${allianceId}`)
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      }
    } catch (err) {
      console.error('Search failed:', err)
    }
  }

  const assignRole = async (userId: string) => {
    if (!selectedRole) return

    try {
      setIsAssigning(true)
      setError('')

      const response = await fetch(`/api/alliance/roles/assign?allianceId=${allianceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          roleId: selectedRole.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign role')
      }

      // Refresh roles to show updated assignments
      await fetchRoles()
      setShowAssignModal(false)
      setSelectedRole(null)
      setSearchQuery('')
      setSearchResults([])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role')
    } finally {
      setIsAssigning(false)
    }
  }

  const revokeRole = async (userId: string, roleId: string) => {
    try {
      setError('')

      const response = await fetch(`/api/alliance/roles/assign?userId=${userId}&roleId=${roleId}&allianceId=${allianceId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to revoke role')
      }

      // Refresh roles to show updated assignments
      await fetchRoles()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke role')
    }
  }

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  if (loading) {
    return (
      <div className="cp-container mx-auto p-6">
        <div className="cp-card p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-cp-bg-tertiary rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-cp-bg-tertiary rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cp-container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-cp-cyan mr-3" />
            <div>
              <h1 className="text-2xl font-cyberpunk text-cp-text-primary">
                Role Management
              </h1>
              <p className="text-cp-text-secondary">
                Alliance ID: {allianceId} | Manage roles and permissions for your alliance members
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="cp-button-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </button>
        </div>
      </div>

      {error && (
        <div className="cp-card p-4 border-cp-red bg-cp-red/10 mb-6">
          <p className="text-cp-red">{error}</p>
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role.id} className="cp-card p-6 hover:border-cp-cyan transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: role.color || '#00f5ff' }}
                />
                <div>
                  <h3 className="text-lg font-cyberpunk text-cp-text-primary">
                    {role.name}
                  </h3>
                  {role.description && (
                    <p className="text-cp-text-secondary text-sm">
                      {role.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleManageRole(role)}
                  className="p-2 hover:bg-cp-bg-tertiary rounded transition-colors"
                  title="Manage Role Assignments"
                >
                  <UserPlus className="w-4 h-4 text-cp-cyan" />
                </button>
                <button className="p-2 hover:bg-cp-bg-tertiary rounded transition-colors">
                  <Edit className="w-4 h-4 text-cp-text-muted" />
                </button>
                <button className="p-2 hover:bg-cp-bg-tertiary rounded transition-colors">
                  <Trash2 className="w-4 h-4 text-cp-red" />
                </button>
              </div>
            </div>

            {/* Permissions Summary */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-cp-text-secondary">Permissions</span>
                <span className="text-cp-cyan">{getPermissionCount(role)}</span>
              </div>
              
              {/* Module Permissions */}
              {role.modulePermissions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {role.modulePermissions.map(moduleId => {
                    const module = AVAILABLE_MODULES.find(m => m.id === moduleId)
                    return module ? (
                      <span 
                        key={moduleId}
                        className="text-xs px-2 py-1 bg-cp-cyan/20 text-cp-cyan rounded"
                      >
                        {module.icon} {module.name}
                      </span>
                    ) : null
                  })}
                </div>
              )}
            </div>

            {/* Assigned Users */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-cp-text-secondary">Assigned Users</span>
                <span className="text-cp-text-muted">{role.assignedUsers.length}</span>
              </div>
              
              {role.assignedUsers.length > 0 ? (
                <div className="space-y-2">
                  {role.assignedUsers.slice(0, 3).map(user => (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between text-sm p-2 bg-cp-bg-tertiary rounded"
                    >
                      <span className="text-cp-text-primary">
                        {user.name || user.discordUsername || user.pwNationName || 'Unknown'}
                      </span>
                      <button
                        onClick={() => revokeRole(user.id, role.id)}
                        className="text-cp-red hover:text-cp-red/80 transition-colors"
                        title="Revoke Role"
                      >
                        <UserMinus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {role.assignedUsers.length > 3 && (
                    <p className="text-xs text-cp-text-muted text-center">
                      +{role.assignedUsers.length - 3} more users
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-cp-text-muted text-sm">No users assigned</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="cp-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-cyberpunk text-cp-text-primary">Create New Role</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-cp-text-muted hover:text-cp-text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Role Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-cp-text-primary font-medium mb-2">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-cp-bg-secondary border border-cp-border rounded text-cp-text-primary focus:border-cp-cyan focus:outline-none"
                    placeholder="Enter role name..."
                  />
                </div>

                <div>
                  <label className="block text-cp-text-primary font-medium mb-2">
                    Color
                  </label>
                  <div className="flex space-x-2">
                    {ROLE_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewRole(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 ${
                          newRole.color === color ? 'border-cp-cyan' : 'border-cp-border'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-cp-text-primary font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-cp-bg-secondary border border-cp-border rounded text-cp-text-primary focus:border-cp-cyan focus:outline-none"
                  rows={3}
                  placeholder="Describe the role's purpose..."
                />
              </div>

              {/* Module Permissions */}
              <div>
                <label className="block text-cp-text-primary font-medium mb-3">
                  Module Access
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AVAILABLE_MODULES.map(module => (
                    <label
                      key={module.id}
                      className="flex items-center space-x-3 p-3 bg-cp-bg-secondary rounded cursor-pointer hover:bg-cp-bg-tertiary transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={newRole.modulePermissions.includes(module.id)}
                        onChange={() => toggleModulePermission(module.id)}
                        className="w-4 h-4 text-cp-cyan focus:ring-cp-cyan focus:ring-2"
                      />
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{module.icon}</span>
                        <span className="text-cp-text-primary">{module.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* System Permissions */}
              <div>
                <label className="block text-cp-text-primary font-medium mb-3">
                  System Permissions
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-3 p-3 bg-cp-bg-secondary rounded cursor-pointer hover:bg-cp-bg-tertiary transition-colors">
                    <input
                      type="checkbox"
                      checked={newRole.canAssignRoles}
                      onChange={(e) => setNewRole(prev => ({ ...prev, canAssignRoles: e.target.checked }))}
                      className="w-4 h-4 text-cp-cyan focus:ring-cp-cyan focus:ring-2"
                    />
                    <span className="text-cp-text-primary">Can Assign Roles</span>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-cp-bg-secondary rounded cursor-pointer hover:bg-cp-bg-tertiary transition-colors">
                    <input
                      type="checkbox"
                      checked={newRole.canCreateQuests}
                      onChange={(e) => setNewRole(prev => ({ ...prev, canCreateQuests: e.target.checked }))}
                      className="w-4 h-4 text-cp-cyan focus:ring-cp-cyan focus:ring-2"
                    />
                    <span className="text-cp-text-primary">Can Create Quests</span>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-cp-bg-secondary rounded cursor-pointer hover:bg-cp-bg-tertiary transition-colors">
                    <input
                      type="checkbox"
                      checked={newRole.canManageMembers}
                      onChange={(e) => setNewRole(prev => ({ ...prev, canManageMembers: e.target.checked }))}
                      className="w-4 h-4 text-cp-cyan focus:ring-cp-cyan focus:ring-2"
                    />
                    <span className="text-cp-text-primary">Can Manage Members</span>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-cp-bg-secondary rounded cursor-pointer hover:bg-cp-bg-tertiary transition-colors">
                    <input
                      type="checkbox"
                      checked={newRole.canViewWarData}
                      onChange={(e) => setNewRole(prev => ({ ...prev, canViewWarData: e.target.checked }))}
                      className="w-4 h-4 text-cp-cyan focus:ring-cp-cyan focus:ring-2"
                    />
                    <span className="text-cp-text-primary">Can View War Data</span>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-cp-bg-secondary rounded cursor-pointer hover:bg-cp-bg-tertiary transition-colors">
                    <input
                      type="checkbox"
                      checked={newRole.canManageEconomics}
                      onChange={(e) => setNewRole(prev => ({ ...prev, canManageEconomics: e.target.checked }))}
                      className="w-4 h-4 text-cp-cyan focus:ring-cp-cyan focus:ring-2"
                    />
                    <span className="text-cp-text-primary">Can Manage Economics</span>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-cp-bg-secondary rounded cursor-pointer hover:bg-cp-bg-tertiary transition-colors">
                    <input
                      type="checkbox"
                      checked={newRole.canManageRecruitment}
                      onChange={(e) => setNewRole(prev => ({ ...prev, canManageRecruitment: e.target.checked }))}
                      className="w-4 h-4 text-cp-cyan focus:ring-cp-cyan focus:ring-2"
                    />
                    <span className="text-cp-text-primary">Can Manage Recruitment</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-cp-border">
              <button
                onClick={() => setShowCreateModal(false)}
                className="cp-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={!newRole.name.trim() || isCreating}
                className="cp-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showAssignModal && selectedRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="cp-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-cyberpunk text-cp-text-primary">
                Assign Role: {selectedRole.name}
              </h2>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedRole(null)
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="text-cp-text-muted hover:text-cp-text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
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
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto bg-cp-bg-secondary border border-cp-border rounded">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => assignRole(user.id)}
                      disabled={isAssigning}
                      className="w-full p-3 text-left hover:bg-cp-bg-tertiary transition-colors border-b border-cp-border last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
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

              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="text-cp-text-muted text-center py-4">
                  No members found matching "{searchQuery}"
                </div>
              )}

              {searchQuery.length < 2 && (
                <div className="text-cp-text-muted text-center py-4">
                  Type at least 2 characters to search for members
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}