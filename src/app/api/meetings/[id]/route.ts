import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { updateMeetingSchema } from '@/lib/validations/meeting'
import { Role } from '@prisma/client'
import { z } from 'zod'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        agendaItems: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { comments: true },
        },
      },
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error('Error fetching meeting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (![Role.STAFF, Role.ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = updateMeetingSchema.parse({ ...body, id: params.id })

    // Validate that end time is after start time if both are provided
    if (validatedData.startTime && validatedData.endTime) {
      const startTime = new Date(validatedData.startTime)
      const endTime = new Date(validatedData.endTime)
      
      if (endTime <= startTime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      }
    }

    const updateData: any = { ...validatedData }
    delete updateData.id

    // Convert datetime strings to Date objects
    if (updateData.startTime) updateData.startTime = new Date(updateData.startTime)
    if (updateData.endTime) updateData.endTime = new Date(updateData.endTime)

    const meeting = await prisma.meeting.update({
      where: { id: params.id },
      data: updateData,
      include: {
        agendaItems: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { comments: true },
        },
      },
    })

    return NextResponse.json({ meeting })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (![Role.STAFF, Role.ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.meeting.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Meeting deleted successfully' })
  } catch (error) {
    console.error('Error deleting meeting:', error)
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    )
  }
}