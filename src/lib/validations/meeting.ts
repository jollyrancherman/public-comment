import { z } from 'zod'
import { MeetingStatus } from '@prisma/client'

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  body: z.string().default('COUNCIL'),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  location: z.string().optional(),
  videoUrl: z.string().url('Invalid video URL').optional().or(z.literal('')),
})

export const updateMeetingSchema = createMeetingSchema.partial().extend({
  id: z.string().cuid('Invalid meeting ID'),
  status: z.nativeEnum(MeetingStatus).optional(),
})

export const agendaItemSchema = z.object({
  code: z.string().min(1, 'Code is required').max(10, 'Code must be less than 10 characters'),
  title: z.string().min(1, 'Title is required').max(300, 'Title must be less than 300 characters'),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0, 'Order index must be non-negative'),
  cutoffTime: z.string().datetime('Invalid cutoff time').optional(),
  supportingDocs: z.object({
    files: z.array(z.object({
      name: z.string(),
      url: z.string().url(),
    })).optional(),
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