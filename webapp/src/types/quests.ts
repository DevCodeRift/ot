// Quest System Type Definitions

export interface QuestMetricDefinition {
  id: string
  name: string
  description: string
  category: 'nation' | 'military' | 'economic' | 'diplomatic' | 'alliance'
  dataPath: string // Path to the metric in P&W API response
  unit: string // Unit of measurement (cities, points, millions, etc.)
  defaultTarget?: number
  minTarget?: number
  maxTarget?: number
  comparisonTypes: ComparisonType[]
}

export type ComparisonType = 'gte' | 'lte' | 'eq' | 'gt' | 'lt'

export interface QuestType {
  id: string
  name: string
  description: string
  category: string
  metrics: QuestMetricDefinition[]
}

// Available Quest Metrics from P&W API
export const QUEST_METRICS: QuestMetricDefinition[] = [
  // Nation Development Metrics
  {
    id: 'cities_count',
    name: 'Cities Count',
    description: 'Total number of cities owned',
    category: 'nation',
    dataPath: 'numCities',
    unit: 'cities',
    defaultTarget: 10,
    minTarget: 1,
    maxTarget: 50,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'nation_score',
    name: 'Nation Score',
    description: 'Total nation score points',
    category: 'nation',
    dataPath: 'score',
    unit: 'points',
    defaultTarget: 1000,
    minTarget: 100,
    maxTarget: 50000,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'population',
    name: 'Population',
    description: 'Total nation population',
    category: 'nation',
    dataPath: 'population',
    unit: 'citizens',
    defaultTarget: 1000000,
    minTarget: 50000,
    maxTarget: 10000000,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'infrastructure_total',
    name: 'Total Infrastructure',
    description: 'Combined infrastructure across all cities',
    category: 'nation',
    dataPath: 'cities.infrastructure',
    unit: 'infra points',
    defaultTarget: 5000,
    minTarget: 500,
    maxTarget: 50000,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'land_total',
    name: 'Total Land',
    description: 'Combined land across all cities',
    category: 'nation',
    dataPath: 'cities.land',
    unit: 'land',
    defaultTarget: 10000,
    minTarget: 1000,
    maxTarget: 100000,
    comparisonTypes: ['gte', 'eq', 'lte']
  },

  // Military Metrics
  {
    id: 'soldiers',
    name: 'Soldiers',
    description: 'Total number of soldiers',
    category: 'military',
    dataPath: 'soldiers',
    unit: 'soldiers',
    defaultTarget: 100000,
    minTarget: 1000,
    maxTarget: 1000000,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'tanks',
    name: 'Tanks',
    description: 'Total number of tanks',
    category: 'military',
    dataPath: 'tanks',
    unit: 'tanks',
    defaultTarget: 5000,
    minTarget: 100,
    maxTarget: 50000,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'aircraft',
    name: 'Aircraft',
    description: 'Total number of aircraft',
    category: 'military',
    dataPath: 'aircraft',
    unit: 'aircraft',
    defaultTarget: 2000,
    minTarget: 50,
    maxTarget: 20000,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'ships',
    name: 'Ships',
    description: 'Total number of ships',
    category: 'military',
    dataPath: 'ships',
    unit: 'ships',
    defaultTarget: 100,
    minTarget: 5,
    maxTarget: 1000,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'missiles',
    name: 'Missiles',
    description: 'Total number of missiles',
    category: 'military',
    dataPath: 'missiles',
    unit: 'missiles',
    defaultTarget: 5,
    minTarget: 1,
    maxTarget: 50,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'nukes',
    name: 'Nuclear Weapons',
    description: 'Total number of nuclear weapons',
    category: 'military',
    dataPath: 'nukes',
    unit: 'nukes',
    defaultTarget: 1,
    minTarget: 1,
    maxTarget: 20,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'spies',
    name: 'Spies',
    description: 'Total number of spies',
    category: 'military',
    dataPath: 'spies',
    unit: 'spies',
    defaultTarget: 50,
    minTarget: 5,
    maxTarget: 500,
    comparisonTypes: ['gte', 'eq', 'lte']
  },

  // Economic Metrics
  {
    id: 'money',
    name: 'Money',
    description: 'Total money in treasury',
    category: 'economic',
    dataPath: 'money',
    unit: 'millions',
    defaultTarget: 100,
    minTarget: 1,
    maxTarget: 10000,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'credits',
    name: 'Credits',
    description: 'Total credits owned',
    category: 'economic',
    dataPath: 'credits',
    unit: 'credits',
    defaultTarget: 1000,
    minTarget: 100,
    maxTarget: 100000,
    comparisonTypes: ['gte', 'eq', 'lte']
  },

  // War Metrics (requires custom tracking)
  {
    id: 'wars_won',
    name: 'Wars Won',
    description: 'Total number of wars won',
    category: 'military',
    dataPath: 'custom.warsWon',
    unit: 'wars',
    defaultTarget: 5,
    minTarget: 1,
    maxTarget: 100,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'wars_declared',
    name: 'Wars Declared',
    description: 'Total number of wars declared',
    category: 'military',
    dataPath: 'custom.warsDeclared',
    unit: 'wars',
    defaultTarget: 10,
    minTarget: 1,
    maxTarget: 200,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'defensive_wars',
    name: 'Defensive Wars',
    description: 'Total number of defensive wars fought',
    category: 'military',
    dataPath: 'custom.defensiveWars',
    unit: 'wars',
    defaultTarget: 5,
    minTarget: 1,
    maxTarget: 100,
    comparisonTypes: ['gte', 'eq', 'lte']
  },

  // Alliance Activity Metrics
  {
    id: 'alliance_days',
    name: 'Days in Alliance',
    description: 'Number of days as an alliance member',
    category: 'alliance',
    dataPath: 'custom.allianceDays',
    unit: 'days',
    defaultTarget: 30,
    minTarget: 1,
    maxTarget: 365,
    comparisonTypes: ['gte', 'eq', 'lte']
  },
  {
    id: 'login_streak',
    name: 'Login Streak',
    description: 'Consecutive days logged in',
    category: 'nation',
    dataPath: 'custom.loginStreak',
    unit: 'days',
    defaultTarget: 7,
    minTarget: 1,
    maxTarget: 100,
    comparisonTypes: ['gte', 'eq', 'lte']
  }
]

// Quest Type Categories
export const QUEST_CATEGORIES = [
  {
    id: 'onboarding',
    name: 'New Member Onboarding',
    description: 'Essential tasks for new alliance members',
    icon: 'user-plus',
    color: '#00f5ff'
  },
  {
    id: 'development',
    name: 'Nation Development',
    description: 'Building and growing your nation',
    icon: 'building',
    color: '#00ff9f'
  },
  {
    id: 'military',
    name: 'Military Training',
    description: 'Building military strength and war skills',
    icon: 'shield',
    color: '#ff003c'
  },
  {
    id: 'economic',
    name: 'Economic Growth',
    description: 'Managing resources and trade',
    icon: 'coins',
    color: '#fcee0a'
  },
  {
    id: 'advanced',
    name: 'Advanced Tasks',
    description: 'Challenging goals for experienced members',
    icon: 'star',
    color: '#b847ca'
  },
  {
    id: 'special',
    name: 'Special Events',
    description: 'Limited-time or special occasion quests',
    icon: 'calendar',
    color: '#ff6b35'
  }
]

// Quest Difficulty Levels
export const QUEST_DIFFICULTIES = [
  {
    id: 'easy',
    name: 'Easy',
    color: '#00ff9f',
    description: 'Quick and simple tasks for beginners',
    estimatedTime: '1-3 days'
  },
  {
    id: 'medium',
    name: 'Medium',
    color: '#fcee0a',
    description: 'Moderate challenges requiring some effort',
    estimatedTime: '1-2 weeks'
  },
  {
    id: 'hard',
    name: 'Hard',
    color: '#ff6b35',
    description: 'Challenging tasks requiring dedication',
    estimatedTime: '2-4 weeks'
  },
  {
    id: 'expert',
    name: 'Expert',
    color: '#ff003c',
    description: 'Very difficult long-term goals',
    estimatedTime: '1-3 months'
  }
]

// Quest Reward Types
export const QUEST_REWARD_TYPES = [
  {
    id: 'experience',
    name: 'Experience Points',
    description: 'Alliance experience points',
    icon: 'star'
  },
  {
    id: 'badge',
    name: 'Achievement Badge',
    description: 'Special recognition badge',
    icon: 'award'
  },
  {
    id: 'resources',
    name: 'Resource Reward',
    description: 'In-game resources or money',
    icon: 'coins'
  },
  {
    id: 'custom',
    name: 'Custom Reward',
    description: 'Custom reward defined by alliance',
    icon: 'gift'
  }
]

// Comparison Type Labels
export const COMPARISON_LABELS: Record<ComparisonType, string> = {
  'gte': 'Greater than or equal to',
  'lte': 'Less than or equal to',
  'eq': 'Equal to',
  'gt': 'Greater than',
  'lt': 'Less than'
}

// Quest Status Types
export type QuestStatus = 'active' | 'completed' | 'cancelled' | 'overdue'

export const QUEST_STATUS_LABELS: Record<QuestStatus, string> = {
  'active': 'Active',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'overdue': 'Overdue'
}

export const QUEST_STATUS_COLORS: Record<QuestStatus, string> = {
  'active': '#00f5ff',
  'completed': '#00ff9f',
  'cancelled': '#666666',
  'overdue': '#ff003c'
}

// Quest Progress Milestone Percentages
export const QUEST_MILESTONES = [25, 50, 75, 90]

// Utility Functions
export function getMetricById(id: string): QuestMetricDefinition | undefined {
  return QUEST_METRICS.find(metric => metric.id === id)
}

export function getCategoryById(id: string) {
  return QUEST_CATEGORIES.find(category => category.id === id)
}

export function getDifficultyById(id: string) {
  return QUEST_DIFFICULTIES.find(difficulty => difficulty.id === id)
}

export function getRewardTypeById(id: string) {
  return QUEST_REWARD_TYPES.find(reward => reward.id === id)
}

export function formatMetricValue(value: number, unit: string): string {
  if (unit === 'millions' && value >= 1) {
    return `$${value.toLocaleString()}M`
  }
  if (unit === 'citizens' && value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M citizens`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M ${unit}`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K ${unit}`
  }
  return `${value.toLocaleString()} ${unit}`
}

export function calculateProgress(current: number, target: number, comparisonType: ComparisonType): number {
  switch (comparisonType) {
    case 'gte':
    case 'gt':
      return Math.min((current / target) * 100, 100)
    case 'lte':
    case 'lt':
      return current <= target ? 100 : 0
    case 'eq':
      return current === target ? 100 : 0
    default:
      return 0
  }
}

export function isQuestCompleted(current: number, target: number, comparisonType: ComparisonType): boolean {
  switch (comparisonType) {
    case 'gte':
      return current >= target
    case 'lte':
      return current <= target
    case 'gt':
      return current > target
    case 'lt':
      return current < target
    case 'eq':
      return current === target
    default:
      return false
  }
}
