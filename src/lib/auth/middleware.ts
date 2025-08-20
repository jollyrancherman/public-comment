import { getServerSession } from 'next-auth'
import { authOptions } from './auth-config'
import { Role } from '@prisma/client'
import { NextResponse } from 'next/server'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  return session
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth()
  
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden')
  }
  
  return session
}

export function withAuth(handler: Function, allowedRoles?: Role[]) {
  return async function (req: Request, ...args: any[]) {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      if (allowedRoles && !allowedRoles.includes(session.user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      return handler(req, ...args)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }
}