import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { 
  approveComment, 
  rejectComment, 
  bulkModerateComments 
} from '@/lib/moderation/queue'
import { Role } from '@prisma/client'
import { z } from 'zod'

const moderationActionSchema = z.object({
  commentId: z.string().cuid('Invalid comment ID').optional(),
  commentIds: z.array(z.string().cuid('Invalid comment ID')).optional(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only moderators and admins can perform moderation actions
    if (![Role.MODERATOR, Role.ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = moderationActionSchema.parse(body)

    // Check if it's a bulk action or single action
    if (validatedData.commentIds && validatedData.commentIds.length > 0) {
      // Bulk moderation
      const result = await bulkModerateComments(
        validatedData.commentIds,
        session.user.id,
        validatedData.action,
        validatedData.reason
      )

      return NextResponse.json({
        message: `Bulk moderation completed`,
        ...result,
      })
    } else if (validatedData.commentId) {
      // Single comment moderation
      if (validatedData.action === 'approve') {
        await approveComment(
          validatedData.commentId,
          session.user.id,
          validatedData.notes
        )
        return NextResponse.json({ 
          message: 'Comment approved successfully',
          commentId: validatedData.commentId,
        })
      } else {
        await rejectComment(
          validatedData.commentId,
          session.user.id,
          validatedData.reason || 'Content violates community guidelines'
        )
        return NextResponse.json({ 
          message: 'Comment rejected successfully',
          commentId: validatedData.commentId,
        })
      }
    } else {
      return NextResponse.json(
        { error: 'Either commentId or commentIds must be provided' },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error performing moderation action:', error)
    return NextResponse.json(
      { error: 'Failed to perform moderation action' },
      { status: 500 }
    )
  }
}