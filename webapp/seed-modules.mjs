// Seed script to create the 5 core modules
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const modules = [
  {
    id: 'membership',
    name: 'Membership Management',
    description: 'Manage alliance members, track activity, assign roles, and monitor performance',
    category: 'member-mgmt',
    requiredPerms: ['alliance_member'],
  },
  {
    id: 'war',
    name: 'War Management', 
    description: 'Coordinate wars, assign targets, track battles, and plan military operations',
    category: 'war-mgmt',
    requiredPerms: ['alliance_member'],
  },
  {
    id: 'banking',
    name: 'Banking & Economics',
    description: 'Manage alliance bank, track taxes, handle loans, and monitor economic metrics',
    category: 'economic',
    requiredPerms: ['alliance_member'],
  },
  {
    id: 'recruitment',
    name: 'Recruitment System',
    description: 'Manage applications, track recruitment campaigns, and onboard new members',
    category: 'recruitment', 
    requiredPerms: ['alliance_member'],
  },
  {
    id: 'quests',
    name: 'Quest & Achievement System',
    description: 'Create and manage member quests, achievements, and progression tracking',
    category: 'gamification',
    requiredPerms: ['alliance_member'],
  }
]

async function seedModules() {
  try {
    console.log('🌱 Seeding alliance modules...')
    
    for (const module of modules) {
      const result = await prisma.module.upsert({
        where: { id: module.id },
        update: {
          name: module.name,
          description: module.description,
          category: module.category,
          requiredPerms: module.requiredPerms,
          isActive: true,
        },
        create: {
          id: module.id,
          name: module.name,
          description: module.description,
          category: module.category,
          requiredPerms: module.requiredPerms,
          isActive: true,
        },
      })
      
      console.log(`✅ ${result.name} (${result.id})`)
    }
    
    console.log('\n🎉 All modules seeded successfully!')
    
    // Show all modules
    const allModules = await prisma.module.findMany({
      orderBy: { name: 'asc' }
    })
    
    console.log('\n📋 Available modules:')
    allModules.forEach(module => {
      console.log(`  • ${module.name} (${module.id}) - ${module.category}`)
    })
    
  } catch (error) {
    console.error('❌ Error seeding modules:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedModules()
