import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { createAgendaItemSchema, bulkAgendaImportSchema } from '@/lib/validations/meeting'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/security/sanitization'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agendaItems = await prisma.agendaItem.findMany({
      where: { meetingId: params.id },
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { commentItems: true },
        },
      },
    })

    return NextResponse.json({ agendaItems })
  } catch (error) {
    console.error('Error fetching agenda items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agenda items' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    
    // Check if it's bulk import or single item
    if (Array.isArray(body.items)) {
      // Rate limiting for bulk imports (more restrictive)
      const rateLimitResult = checkRateLimit(`bulk-agenda-${session.user.id}`, 2, 60000)
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { 
            error: 'Bulk import rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          },
          { status: 429 }
        )
      }
      
      // Bulk import
      const validatedData = bulkAgendaImportSchema.parse({
        ...body,
        meetingId: params.id,
      })
      
      // Limit bulk import size
      if (validatedData.items.length > 50) {
        return NextResponse.json(
          { error: 'Bulk import limited to 50 items per request' },
          { status: 400 }
        )
      }

      // Verify meeting exists
      const meeting = await prisma.meeting.findUnique({
        where: { id: params.id },
      })

      if (!meeting) {
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        )
      }

      // Check for existing agenda items and duplicates within the batch
      const existingItems = await prisma.agendaItem.findMany({
        where: {
          meetingId: params.id,
        },
        select: { code: true },
      })
      
      const existingCodes = new Set(existingItems.map(item => item.code))
      const newCodes = new Set()
      const duplicates: string[] = []
      
      for (const item of validatedData.items) {
        if (existingCodes.has(item.code) || newCodes.has(item.code)) {
          duplicates.push(item.code)
        }
        newCodes.add(item.code)
      }
      
      if (duplicates.length > 0) {
        return NextResponse.json(
          { 
            error: `Duplicate agenda item codes found: ${duplicates.join(', ')}`,
            duplicateCodes: duplicates 
          },
          { status: 400 }
        )
      }

      // Create all agenda items in a transaction
      const agendaItems = await prisma.$transaction(
        validatedData.items.map((item, index) =>
          prisma.agendaItem.create({
            data: {
              ...item,
              meetingId: params.id,
              cutoffTime: item.cutoffTime ? new Date(item.cutoffTime) : null,
            },
          })
        )
      )

      return NextResponse.json({ agendaItems }, { status: 201 })
    } else {
      // Rate limiting for individual agenda item creation
      const rateLimitResult = checkRateLimit(`agenda-create-${session.user.id}`, 20, 60000)
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          },
          { status: 429 }
        )
      }
      
      // Single item creation
      const validatedData = createAgendaItemSchema.parse({
        ...body,
        meetingId: params.id,
      })

      // Check for duplicate codes within the meeting
      const existingItem = await prisma.agendaItem.findFirst({
        where: {
          meetingId: params.id,
          code: validatedData.code,
        },
      })

      if (existingItem) {
        return NextResponse.json(
          { error: `Agenda item with code "${validatedData.code}" already exists` },
          { status: 400 }
        )
      }

      const agendaItem = await prisma.agendaItem.create({
        data: {
          ...validatedData,
          cutoffTime: validatedData.cutoffTime ? new Date(validatedData.cutoffTime) : null,
        },
        include: {
          _count: {
            select: { commentItems: true },
          },
        },
      })

      return NextResponse.json({ agendaItem }, { status: 201 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating agenda item(s):', error)
    return NextResponse.json(
      { error: 'Failed to create agenda item(s)' },
      { status: 500 }
    )
  }
}