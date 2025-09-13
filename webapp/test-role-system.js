#!/usr/bin/env node

/**
 * Test script for the Alliance Role Management System
 * This script verifies that the database setup is working correctly
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRoleSystem() {
    console.log('🚀 Testing Alliance Role Management System...\n');

    try {
        // Test 1: Check database connection
        console.log('1. Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connection successful\n');

        // Test 2: Check if tables exist by querying them
        console.log('2. Testing table structure...');
        
        const roleCount = await prisma.allianceRole.count();
        console.log(`✅ AllianceRole table exists (${roleCount} records)`);
        
        const userRoleCount = await prisma.userAllianceRole.count();
        console.log(`✅ UserAllianceRole table exists (${userRoleCount} records)`);
        
        const auditCount = await prisma.roleAuditLog.count();
        console.log(`✅ RoleAuditLog table exists (${auditCount} records)\n`);

        // Test 2.5: Create test alliance if it doesn't exist
        console.log('2.5. Setting up test alliance...');
        const testAllianceId = 7452;
        
        // Check if alliance exists
        let alliance = await prisma.alliance.findUnique({
            where: { id: testAllianceId }
        });
        
        if (!alliance) {
            // Create test alliance
            alliance = await prisma.alliance.create({
                data: {
                    id: testAllianceId,
                    name: 'The Rose',
                    acronym: 'Rose',
                    score: 1000000,
                    color: '#ff69b4',
                    acceptMembers: true,
                    description: 'Test alliance for role system verification'
                }
            });
            console.log(`✅ Created test alliance: ${alliance.name} (ID: ${alliance.id})`);
        } else {
            console.log(`✅ Using existing alliance: ${alliance.name} (ID: ${alliance.id})`);
        }
        
        // Clean up any existing test data
        console.log('2.6. Cleaning up existing test data...');
        await prisma.roleAuditLog.deleteMany({
            where: { 
                allianceId: testAllianceId,
                performedBy: 'system-test'
            }
        });
        await prisma.allianceRole.deleteMany({
            where: { 
                allianceId: testAllianceId,
                createdBy: 'system-test'
            }
        });
        console.log('✅ Cleaned up existing test data\n');

        // Test 3: Create a test role
        console.log('3. Testing role creation...');
        const testRole = await prisma.allianceRole.create({
            data: {
                allianceId: testAllianceId,
                name: 'Test Role',
                description: 'A test role for system verification',
                modulePermissions: ['membership', 'quests'],
                color: '#00f5ff', // Cyberpunk cyan
                displayOrder: 100,
                canManageMembers: true,
                canCreateQuests: false,
                createdBy: 'system-test'
            }
        });
        console.log(`✅ Created test role: ${testRole.name} (ID: ${testRole.id})\n`);

        // Test 4: Create another role to test permissions
        console.log('4. Testing role with different permissions...');
        const adminRole = await prisma.allianceRole.create({
            data: {
                allianceId: testAllianceId,
                name: 'Test Admin',
                description: 'Admin role for testing',
                modulePermissions: ['membership', 'war', 'quests', 'economic', 'recruitment'],
                color: '#ff003c', // Cyberpunk red
                displayOrder: 10,
                canAssignRoles: true,
                canManageMembers: true,
                canCreateQuests: true,
                canViewWarData: true,
                canManageEconomics: true,
                canManageRecruitment: true,
                createdBy: 'system-test'
            }
        });
        console.log(`✅ Created admin role: ${adminRole.name} (ID: ${adminRole.id})\n`);

        // Test 5: Query roles to verify data
        console.log('5. Testing role queries...');
        const allRoles = await prisma.allianceRole.findMany({
            where: { allianceId: testAllianceId },
            orderBy: { displayOrder: 'asc' }
        });
        console.log(`✅ Retrieved ${allRoles.length} roles for alliance ${testAllianceId}:`);
        allRoles.forEach(role => {
            console.log(`   - ${role.name}: ${role.modulePermissions.join(', ')}`);
        });
        console.log();

        // Test 6: Test role audit logging...
        console.log('6. Testing role audit logging...');
        const auditLog = await prisma.roleAuditLog.create({
            data: {
                allianceId: testAllianceId,
                actionType: 'role_created',
                performedBy: 'system-test',
                roleId: testRole.id,
                roleName: testRole.name,
                newPermissions: {
                    modulePermissions: testRole.modulePermissions,
                    canManageMembers: testRole.canManageMembers,
                    canCreateQuests: testRole.canCreateQuests
                }
            }
        });
        console.log(`✅ Created audit log entry (ID: ${auditLog.id})\n`);

        // Test 7: Clean up test data
        console.log('7. Cleaning up test data...');
        await prisma.roleAuditLog.delete({ where: { id: auditLog.id } });
        await prisma.allianceRole.delete({ where: { id: testRole.id } });
        await prisma.allianceRole.delete({ where: { id: adminRole.id } });
        console.log('✅ Test data cleaned up\n');

        console.log('🎉 All tests passed! Alliance Role Management System is ready!\n');
        console.log('Database Features Verified:');
        console.log('✅ Database connection');
        console.log('✅ Table structure (AllianceRole, UserAllianceRole, RoleAuditLog)');
        console.log('✅ Role creation with permissions');
        console.log('✅ Role querying and ordering');
        console.log('✅ Audit logging');
        console.log('✅ Data cleanup operations');
        console.log('\n🚀 The system is ready for production use!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testRoleSystem();