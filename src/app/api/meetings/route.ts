import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { createMeetingSchema } from '@/lib/validations/meeting'
import { Role, MeetingStatus } from '@prisma/client'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/security/sanitization'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Validate status parameter against enum values
    const whereClause = status && Object.values(MeetingStatus).includes(status as MeetingStatus)
      ? { status: status as MeetingStatus }
      : {}
    
    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      include: {
        agendaItems: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { startTime: 'desc' },
      take: limit ? Math.max(1, Math.min(100, parseInt(limit) || 10)) : undefined,
      skip: offset ? Math.max(0, parseInt(offset) || 0) : undefined,
    })

    return NextResponse.json({ meetings })
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (![Role.STAFF, Role.ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Rate limiting for meeting creation
    const rateLimitResult = checkRateLimit(`meeting-create-${session.user.id}`, 5, 60000)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    const validatedData = createMeetingSchema.parse(body)

    // Validate that end time is after start time
    const startTime = new Date(validatedData.startTime)
    const endTime = new Date(validatedData.endTime)
    
    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    const meeting = await prisma.meeting.create({
      data: {
        ...validatedData,
        startTime,
        endTime,
      },
      include: {
        agendaItems: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    return NextResponse.json({ meeting }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    )
  }
}