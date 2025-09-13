'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/alliance/roles')
      
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

      const response = await fetch('/api/alliance/roles', {
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
      
      const response = await fetch(`/api/alliance/users/search?${searchParam}`)
      
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

      const response = await fetch('/api/alliance/roles/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          roleId: selectedRole.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign role')
      }

      // Refresh roles to update assigned users count
      await fetchRoles()
      
      // Clear search
      setSearchQuery('')
      setSearchResults([])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role')
    } finally {
      setIsAssigning(false)
    }
  }

  const revokeRole = async (userId: string) => {
    if (!selectedRole) return

    try {
      setError('')

      const response = await fetch('/api/alliance/roles/assign', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          roleId: selectedRole.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to revoke role')
      }

      // Refresh roles to update assigned users count
      await fetchRoles()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke role')
    }
  }

  // Search effect
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  if (loading) {
    return (
      <div className="min-h-screen bg-cp-bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="cp-card p-8 text-center">
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-cp-cyan/20 rounded-full mx-auto mb-4"></div>
              <p className="text-cp-text-secondary">Loading roles...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cp-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="cp-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-cp-cyan mr-3" />
              <div>
                <h1 className="text-2xl font-bold font-cyberpunk text-cp-text-primary">
                  Alliance Role Management
                </h1>
                <p className="text-cp-text-secondary">
                  Create and manage roles with specific permissions for alliance members
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="cp-button flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </button>
          </div>

          {error && (
            <div className="cp-card p-4 border-cp-red bg-cp-red/10 mb-4">
              <p className="text-cp-red">{error}</p>
            </div>
          )}
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map(role => (
            <div key={role.id} className="cp-card p-6 hover:border-cp-cyan transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: role.color || '#00f5ff' }}
                  ></div>
                  <h3 className="text-lg font-semibold text-cp-text-primary">
                    {role.name}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-cp-text-muted hover:text-cp-cyan">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-cp-text-muted hover:text-cp-red">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {role.description && (
                <p className="text-cp-text-secondary text-sm mb-4">
                  {role.description}
                </p>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-cp-text-muted text-sm">Permissions</span>
                  <span className="text-cp-cyan text-sm">
                    {getPermissionCount(role)} active
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-cp-text-muted text-sm">Assigned Users</span>
                  <span className="text-cp-green text-sm">
                    {role.assignedUsers.length} users
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-cp-border">
                  <span className="text-cp-text-muted text-xs">
                    Created {new Date(role.createdAt).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => handleManageRole(role)}
                    className="text-cp-cyan hover:text-cp-cyan/80 text-sm flex items-center transition-colors"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}

          {roles.length === 0 && (
            <div className="col-span-full cp-card p-8 text-center">
              <Shield className="w-12 h-12 text-cp-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-cyberpunk text-cp-text-primary mb-2">
                No Roles Created
              </h3>
              <p className="text-cp-text-secondary mb-4">
                Create your first role to start managing alliance permissions
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="cp-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Role
              </button>
            </div>
          )}
        </div>

        {/* Create Role Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="cp-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-cyberpunk text-cp-text-primary">
                  Create New Role
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-cp-text-muted hover:text-cp-text-primary"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-cp-text-primary font-medium mb-2">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      value={newRole.name}
                      onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 bg-cp-bg-secondary border border-cp-border rounded text-cp-text-primary focus:border-cp-cyan focus:outline-none"
                      placeholder="e.g., Role Manager, Quest Manager"
                    />
                  </div>

                  <div>
                    <label className="block text-cp-text-primary font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={newRole.description}
                      onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-3 bg-cp-bg-secondary border border-cp-border rounded text-cp-text-primary focus:border-cp-cyan focus:outline-none"
                      rows={3}
                      placeholder="Describe what this role can do..."
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
                            newRole.color === color ? 'border-cp-text-primary' : 'border-cp-border'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Module Permissions */}
                <div>
                  <label className="block text-cp-text-primary font-medium mb-3">
                    Module Access
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_MODULES.map(module => (
                      <label key={module.id} className="flex items-center cp-checkbox">
                        <input
                          type="checkbox"
                          checked={newRole.modulePermissions.includes(module.id)}
                          onChange={() => toggleModulePermission(module.id)}
                          className="mr-3"
                        />
                        <span className="mr-2">{module.icon}</span>
                        <span className="text-cp-text-primary">{module.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Specific Permissions */}
                <div>
                  <label className="block text-cp-text-primary font-medium mb-3">
                    Specific Permissions
                  </label>
                  <div className="space-y-3">
                    {[
                      { key: 'canAssignRoles', label: 'Can Assign Roles', desc: 'Assign/revoke roles to other members' },
                      { key: 'canCreateQuests', label: 'Can Create Quests', desc: 'Create and manage quests' },
                      { key: 'canManageMembers', label: 'Can Manage Members', desc: 'Access member management tools' },
                      { key: 'canViewWarData', label: 'Can View War Data', desc: 'Access war planning and data' },
                      { key: 'canManageEconomics', label: 'Can Manage Economics', desc: 'Access economic tools and data' },
                      { key: 'canManageRecruitment', label: 'Can Manage Recruitment', desc: 'Access recruitment tools' }
                    ].map(permission => (
                      <label key={permission.key} className="flex items-start cp-checkbox">
                        <input
                          type="checkbox"
                          checked={newRole[permission.key as keyof CreateRoleData] as boolean}
                          onChange={(e) => setNewRole(prev => ({ 
                            ...prev, 
                            [permission.key]: e.target.checked 
                          }))}
                          className="mr-3 mt-1"
                        />
                        <div>
                          <span className="text-cp-text-primary font-medium">
                            {permission.label}
                          </span>
                          <p className="text-cp-text-muted text-sm">
                            {permission.desc}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-cp-border">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-cp-text-secondary hover:text-cp-text-primary"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRole}
                    disabled={!newRole.name.trim() || isCreating}
                    className="cp-button disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Creating...' : 'Create Role'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role Assignment Modal */}
        {showAssignModal && selectedRole && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="cp-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-cyberpunk text-cp-text-primary">
                      Manage Role: {selectedRole.name}
                    </h2>
                    <p className="text-cp-text-secondary text-sm">
                      Assign or revoke this role from alliance members
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="text-cp-text-muted hover:text-cp-text-primary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <div className="cp-card p-4 border-cp-red bg-cp-red/10 mb-4">
                    <p className="text-cp-red">{error}</p>
                  </div>
                )}

                {/* Search and Assign Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-cp-text-primary mb-3">
                      Assign Role to Member
                    </h3>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cp-text-muted" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by nation name or ID..."
                        className="w-full pl-10 pr-4 py-3 bg-cp-bg-secondary border border-cp-border rounded text-cp-text-primary focus:border-cp-cyan focus:outline-none"
                      />
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 bg-cp-bg-secondary border border-cp-border rounded max-h-48 overflow-y-auto">
                        {searchResults.map(user => (
                          <div key={user.id} className="flex items-center justify-between p-3 border-b border-cp-border last:border-b-0">
                            <div>
                              <div className="text-cp-text-primary font-medium">
                                {user.pwNationName || user.name}
                              </div>
                              {user.pwNationId && (
                                <div className="text-cp-text-muted text-sm">
                                  Nation ID: {user.pwNationId}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => assignRole(user.id)}
                              disabled={isAssigning}
                              className="cp-button-primary px-3 py-1 text-sm disabled:opacity-50"
                            >
                              {isAssigning ? 'Assigning...' : 'Assign'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Current Assignments */}
                  <div>
                    <h3 className="text-lg font-medium text-cp-text-primary mb-3">
                      Current Assignments ({selectedRole.assignedUsers.length})
                    </h3>
                    
                    {selectedRole.assignedUsers.length === 0 ? (
                      <p className="text-cp-text-muted">No users assigned to this role yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedRole.assignedUsers.map(user => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-cp-bg-tertiary rounded">
                            <div>
                              <div className="text-cp-text-primary font-medium">
                                {user.pwNationName || user.name}
                              </div>
                              <div className="text-cp-text-muted text-sm">
                                Assigned: {new Date(user.assignedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <button
                              onClick={() => revokeRole(user.id)}
                              className="text-cp-red hover:text-cp-red/80 p-2"
                              title="Revoke role"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}