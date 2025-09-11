const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing module query...');
    const result = await prisma.allianceModule.findMany({
      where: {
        allianceId: 790,
        enabled: true,
        module: { isActive: true }
      },
      include: {
        module: true,
        alliance: true
      }
    });
    
    console.log('Found alliance modules:', result.length);
    result.forEach(am => {
      console.log('Module:', am.module.name, 'Category:', am.module.category);
    });
  } catch(error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
