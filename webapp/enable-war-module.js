const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enableWarModule() {
  try {
    await prisma.allianceModule.upsert({
      where: {
        allianceId_moduleId: {
          allianceId: 790,
          moduleId: 'war'
        }
      },
      update: {
        enabled: true
      },
      create: {
        allianceId: 790,
        moduleId: 'war',
        enabled: true
      }
    });
    console.log('War module enabled for alliance 790');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enableWarModule();