import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  meetingId: z.string().optional(),
  format: z.enum(['csv', 'json']),
})

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'COUNCIL_MEMBER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      meetingId: searchParams.get('meetingId') || undefined,
      format: searchParams.get('format') as 'csv' | 'json',
    })

    // Build where clause for filtering
    const whereClause = query.meetingId 
      ? { meetingId: query.meetingId, visibility: 'VISIBLE' as const }
      : { visibility: 'VISIBLE' as const }

    // Get comments with related data
    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            district: true,
            zipCode: true,
          },
        },
        meeting: {
          select: {
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
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    if (query.format === 'json') {
      // Return JSON format
      const jsonData = {
        exportDate: new Date().toISOString(),
        meetingFilter: query.meetingId || 'all',
        totalComments: comments.length,
        comments: comments.map(comment => ({
          id: comment.id,
          submittedAt: comment.submittedAt,
          stance: comment.stance,
          body: comment.publicBody,
          meeting: {
            title: comment.meeting.title,
            startTime: comment.meeting.startTime,
          },
          agendaItems: comment.agendaItems.map(item => ({
            code: item.agendaItem.code,
            title: item.agendaItem.title,
          })),
          author: {
            email: comment.user.email.split('@')[0] + '@***', // Partially redact email
            district: comment.user.district,
            zipCode: comment.user.zipCode,
          },
          location: comment.roundedLatitude && comment.roundedLongitude ? {
            latitude: comment.roundedLatitude,
            longitude: comment.roundedLongitude,
          } : null,
          metadata: {
            piiDetected: comment.piiDetected,
            profanityDetected: comment.profanityDetected,
            riskFlags: comment.riskFlags,
          },
        })),
      }

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="comments-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }

    // Return CSV format
    const csvHeader = [
      'ID',
      'Submitted Date',
      'Meeting',
      'Meeting Date',
      'Agenda Items',
      'Stance',
      'Comment Body',
      'Author Email',
      'District',
      'ZIP Code',
      'Location (Lat)',
      'Location (Lng)',
      'PII Detected',
      'Profanity Detected',
      'Risk Flags',
    ].join(',')

    const csvRows = comments.map(comment => {
      const agendaItemsText = comment.agendaItems
        .map(item => `${item.agendaItem.code}: ${item.agendaItem.title}`)
        .join('; ')
      
      const riskFlagsText = comment.riskFlags 
        ? Object.keys(comment.riskFlags as object).join('; ')
        : ''

      return [
        comment.id,
        comment.submittedAt.toISOString(),
        `"${comment.meeting.title}"`,
        comment.meeting.startTime.toISOString(),
        `"${agendaItemsText}"`,
        comment.stance,
        `"${comment.publicBody.replace(/"/g, '""')}"`, // Escape quotes in CSV
        comment.user.email.split('@')[0] + '@***', // Partially redact email
        comment.user.district || '',
        comment.user.zipCode || '',
        comment.roundedLatitude || '',
        comment.roundedLongitude || '',
        comment.piiDetected,
        comment.profanityDetected,
        `"${riskFlagsText}"`,
      ].join(',')
    })

    const csvContent = [csvHeader, ...csvRows].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="comments-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })

  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}