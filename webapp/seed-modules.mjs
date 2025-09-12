// Seed script to create the core modules
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
  }
]

async function seedModules() {
  try {
    console.log('🌱 Seeding core alliance modules...')
    
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
    
    console.log('\n🎉 Core modules seeded successfully!')
    
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
