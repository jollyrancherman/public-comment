import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { createCommentSchema, commentQuerySchema } from '@/lib/validations/comment'
import { checkCommentRateLimit } from '@/lib/rate-limit'
import { checkRateLimit } from '@/lib/security/sanitization'
import { processCommentModeration } from '@/lib/moderation/queue'
import { Role, CommentVisibility, MeetingStatus } from '@prisma/client'
import { z } from 'zod'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = commentQuerySchema.parse(Object.fromEntries(searchParams))
    
    // Build where clause
    const whereClause: any = {}
    
    if (query.meetingId) whereClause.meetingId = query.meetingId
    if (query.stance) whereClause.stance = query.stance
    if (query.userId) whereClause.userId = query.userId
    
    // For public access, only show visible comments
    const session = await getServerSession(authOptions)
    const canViewAll = session?.user.role && [Role.STAFF, Role.MODERATOR, Role.COUNCIL_MEMBER, Role.ADMIN].includes(session.user.role)
    
    if (!canViewAll) {
      whereClause.visibility = CommentVisibility.VISIBLE
    } else if (query.visibility) {
      whereClause.visibility = query.visibility
    }

    // Handle agenda item filtering
    if (query.agendaItemId) {
      whereClause.agendaItems = {
        some: {
          agendaItemId: query.agendaItemId
        }
      }
    }

    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            zipCode: true,
            district: true,
          },
        },
        meeting: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        agendaItems: {
          include: {
            agendaItem: {
              select: {
                id: true,
                code: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      take: query.limit,
      skip: query.offset,
    })

    // Filter out raw body for non-staff users
    const sanitizedComments = comments.map(comment => ({
      ...comment,
      // Only show rawBody to staff/moderators
      rawBody: canViewAll ? comment.rawBody : undefined,
    }))

    return NextResponse.json({ comments: sanitizedComments })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
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

    // Rate limiting - residents can submit limited comments per day
    const rateLimitResult = checkRateLimit(`comment-create-${session.user.id}`, 10, 24 * 60 * 60 * 1000)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Daily comment limit exceeded. Please try again tomorrow.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    const validatedData = createCommentSchema.parse(body)

    // Verify meeting exists and is accepting comments
    const meeting = await prisma.meeting.findUnique({
      where: { id: validatedData.meetingId },
      include: {
        agendaItems: {
          where: {
            id: {
              in: validatedData.agendaItemIds,
            },
          },
        },
      },
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // Check if all agenda items exist
    if (meeting.agendaItems.length !== validatedData.agendaItemIds.length) {
      return NextResponse.json(
        { error: 'Some agenda items not found' },
        { status: 400 }
      )
    }

    // Check if commenting is still allowed for each agenda item
    const now = new Date()
    const closedItems = meeting.agendaItems.filter(item => 
      item.cutoffTime && now > item.cutoffTime
    )

    if (closedItems.length > 0) {
      return NextResponse.json(
        { 
          error: `Comments are closed for agenda items: ${closedItems.map(item => item.code).join(', ')}`,
          closedItems: closedItems.map(item => ({ id: item.id, code: item.code }))
        },
        { status: 400 }
      )
    }

    // Determine initial visibility based on meeting status
    let initialVisibility = CommentVisibility.PENDING_VISIBLE
    if (meeting.status === MeetingStatus.ACTIVE) {
      initialVisibility = CommentVisibility.VISIBLE
    } else if (meeting.status === MeetingStatus.ENDED) {
      // Comments submitted after meeting ends go to next meeting (for now, just make them pending)
      initialVisibility = CommentVisibility.PENDING_VISIBLE
    }

    // Process location data (round for privacy)
    let roundedLatitude: number | undefined
    let roundedLongitude: number | undefined
    
    if (validatedData.latitude && validatedData.longitude) {
      // Round to ~1km precision for privacy
      roundedLatitude = Math.round(validatedData.latitude * 100) / 100
      roundedLongitude = Math.round(validatedData.longitude * 100) / 100
    }

    // Create comment and agenda item relationships in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the comment
      const comment = await tx.comment.create({
        data: {
          userId: session.user.id,
          meetingId: validatedData.meetingId,
          rawBody: validatedData.body,
          publicBody: validatedData.body, // Will be processed by moderation in Phase 4
          stance: validatedData.stance,
          visibility: initialVisibility,
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
          roundedLatitude,
          roundedLongitude,
          visibleAt: initialVisibility === CommentVisibility.VISIBLE ? now : null,
        },
      })

      // Create relationships to agenda items
      await tx.commentOnItem.createMany({
        data: validatedData.agendaItemIds.map(agendaItemId => ({
          commentId: comment.id,
          agendaItemId,
        })),
      })

      return comment
    })

    // Process comment through moderation pipeline
    try {
      await processCommentModeration(result.id)
    } catch (moderationError) {
      console.error('Moderation processing error:', moderationError)
      // Continue even if moderation fails - comment is already saved
    }

    // Fetch the complete comment with relationships and moderation results
    const completeComment = await prisma.comment.findUnique({
      where: { id: result.id },
      include: {
        user: {
          select: {
            name: true,
            zipCode: true,
            district: true,
          },
        },
        meeting: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        agendaItems: {
          include: {
            agendaItem: {
              select: {
                id: true,
                code: true,
                title: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ comment: completeComment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}