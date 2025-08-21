import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { updateCommentSchema, commentVisibilitySchema } from '@/lib/validations/comment'
import { Role, CommentVisibility, MeetingStatus } from '@prisma/client'
import { z } from 'zod'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
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

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const canViewAll = session?.user.role && [Role.STAFF, Role.MODERATOR, Role.COUNCIL_MEMBER, Role.ADMIN].includes(session.user.role)
    const isOwner = session?.user.id === comment.userId
    const isVisible = comment.visibility === CommentVisibility.VISIBLE

    if (!canViewAll && !isOwner && !isVisible) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Filter sensitive data based on permissions
    const sanitizedComment = {
      ...comment,
      rawBody: canViewAll ? comment.rawBody : undefined,
      latitude: canViewAll || isOwner ? comment.latitude : undefined,
      longitude: canViewAll || isOwner ? comment.longitude : undefined,
      user: {
        ...comment.user,
        id: canViewAll || isOwner ? comment.user.id : undefined,
      },
    }

    return NextResponse.json({ comment: sanitizedComment })
  } catch (error) {
    console.error('Error fetching comment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
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

    const body = await req.json()
    
    // Check if this is a visibility update (moderator action)
    if ('visibility' in body) {
      if (![Role.MODERATOR, Role.ADMIN].includes(session.user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      const validatedData = commentVisibilitySchema.parse({ ...body, id: params.id })
      
      const comment = await prisma.comment.update({
        where: { id: params.id },
        data: {
          visibility: validatedData.visibility,
          moderationNotes: validatedData.moderatorNotes,
          visibleAt: validatedData.visibility === CommentVisibility.VISIBLE ? new Date() : null,
        },
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

      return NextResponse.json({ comment })
    }

    // Regular comment update (by owner)
    const validatedData = updateCommentSchema.parse({ ...body, id: params.id })
    
    const existingComment = await prisma.comment.findUnique({
      where: { id: params.id },
      include: {
        meeting: true,
        agendaItems: {
          include: {
            agendaItem: true,
          },
        },
      },
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (existingComment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if comment can still be edited
    if (existingComment.visibility === CommentVisibility.WITHDRAWN) {
      return NextResponse.json(
        { error: 'Cannot edit withdrawn comment' },
        { status: 400 }
      )
    }

    // Check if meeting is still accepting edits
    if (existingComment.meeting.status === MeetingStatus.ENDED) {
      return NextResponse.json(
        { error: 'Cannot edit comments after meeting has ended' },
        { status: 400 }
      )
    }

    // Check agenda item cutoffs if updating agenda items
    if (validatedData.agendaItemIds) {
      const newAgendaItems = await prisma.agendaItem.findMany({
        where: {
          id: {
            in: validatedData.agendaItemIds,
          },
          meetingId: existingComment.meetingId,
        },
      })

      if (newAgendaItems.length !== validatedData.agendaItemIds.length) {
        return NextResponse.json(
          { error: 'Some agenda items not found' },
          { status: 400 }
        )
      }

      const now = new Date()
      const closedItems = newAgendaItems.filter(item => 
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
    }

    // Update comment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the comment
      const updateData: any = {}
      if (validatedData.body) {
        updateData.rawBody = validatedData.body
        updateData.publicBody = validatedData.body // Will be reprocessed by moderation
      }
      if (validatedData.stance) {
        updateData.stance = validatedData.stance
      }

      const comment = await tx.comment.update({
        where: { id: params.id },
        data: updateData,
      })

      // Update agenda item relationships if provided
      if (validatedData.agendaItemIds) {
        // Delete existing relationships
        await tx.commentOnItem.deleteMany({
          where: { commentId: params.id },
        })

        // Create new relationships
        await tx.commentOnItem.createMany({
          data: validatedData.agendaItemIds.map(agendaItemId => ({
            commentId: params.id,
            agendaItemId,
          })),
        })
      }

      return comment
    })

    // Fetch updated comment with relationships
    const updatedComment = await prisma.comment.findUnique({
      where: { id: params.id },
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

    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
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

    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
      include: {
        meeting: true,
        agendaItems: {
          include: {
            agendaItem: true,
          },
        },
      },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const isOwner = comment.userId === session.user.id
    const canDelete = [Role.MODERATOR, Role.ADMIN].includes(session.user.role)

    if (!isOwner && !canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // For user deletion, check if withdrawal is allowed
    if (isOwner) {
      if (comment.meeting.status === MeetingStatus.ENDED) {
        return NextResponse.json(
          { error: 'Cannot withdraw comment after meeting has ended' },
          { status: 400 }
        )
      }

      // Check agenda item cutoffs
      const now = new Date()
      const activeItems = comment.agendaItems.filter(item => 
        !item.agendaItem.cutoffTime || now <= item.agendaItem.cutoffTime
      )

      if (activeItems.length === 0) {
        return NextResponse.json(
          { error: 'Cannot withdraw comment - all agenda items have passed their cutoff time' },
          { status: 400 }
        )
      }
    }

    if (canDelete) {
      // Hard delete for moderators/admins
      await prisma.comment.delete({
        where: { id: params.id },
      })
    } else {
      // Soft delete (withdrawal) for users
      await prisma.comment.update({
        where: { id: params.id },
        data: {
          visibility: CommentVisibility.WITHDRAWN,
          withdrawnAt: new Date(),
        },
      })
    }

    return NextResponse.json({ 
      message: canDelete ? 'Comment deleted successfully' : 'Comment withdrawn successfully' 
    })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}