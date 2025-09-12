'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Member {
  id: number
  nation_name: string
  leader_name: string
  alliance_position: string
  alliance_position_id: number
  alliance_position_info: {
    id: string
    name: string
    position_level: number
    leader: boolean
    heir: boolean
    officer: boolean
    member: boolean
  }
  cities: number
  score: number
  last_active: string
  nation_url: string
}

type TabType = 'overview' | 'activity' | 'roles' | 'performance'
type SortBy = 'nation_name' | 'cities' | 'position' | 'last_active' | 'score'
type SortOrder = 'asc' | 'desc'

interface MembershipModuleProps {
  allianceId: number
}

export function MembershipModule({ allianceId }: MembershipModuleProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [allianceInfo, setAllianceInfo] = useState<{ name: string; id: number } | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('nation_name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  useEffect(() => {
    if (session && activeTab === 'overview') {
      fetchMembers()
    }
  }, [session, activeTab, allianceId, sortBy, sortOrder])

  const fetchMembers = async () => {
    setMembersLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/modules/membership/members?allianceId=${allianceId}&sortBy=${sortBy}&sortOrder=${sortOrder}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch members')
      }

      const data = await response.json()
      setMembers(data.members || [])
      setAllianceInfo(data.alliance)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching members:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch members')
      setLoading(false)
    } finally {
      setMembersLoading(false)
    }
  }

  const getPositionBadgeColor = (member: Member) => {
    const positionInfo = member.alliance_position_info
    
    // Use the detailed position info if available
    if (positionInfo) {
      if (positionInfo.leader) return 'bg-cp-red border-cp-red text-cp-red' // Leader
      if (positionInfo.heir) return 'bg-cp-orange border-cp-orange text-cp-orange' // Heir
      if (positionInfo.officer) return 'bg-cp-yellow border-cp-yellow text-cp-yellow' // Officer
      if (positionInfo.member) return 'bg-cp-cyan border-cp-cyan text-cp-cyan' // Member
      
      // Fall back to position level if available
      if (positionInfo.position_level >= 8) return 'bg-cp-red border-cp-red text-cp-red' // High level (Heir/Leader)
      if (positionInfo.position_level >= 5) return 'bg-cp-yellow border-cp-yellow text-cp-yellow' // Officers
      if (positionInfo.position_level >= 3) return 'bg-cp-cyan border-cp-cyan text-cp-cyan' // Members
    }
    
    // Fallback to original logic using position_id
    const positionId = member.alliance_position_id
    if (positionId <= 2) return 'bg-cp-red border-cp-red text-cp-red' // Leader/Co-leader
    if (positionId <= 5) return 'bg-cp-yellow border-cp-yellow text-cp-yellow' // Officers
    if (positionId <= 10) return 'bg-cp-green border-cp-green text-cp-green' // Government
    return 'bg-cp-cyan border-cp-cyan text-cp-cyan' // Members
  }

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const tabs = [
    { id: 'overview' as TabType, name: 'Overview', icon: '👥' },
    { id: 'activity' as TabType, name: 'Activity', icon: '📊' },
    { id: 'roles' as TabType, name: 'Roles', icon: '🏛️' },
    { id: 'performance' as TabType, name: 'Performance', icon: '🎯' }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="cp-card p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-cp-bg-tertiary rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-cp-bg-tertiary rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="cp-card p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-cp-cyan/20 rounded border border-cp-cyan flex items-center justify-center mr-4">
            <span className="text-xl">👥</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold font-cyberpunk text-cp-text-primary">
              Membership Management
            </h1>
            <p className="text-cp-text-secondary">
              {allianceInfo ? `${allianceInfo.name} (ID: ${allianceInfo.id})` : `Alliance ID: ${allianceId}`} • {members.length} Members
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="cp-card">
        <div className="border-b border-cp-border">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-cp-cyan text-cp-cyan'
                    : 'border-transparent text-cp-text-secondary hover:text-cp-text-primary hover:border-cp-text-muted'
                }`}
              >
                <span className="inline-flex items-center">
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {error && (
                <div className="cp-card bg-cp-red/10 border-cp-red p-4">
                  <p className="text-cp-red">{error}</p>
                  <button
                    onClick={fetchMembers}
                    className="mt-2 text-sm text-cp-cyan hover:text-cp-cyan/80 underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="cp-card p-4 bg-cp-bg-tertiary">
                  <div className="text-2xl font-bold text-cp-cyan">{members.length}</div>
                  <div className="text-sm text-cp-text-secondary">Total Members</div>
                </div>
                <div className="cp-card p-4 bg-cp-bg-tertiary">
                  <div className="text-2xl font-bold text-cp-green">
                    {members.filter(m => new Date(m.last_active) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                  </div>
                  <div className="text-sm text-cp-text-secondary">Active Today</div>
                </div>
                <div className="cp-card p-4 bg-cp-bg-tertiary">
                  <div className="text-2xl font-bold text-cp-yellow">
                    {members.reduce((sum, m) => sum + m.cities, 0)}
                  </div>
                  <div className="text-sm text-cp-text-secondary">Total Cities</div>
                </div>
                <div className="cp-card p-4 bg-cp-bg-tertiary">
                  <div className="text-2xl font-bold text-cp-text-primary">
                    {Math.round(members.reduce((sum, m) => sum + m.score, 0)).toLocaleString()}
                  </div>
                  <div className="text-sm text-cp-text-secondary">Total Score</div>
                </div>
              </div>

              {/* Sorting Controls */}
              <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="flex gap-2 items-center">
                    <label className="text-sm text-cp-text-secondary">Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortBy)}
                      className="bg-cp-bg-tertiary border border-cp-border rounded px-3 py-1 text-sm text-cp-text-primary focus:border-cp-cyan focus:outline-none"
                    >
                      <option value="nation_name">Nation Name</option>
                      <option value="cities">City Count</option>
                      <option value="position">Position</option>
                      <option value="last_active">Last Active</option>
                      <option value="score">Score</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-cp-bg-tertiary border border-cp-border rounded hover:border-cp-cyan transition-colors"
                  >
                    <span className="text-cp-text-primary">
                      {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder === 'asc' ? 'Low to High' : 'High to Low'}
                    </span>
                  </button>
                </div>
                
                <div className="text-sm text-cp-text-secondary">
                  {members.length} members total
                </div>
              </div>

              {/* Members Table */}
              {membersLoading ? (
                <div className="cp-card p-6">
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
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
                            Member
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-cp-text-secondary uppercase tracking-wider">
                            Position
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-cp-text-secondary uppercase tracking-wider">
                            Cities
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-cp-text-secondary uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-cp-text-secondary uppercase tracking-wider">
                            Last Active
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-cp-text-secondary uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-cp-bg-secondary divide-y divide-cp-border">
                        {members.map((member) => (
                          <tr key={member.id} className="hover:bg-cp-bg-tertiary/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-cp-text-primary">
                                    {member.nation_name}
                                  </div>
                                  <div className="text-sm text-cp-text-secondary">
                                    {member.leader_name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getPositionBadgeColor(member)} bg-opacity-20`}>
                                {member.alliance_position_info?.name || member.alliance_position}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-cp-text-primary">
                              {member.cities}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-cp-text-primary">
                              {Math.round(member.score).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-cp-text-secondary">
                              {formatLastActive(member.last_active)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <a
                                href={member.nation_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cp-cyan hover:text-cp-cyan/80 transition-colors"
                              >
                                View Nation
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">📊</span>
              <h3 className="text-lg font-medium text-cp-text-primary mb-2">Activity Tracking</h3>
              <p className="text-cp-text-secondary">Member activity monitoring and analytics coming soon.</p>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">🏛️</span>
              <h3 className="text-lg font-medium text-cp-text-primary mb-2">Role Management</h3>
              <p className="text-cp-text-secondary">Alliance position and role management tools coming soon.</p>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">🎯</span>
              <h3 className="text-lg font-medium text-cp-text-primary mb-2">Performance Analytics</h3>
              <p className="text-cp-text-secondary">Member performance tracking and reporting coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
