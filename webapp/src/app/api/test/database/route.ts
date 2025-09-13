import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Test basic database connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('Database connection test:', result)

    // Test if we can access basic tables
    try {
      const userCount = await prisma.user.count()
      console.log('Users table accessible, count:', userCount)
      
      // Try to check if alliance_roles table exists using raw query
      try {
        const roleTableCheck = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'alliance_roles'
        `
        console.log('Alliance roles table check:', roleTableCheck)
        
        return NextResponse.json({ 
          status: 'success',
          message: 'Database connection working',
          userCount,
          tables: {
            users: 'accessible',
            alliance_roles: Array.isArray(roleTableCheck) && roleTableCheck.length > 0 ? 'exists' : 'missing'
          }
        })
      } catch (tableCheckError) {
        console.error('Table check error:', tableCheckError)
        
        return NextResponse.json({ 
          status: 'partial',
          message: 'Database connected but cannot check alliance_roles table',
          userCount,
          error: tableCheckError instanceof Error ? tableCheckError.message : 'Unknown table check error'
        })
      }
      
    } catch (tableError) {
      console.error('Basic table access error:', tableError)
      
      return NextResponse.json({ 
        status: 'partial',
        message: 'Database connected but basic tables not accessible',
        error: tableError instanceof Error ? tableError.message : 'Unknown table error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Database connection error:', error)
    
    return NextResponse.json({ 
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown database error'
    }, { status: 500 })
  }
}