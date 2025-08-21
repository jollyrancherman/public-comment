import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  meetingId: z.string().optional(),
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
    })

    // Build where clause for filtering
    const whereClause = query.meetingId 
      ? { meetingId: query.meetingId, visibility: 'VISIBLE' as const }
      : { visibility: 'VISIBLE' as const }

    // Get stance counts
    const stanceCounts = await prisma.comment.groupBy({
      by: ['stance'],
      where: whereClause,
      _count: {
        stance: true,
      },
    })

    const stanceData = {
      FOR: 0,
      AGAINST: 0,
      CONCERNED: 0,
      NEUTRAL: 0,
    }

    stanceCounts.forEach((group) => {
      stanceData[group.stance] = group._count.stance
    })

    // Get quality metrics
    const comments = await prisma.comment.findMany({
      where: whereClause,
      select: {
        publicBody: true,
        riskFlags: true,
        createdAt: true,
      },
    })

    const totalComments = comments.length
    const averageLength = totalComments > 0 
      ? comments.reduce((sum, comment) => sum + comment.publicBody.split(' ').length, 0) / totalComments
      : 0

    // Calculate civility score (simple implementation - can be enhanced)
    const civilityScore = totalComments > 0
      ? comments.reduce((sum, comment) => {
          const riskFlags = comment.riskFlags as Record<string, unknown> | null
          const hasRiskFlags = riskFlags && Object.keys(riskFlags).length > 0
          return sum + (hasRiskFlags ? 0.3 : 1)
        }, 0) / totalComments
      : 1

    // Calculate uniqueness score (simple duplicate detection)
    const uniqueBodies = new Set(comments.map(c => c.publicBody.toLowerCase().trim()))
    const uniquenessScore = totalComments > 0 ? uniqueBodies.size / totalComments : 1

    const qualityMetrics = {
      averageLength,
      civilityScore,
      uniquenessScore,
      totalComments,
    }

    // Get activity data (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Removed unused activityData variable

    // Get daily activity breakdown
    const dailyActivity = await prisma.$queryRaw<Array<{
      date: string
      stance: string
      count: bigint
    }>>`
      SELECT 
        DATE(created_at) as date,
        stance,
        COUNT(*) as count
      FROM "Comment"
      WHERE visibility = 'VISIBLE'
        AND created_at >= ${thirtyDaysAgo}
        ${query.meetingId ? prisma.$queryRaw`AND meeting_id = ${query.meetingId}` : prisma.$queryRaw``}
      GROUP BY DATE(created_at), stance
      ORDER BY date ASC, stance ASC
    `

    const formattedActivityData = dailyActivity.map(item => ({
      date: item.date,
      stance: item.stance,
      count: Number(item.count),
    }))

    // Get meetings for the selector
    const meetings = await prisma.meeting.findMany({
      orderBy: {
        startTime: 'desc',
      },
      take: 20, // Limit to recent meetings
    })

    return NextResponse.json({
      stanceCounts: stanceData,
      qualityMetrics,
      activityData: formattedActivityData,
      meetings,
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}