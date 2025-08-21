import { prisma } from '@/lib/prisma'
import { moderateComment, ModerationResult } from './service'
import { CommentVisibility, ModerationAction, Role } from '@prisma/client'

export interface ModerationQueueItem {
  commentId: string
  priority: 'high' | 'medium' | 'low'
  moderationResult: ModerationResult
  createdAt: Date
}

// Process a newly submitted comment through moderation
export async function processCommentModeration(commentId: string): Promise<ModerationResult> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      meeting: true,
    },
  })

  if (!comment) {
    throw new Error('Comment not found')
  }

  // Run moderation
  const moderationResult = await moderateComment(comment.rawBody)

  // Update comment with moderation results
  await prisma.comment.update({
    where: { id: commentId },
    data: {
      publicBody: moderationResult.publicBody,
      piiDetected: moderationResult.piiDetected,
      profanityDetected: moderationResult.profanityDetected,
      riskFlags: moderationResult.riskFlags,
      visibility: moderationResult.suggestedVisibility,
      moderationNotes: moderationResult.moderationNotes.join('\n'),
    },
  })

  // If flagged for review, create moderation log entry
  if (moderationResult.suggestedVisibility !== CommentVisibility.VISIBLE) {
    await prisma.moderationLog.create({
      data: {
        commentId,
        moderatorId: 'system', // System-generated moderation
        action: ModerationAction.FLAG,
        reason: `Automated moderation: ${moderationResult.moderationNotes.join(', ')}`,
        metadata: moderationResult,
      },
    })
  }

  return moderationResult
}

// Get comments pending moderation
export async function getModerationQueue(options?: {
  limit?: number
  offset?: number
  priority?: 'high' | 'medium' | 'low'
}) {
  const comments = await prisma.comment.findMany({
    where: {
      OR: [
        { visibility: CommentVisibility.PENDING_VISIBLE },
        { visibility: CommentVisibility.HIDDEN },
      ],
      withdrawnAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      meeting: {
        select: {
          id: true,
          title: true,
          startTime: true,
        },
      },
      agendaItems: {
        include: {
          agendaItem: {
            select: {
              code: true,
              title: true,
            },
          },
        },
      },
      moderationLogs: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          moderator: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [
      { createdAt: 'desc' },
    ],
    take: options?.limit || 20,
    skip: options?.offset || 0,
  })

  // Calculate priority for each comment
  const queueItems = comments.map(comment => {
    const riskScore = (comment.riskFlags as any)?.score || 0
    let priority: 'high' | 'medium' | 'low' = 'low'

    if (riskScore > 0.7 || comment.visibility === CommentVisibility.HIDDEN) {
      priority = 'high'
    } else if (riskScore > 0.4 || comment.profanityDetected) {
      priority = 'medium'
    }

    return {
      ...comment,
      priority,
      riskScore,
    }
  })

  // Filter by priority if specified
  if (options?.priority) {
    return queueItems.filter(item => item.priority === options.priority)
  }

  // Sort by priority (high first)
  return queueItems.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

// Approve a comment
export async function approveComment(
  commentId: string,
  moderatorId: string,
  notes?: string
) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  })

  if (!comment) {
    throw new Error('Comment not found')
  }

  // Update comment visibility
  await prisma.comment.update({
    where: { id: commentId },
    data: {
      visibility: CommentVisibility.VISIBLE,
      visibleAt: new Date(),
      moderationNotes: notes || comment.moderationNotes,
    },
  })

  // Create moderation log
  await prisma.moderationLog.create({
    data: {
      commentId,
      moderatorId,
      action: ModerationAction.RESTORE,
      reason: notes || 'Comment approved after review',
    },
  })

  return { success: true }
}

// Reject/hide a comment
export async function rejectComment(
  commentId: string,
  moderatorId: string,
  reason: string
) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  })

  if (!comment) {
    throw new Error('Comment not found')
  }

  // Update comment visibility
  await prisma.comment.update({
    where: { id: commentId },
    data: {
      visibility: CommentVisibility.HIDDEN,
      moderationNotes: reason,
    },
  })

  // Create moderation log
  await prisma.moderationLog.create({
    data: {
      commentId,
      moderatorId,
      action: ModerationAction.HIDE,
      reason,
    },
  })

  return { success: true }
}

// Bulk moderation actions
export async function bulkModerateComments(
  commentIds: string[],
  moderatorId: string,
  action: 'approve' | 'reject',
  reason?: string
) {
  const results = await Promise.allSettled(
    commentIds.map(async (commentId) => {
      if (action === 'approve') {
        return approveComment(commentId, moderatorId, reason)
      } else {
        return rejectComment(commentId, moderatorId, reason || 'Bulk rejection')
      }
    })
  )

  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return {
    successful,
    failed,
    total: commentIds.length,
  }
}

// Get moderation statistics
export async function getModerationStats() {
  const [total, pending, hidden, visible] = await Promise.all([
    prisma.comment.count(),
    prisma.comment.count({
      where: { visibility: CommentVisibility.PENDING_VISIBLE },
    }),
    prisma.comment.count({
      where: { visibility: CommentVisibility.HIDDEN },
    }),
    prisma.comment.count({
      where: { visibility: CommentVisibility.VISIBLE },
    }),
  ])

  const recentActions = await prisma.moderationLog.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  })

  return {
    total,
    pending,
    hidden,
    visible,
    recentActions,
    percentModerated: total > 0 ? ((hidden + pending) / total * 100).toFixed(1) : '0',
  }
}