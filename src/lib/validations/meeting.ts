import { z } from 'zod'
import { MeetingStatus } from '@prisma/client'
import { sanitizeText, sanitizeHtml } from '@/lib/security/sanitization'

export const createMeetingSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform(sanitizeText),
  description: z.string()
    .optional()
    .transform(val => val ? sanitizeHtml(val) : val),
  body: z.string().default('COUNCIL').transform(sanitizeText),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  location: z.string()
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  videoUrl: z.string().url('Invalid video URL').optional().or(z.literal('')),
})

export const updateMeetingSchema = createMeetingSchema.partial().extend({
  id: z.string().cuid('Invalid meeting ID'),
  status: z.nativeEnum(MeetingStatus).optional(),
})

export const agendaItemSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .max(10, 'Code must be less than 10 characters')
    .regex(/^[A-Za-z0-9-_.]+$/, 'Code can only contain letters, numbers, hyphens, underscores, and periods')
    .transform(sanitizeText),
  title: z.string()
    .min(1, 'Title is required')
    .max(300, 'Title must be less than 300 characters')
    .transform(sanitizeText),
  description: z.string()
    .optional()
    .transform(val => val ? sanitizeHtml(val) : val),
  orderIndex: z.number().int().min(0, 'Order index must be non-negative').max(1000, 'Order index too large'),
  cutoffTime: z.string().datetime('Invalid cutoff time').optional(),
  supportingDocs: z.object({
    files: z.array(z.object({
      name: z.string().max(255, 'File name too long').transform(sanitizeText),
      url: z.string().url('Invalid file URL'),
    })).max(10, 'Too many supporting documents').optional(),
  }).optional(),
})

export const createAgendaItemSchema = agendaItemSchema.extend({
  meetingId: z.string().cuid('Invalid meeting ID'),
})

export const updateAgendaItemSchema = agendaItemSchema.partial().extend({
  id: z.string().cuid('Invalid agenda item ID'),
})

export const bulkAgendaImportSchema = z.object({
  meetingId: z.string().cuid('Invalid meeting ID'),
  items: z.array(agendaItemSchema),
})