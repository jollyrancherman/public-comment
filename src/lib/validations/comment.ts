import { z } from 'zod'
import { CommentStance, CommentVisibility } from '@prisma/client'
import { sanitizeText, sanitizeHtml } from '@/lib/security/sanitization'

export const createCommentSchema = z.object({
  meetingId: z.string().cuid('Invalid meeting ID'),
  agendaItemIds: z.array(z.string().cuid('Invalid agenda item ID'))
    .min(1, 'Must select at least one agenda item')
    .max(10, 'Cannot comment on more than 10 agenda items at once'),
  body: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(2000, 'Comment must be less than 2000 characters')
    .transform(sanitizeHtml),
  stance: z.nativeEnum(CommentStance),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

export const updateCommentSchema = z.object({
  id: z.string().cuid('Invalid comment ID'),
  body: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(2000, 'Comment must be less than 2000 characters')
    .transform(sanitizeHtml)
    .optional(),
  stance: z.nativeEnum(CommentStance).optional(),
  agendaItemIds: z.array(z.string().cuid('Invalid agenda item ID'))
    .min(1, 'Must select at least one agenda item')
    .max(10, 'Cannot comment on more than 10 agenda items at once')
    .optional(),
})

export const withdrawCommentSchema = z.object({
  id: z.string().cuid('Invalid comment ID'),
  reason: z.string()
    .max(500, 'Withdrawal reason must be less than 500 characters')
    .transform(sanitizeText)
    .optional(),
})

export const commentVisibilitySchema = z.object({
  id: z.string().cuid('Invalid comment ID'),
  visibility: z.nativeEnum(CommentVisibility),
  moderatorNotes: z.string()
    .max(1000, 'Moderator notes must be less than 1000 characters')
    .transform(sanitizeText)
    .optional(),
})

export const commentQuerySchema = z.object({
  meetingId: z.string().cuid('Invalid meeting ID').optional(),
  agendaItemId: z.string().cuid('Invalid agenda item ID').optional(),
  stance: z.nativeEnum(CommentStance).optional(),
  visibility: z.nativeEnum(CommentVisibility).optional(),
  userId: z.string().cuid('Invalid user ID').optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['submittedAt', 'updatedAt']).default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})