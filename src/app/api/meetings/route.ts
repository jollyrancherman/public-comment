import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { createMeetingSchema } from '@/lib/validations/meeting'
import { Role } from '@prisma/client'
import { z } from 'zod'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const whereClause = status ? { status: status as any } : {}
    
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
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
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