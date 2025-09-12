// Quest System Type Definitions

export interface QuestMetricDefinition {
  id: string
  name: string
  description: string
  category: 'nation' | 'military' | 'economic' | 'diplomatic' | 'alliance' | 'projects'
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
  },

  // Policy and Diplomatic Metrics
  {
    id: 'war_policy',
    name: 'War Policy',
    description: 'Current war policy setting',
    category: 'diplomatic',
    dataPath: 'war_policy',
    unit: 'policy',
    comparisonTypes: ['eq']
  },
  {
    id: 'domestic_policy',
    name: 'Domestic Policy',
    description: 'Current domestic policy setting',
    category: 'diplomatic',
    dataPath: 'domestic_policy',
    unit: 'policy',
    comparisonTypes: ['eq']
  },

  // Project Metrics (Nation Development Projects)
  {
    id: 'iron_works',
    name: 'Ironworks Project',
    description: 'Whether the nation has built the Ironworks project',
    category: 'nation',
    dataPath: 'iron_works',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'bauxite_works',
    name: 'Bauxiteworks Project',
    description: 'Whether the nation has built the Bauxiteworks project',
    category: 'nation',
    dataPath: 'bauxite_works',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'arms_stockpile',
    name: 'Arms Stockpile Project',
    description: 'Whether the nation has built the Arms Stockpile project',
    category: 'military',
    dataPath: 'arms_stockpile',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'emergency_gasoline_reserve',
    name: 'Emergency Gasoline Reserve Project',
    description: 'Whether the nation has built the Emergency Gasoline Reserve project',
    category: 'economic',
    dataPath: 'emergency_gasoline_reserve',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'mass_irrigation',
    name: 'Mass Irrigation Project',
    description: 'Whether the nation has built the Mass Irrigation project',
    category: 'economic',
    dataPath: 'mass_irrigation',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'international_trade_center',
    name: 'International Trade Center Project',
    description: 'Whether the nation has built the International Trade Center project',
    category: 'economic',
    dataPath: 'international_trade_center',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'missile_launch_pad',
    name: 'Missile Launch Pad Project',
    description: 'Whether the nation has built the Missile Launch Pad project',
    category: 'military',
    dataPath: 'missile_launch_pad',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'nuclear_research_facility',
    name: 'Nuclear Research Facility Project',
    description: 'Whether the nation has built the Nuclear Research Facility project',
    category: 'military',
    dataPath: 'nuclear_research_facility',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'iron_dome',
    name: 'Iron Dome Project',
    description: 'Whether the nation has built the Iron Dome project',
    category: 'military',
    dataPath: 'iron_dome',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'vital_defense_system',
    name: 'Vital Defense System Project',
    description: 'Whether the nation has built the Vital Defense System project',
    category: 'military',
    dataPath: 'vital_defense_system',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'central_intelligence_agency',
    name: 'Central Intelligence Agency Project',
    description: 'Whether the nation has built the Central Intelligence Agency project',
    category: 'military',
    dataPath: 'central_intelligence_agency',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'center_for_civil_engineering',
    name: 'Center for Civil Engineering Project',
    description: 'Whether the nation has built the Center for Civil Engineering project',
    category: 'nation',
    dataPath: 'center_for_civil_engineering',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'propaganda_bureau',
    name: 'Propaganda Bureau Project',
    description: 'Whether the nation has built the Propaganda Bureau project',
    category: 'nation',
    dataPath: 'propaganda_bureau',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'uranium_enrichment_program',
    name: 'Uranium Enrichment Program Project',
    description: 'Whether the nation has built the Uranium Enrichment Program project',
    category: 'military',
    dataPath: 'uranium_enrichment_program',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'urban_planning',
    name: 'Urban Planning Project',
    description: 'Whether the nation has built the Urban Planning project',
    category: 'nation',
    dataPath: 'urban_planning',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'advanced_urban_planning',
    name: 'Advanced Urban Planning Project',
    description: 'Whether the nation has built the Advanced Urban Planning project',
    category: 'nation',
    dataPath: 'advanced_urban_planning',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'space_program',
    name: 'Space Program Project',
    description: 'Whether the nation has built the Space Program project',
    category: 'nation',
    dataPath: 'space_program',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'spy_satellite',
    name: 'Spy Satellite Project',
    description: 'Whether the nation has built the Spy Satellite project',
    category: 'military',
    dataPath: 'spy_satellite',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'moon_landing',
    name: 'Moon Landing Project',
    description: 'Whether the nation has built the Moon Landing project',
    category: 'nation',
    dataPath: 'moon_landing',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'pirate_economy',
    name: 'Pirate Economy Project',
    description: 'Whether the nation has built the Pirate Economy project',
    category: 'economic',
    dataPath: 'pirate_economy',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'recycling_initiative',
    name: 'Recycling Initiative Project',
    description: 'Whether the nation has built the Recycling Initiative project',
    category: 'economic',
    dataPath: 'recycling_initiative',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'telecommunications_satellite',
    name: 'Telecommunications Satellite Project',
    description: 'Whether the nation has built the Telecommunications Satellite project',
    category: 'nation',
    dataPath: 'telecommunications_satellite',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'green_technologies',
    name: 'Green Technologies Project',
    description: 'Whether the nation has built the Green Technologies project',
    category: 'economic',
    dataPath: 'green_technologies',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'arable_land_agency',
    name: 'Arable Land Agency Project',
    description: 'Whether the nation has built the Arable Land Agency project',
    category: 'economic',
    dataPath: 'arable_land_agency',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'clinical_research_center',
    name: 'Clinical Research Center Project',
    description: 'Whether the nation has built the Clinical Research Center project',
    category: 'nation',
    dataPath: 'clinical_research_center',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'specialized_police_training_program',
    name: 'Specialized Police Training Program Project',
    description: 'Whether the nation has built the Specialized Police Training Program project',
    category: 'nation',
    dataPath: 'specialized_police_training_program',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'advanced_engineering_corps',
    name: 'Advanced Engineering Corps Project',
    description: 'Whether the nation has built the Advanced Engineering Corps project',
    category: 'nation',
    dataPath: 'advanced_engineering_corps',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'government_support_agency',
    name: 'Government Support Agency Project',
    description: 'Whether the nation has built the Government Support Agency project',
    category: 'nation',
    dataPath: 'government_support_agency',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'research_and_development_center',
    name: 'Research and Development Center Project',
    description: 'Whether the nation has built the Research and Development Center project',
    category: 'nation',
    dataPath: 'research_and_development_center',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'metropolitan_planning',
    name: 'Metropolitan Planning Project',
    description: 'Whether the nation has built the Metropolitan Planning project',
    category: 'nation',
    dataPath: 'metropolitan_planning',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'military_salvage',
    name: 'Military Salvage Project',
    description: 'Whether the nation has built the Military Salvage project',
    category: 'military',
    dataPath: 'military_salvage',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'fallout_shelter',
    name: 'Fallout Shelter Project',
    description: 'Whether the nation has built the Fallout Shelter project',
    category: 'nation',
    dataPath: 'fallout_shelter',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'activity_center',
    name: 'Activity Center Project',
    description: 'Whether the nation has built the Activity Center project',
    category: 'nation',
    dataPath: 'activity_center',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'bureau_of_domestic_affairs',
    name: 'Bureau of Domestic Affairs Project',
    description: 'Whether the nation has built the Bureau of Domestic Affairs project',
    category: 'nation',
    dataPath: 'bureau_of_domestic_affairs',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'advanced_pirate_economy',
    name: 'Advanced Pirate Economy Project',
    description: 'Whether the nation has built the Advanced Pirate Economy project',
    category: 'economic',
    dataPath: 'advanced_pirate_economy',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'mars_landing',
    name: 'Mars Landing Project',
    description: 'Whether the nation has built the Mars Landing project',
    category: 'nation',
    dataPath: 'mars_landing',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'surveillance_network',
    name: 'Surveillance Network Project',
    description: 'Whether the nation has built the Surveillance Network project',
    category: 'military',
    dataPath: 'surveillance_network',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'guiding_satellite',
    name: 'Guiding Satellite Project',
    description: 'Whether the nation has built the Guiding Satellite project',
    category: 'military',
    dataPath: 'guiding_satellite',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'nuclear_launch_facility',
    name: 'Nuclear Launch Facility Project',
    description: 'Whether the nation has built the Nuclear Launch Facility project',
    category: 'military',
    dataPath: 'nuclear_launch_facility',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'military_research_center',
    name: 'Military Research Center Project',
    description: 'Whether the nation has built the Military Research Center project',
    category: 'military',
    dataPath: 'military_research_center',
    unit: 'project',
    comparisonTypes: ['eq']
  },
  {
    id: 'military_doctrine',
    name: 'Military Doctrine Project',
    description: 'Whether the nation has built the Military Doctrine project',
    category: 'military',
    dataPath: 'military_doctrine',
    unit: 'project',
    comparisonTypes: ['eq']
  },

  // War and Combat Metrics
  {
    id: 'money_looted',
    name: 'Money Looted',
    description: 'Total amount of money looted across all wars',
    category: 'military',
    dataPath: 'money_looted',
    unit: 'millions',
    defaultTarget: 1000000,
    minTarget: 0,
    maxTarget: 100000000,
    comparisonTypes: ['gte', 'eq', 'lte']
  }
]

// Policy and Bloc Enums (matching P&W API schema)
export const WAR_POLICIES = [
  'ATTRITION',
  'TURTLE', 
  'BLITZKRIEG',
  'FORTRESS',
  'MONEYBAGS',
  'PIRATE',
  'TACTICIAN',
  'GUARDIAN',
  'COVERT',
  'ARCANE'
] as const

export const DOMESTIC_POLICIES = [
  'MANIFEST_DESTINY',
  'OPEN_MARKETS',
  'TECHNOLOGICAL_ADVANCEMENT',
  'IMPERIALISM',
  'URBANIZATION',
  'RAPID_EXPANSION'
] as const

export type WarPolicy = typeof WAR_POLICIES[number]
export type DomesticPolicy = typeof DOMESTIC_POLICIES[number]

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
