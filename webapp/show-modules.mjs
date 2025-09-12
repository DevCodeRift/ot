// Show available modules without database connection
const modules = [
  {
    id: 'membership',
    name: 'Membership Management',
    description: 'Manage alliance members, track activity, assign roles, and monitor performance',
    category: 'membership',
    requiredPerms: ['alliance_member'],
  },
  {
    id: 'war',
    name: 'War Management', 
    description: 'Coordinate wars, assign targets, track battles, and plan military operations with advanced raid finder',
    category: 'war',
    requiredPerms: ['alliance_member'],
  },
  {
    id: 'quests',
    name: 'Quest & Achievement System',
    description: 'Create and manage member quests, achievements, and progression tracking',
    category: 'gamification',
    requiredPerms: ['alliance_member'],
  },
  {
    id: 'recruitment',
    name: 'Recruitment System',
    description: 'Manage applications, track recruitment campaigns, and onboard new members',
    category: 'recruitment',
    requiredPerms: ['alliance_recruit'],
  },
  {
    id: 'economic-tools',
    name: 'Economic Tools',
    description: 'Advanced tax management and member holdings tracking system',
    category: 'economics',
    requiredPerms: ['alliance_tax'],
  }
]

console.log('📋 Available Modules:')
console.log('==================')
modules.forEach((module, index) => {
  console.log(`${index + 1}. ${module.name} (${module.id})`)
  console.log(`   Category: ${module.category}`)
  console.log(`   Description: ${module.description}`)
  console.log(`   Permissions: ${module.requiredPerms.join(', ')}`)
  console.log('')
})

console.log(`Total modules: ${modules.length}`)