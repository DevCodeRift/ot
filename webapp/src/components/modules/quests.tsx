'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Target, 
  Users, 
  Award, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  CheckCircle, 
  Clock,
  Star,
  Filter,
  Search,
  UserPlus,
  Settings
} from 'lucide-react'
import { 
  QUEST_METRICS, 
  QUEST_CATEGORIES, 
  QUEST_DIFFICULTIES, 
  QUEST_REWARD_TYPES,
  COMPARISON_LABELS,
  formatMetricValue,
  type QuestMetricDefinition,
  type ComparisonType
} from '@/types/quests'

interface Quest {
  id: string
  name: string
  description?: string
  questType: string
  targetMetric: string
  targetValue: number
  comparisonType: string
  difficulty: string
  estimatedTime?: string
  priority: number
  isRepeatable: boolean
  maxCompletions?: number
  requiredLevel: number
  prerequisites: string[]
  rewardType?: string
  rewardValue?: number
  rewardData?: Record<string, any>
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    name?: string
    discordUsername?: string
  }
  questGroup?: {
    id: string
    name: string
    color?: string
    icon?: string
  }
  metric?: {
    name: string
    description: string
    category: string
    unit: string
  }
  comparisonLabel?: string
  _count: {
    assignments: number
    completions: number
    progress: number
  }
}

interface QuestGroup {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  isActive: boolean
  displayOrder: number
  questCount: number
  totalQuests: number
  activeAssignments: number
  creator: {
    id: string
    name?: string
    discordUsername?: string
  }
  createdAt: string
  updatedAt: string
}

interface QuestsModuleProps {
  allianceId: string
}

export default function QuestsModule({ allianceId }: QuestsModuleProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Data state
  const [questGroups, setQuestGroups] = useState<QuestGroup[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  
  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'groups' | 'quests' | 'assignments'>('overview')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateQuest, setShowCreateQuest] = useState(false)
  const [showAssignQuest, setShowAssignQuest] = useState(false)
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  
  // Forms
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#00f5ff'
  })
  
  const [questForm, setQuestForm] = useState({
    name: '',
    description: '',
    questGroupId: '',
    questType: 'nation_metric',
    targetMetric: 'cities_count',
    targetValue: 10,
    comparisonType: 'gte' as ComparisonType,
    difficulty: 'easy',
    estimatedTime: '',
    priority: 1,
    isRepeatable: false,
    maxCompletions: null as number | null,
    requiredLevel: 0,
    prerequisites: [] as string[],
    rewardType: '',
    rewardValue: null as number | null,
    rewardData: {} as Record<string, any>
  })

  useEffect(() => {
    if (allianceId) {
      fetchQuestData()
    }
  }, [allianceId])

  const fetchQuestData = async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch quest groups
      const groupsResponse = await fetch(`/api/modules/quests/groups?allianceId=${allianceId}`)
      if (!groupsResponse.ok) {
        const errorData = await groupsResponse.json()
        throw new Error(errorData.error || 'Failed to fetch quest groups')
      }
      const groupsData = await groupsResponse.json()
      setQuestGroups(groupsData.questGroups || [])

      // Fetch quests
      const questsResponse = await fetch(`/api/modules/quests?allianceId=${allianceId}&includeAssignments=true`)
      if (!questsResponse.ok) {
        const errorData = await questsResponse.json()
        throw new Error(errorData.error || 'Failed to fetch quests')
      }
      const questsData = await questsResponse.json()
      setQuests(questsData.quests || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quest data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    try {
      const response = await fetch('/api/modules/quests/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allianceId: parseInt(allianceId),
          ...groupForm
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create quest group')
      }

      const data = await response.json()
      setQuestGroups(prev => [...prev, data.questGroup])
      setShowCreateGroup(false)
      setGroupForm({ name: '', description: '', icon: '', color: '#00f5ff' })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quest group')
    }
  }

  const handleCreateQuest = async () => {
    try {
      const response = await fetch('/api/modules/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allianceId: parseInt(allianceId),
          ...questForm,
          questGroupId: questForm.questGroupId || null,
          maxCompletions: questForm.maxCompletions || null,
          rewardValue: questForm.rewardValue || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create quest')
      }

      const data = await response.json()
      setQuests(prev => [...prev, data.quest])
      setShowCreateQuest(false)
      setQuestForm({
        name: '',
        description: '',
        questGroupId: '',
        questType: 'nation_metric',
        targetMetric: 'cities_count',
        targetValue: 10,
        comparisonType: 'gte',
        difficulty: 'easy',
        estimatedTime: '',
        priority: 1,
        isRepeatable: false,
        maxCompletions: null,
        requiredLevel: 0,
        prerequisites: [],
        rewardType: '',
        rewardValue: null,
        rewardData: {}
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quest')
    }
  }

  const selectedMetric = QUEST_METRICS.find(m => m.id === questForm.targetMetric)

  // Filter quests
  const filteredQuests = quests.filter(quest => {
    const matchesSearch = !searchTerm || 
      quest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quest.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDifficulty = !difficultyFilter || quest.difficulty === difficultyFilter
    const matchesCategory = !categoryFilter || quest.metric?.category === categoryFilter
    const matchesGroup = !selectedGroup || quest.questGroup?.id === selectedGroup

    return matchesSearch && matchesDifficulty && matchesCategory && matchesGroup
  })

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Target },
    { id: 'groups', name: 'Quest Groups', icon: Users },
    { id: 'quests', name: 'Quests', icon: Award },
    { id: 'assignments', name: 'Assignments', icon: UserPlus }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cp-cyan mb-2">Quest Management</h1>
          <p className="text-cp-text-secondary">
            Create and manage quests for alliance members
          </p>
        </div>
        <div className="cp-card p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-cp-bg-tertiary rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cp-cyan mb-2">Quest Management</h1>
        <p className="text-cp-text-secondary">
          Create and manage quests for alliance members
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-cp-border mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
          <div className="text-cp-red whitespace-pre-wrap">{error}</div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="cp-card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-cp-cyan/20 rounded-lg">
                  <Users className="w-6 h-6 text-cp-cyan" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-cp-text-secondary">Quest Groups</p>
                  <p className="text-2xl font-bold text-cp-text-primary">{questGroups.length}</p>
                </div>
              </div>
            </div>

            <div className="cp-card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-cp-green/20 rounded-lg">
                  <Award className="w-6 h-6 text-cp-green" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-cp-text-secondary">Active Quests</p>
                  <p className="text-2xl font-bold text-cp-text-primary">
                    {quests.filter(q => q.isActive).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="cp-card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-cp-yellow/20 rounded-lg">
                  <Clock className="w-6 h-6 text-cp-yellow" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-cp-text-secondary">Total Assignments</p>
                  <p className="text-2xl font-bold text-cp-text-primary">
                    {quests.reduce((sum, q) => sum + q._count.assignments, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="cp-card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-cp-purple/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-cp-purple" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-cp-text-secondary">Completions</p>
                  <p className="text-2xl font-bold text-cp-text-primary">
                    {quests.reduce((sum, q) => sum + q._count.completions, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="cp-card p-6">
            <h3 className="text-lg font-semibold text-cp-text-primary mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="cp-button-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Quest Group
              </button>
              <button
                onClick={() => setShowCreateQuest(true)}
                className="cp-button-secondary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Quest
              </button>
              <button
                onClick={() => setShowAssignQuest(true)}
                className="cp-button-secondary flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Assign Quests
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="cp-card p-6">
            <h3 className="text-lg font-semibold text-cp-text-primary mb-4">Recent Quest Activity</h3>
            <div className="space-y-3">
              {quests.slice(0, 5).map(quest => (
                <div key={quest.id} className="flex items-center justify-between py-2 border-b border-cp-border last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      quest.isActive ? 'bg-cp-green' : 'bg-cp-gray'
                    }`} />
                    <div>
                      <p className="font-medium text-cp-text-primary">{quest.name}</p>
                      <p className="text-sm text-cp-text-secondary">
                        {quest._count.assignments} assignments • {quest._count.completions} completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      quest.difficulty === 'easy' ? 'bg-cp-green/20 text-cp-green' :
                      quest.difficulty === 'medium' ? 'bg-cp-yellow/20 text-cp-yellow' :
                      quest.difficulty === 'hard' ? 'bg-cp-orange/20 text-cp-orange' :
                      'bg-cp-red/20 text-cp-red'
                    }`}>
                      {quest.difficulty}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Quest Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="cp-card p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-cp-text-primary mb-4">Create Quest Group</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cp-text-secondary mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  className="cp-input"
                  placeholder="e.g., New Member Onboarding"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cp-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                  className="cp-input h-20 resize-none"
                  placeholder="Describe the purpose of this quest group..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cp-text-secondary mb-1">
                    Icon
                  </label>
                  <select
                    value={groupForm.icon}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, icon: e.target.value }))}
                    className="cp-input"
                  >
                    <option value="">Select icon...</option>
                    <option value="user-plus">👤 User Plus</option>
                    <option value="building">🏢 Building</option>
                    <option value="shield">🛡️ Shield</option>
                    <option value="coins">💰 Coins</option>
                    <option value="star">⭐ Star</option>
                    <option value="calendar">📅 Calendar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cp-text-secondary mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={groupForm.color}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, color: e.target.value }))}
                    className="cp-input h-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="cp-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupForm.name}
                className="cp-button-primary disabled:opacity-50"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* This component is getting quite large - in the real implementation, 
          we would split this into multiple components for better maintainability */}
    </div>
  )
}
