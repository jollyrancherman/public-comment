import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { getModerationQueue, getModerationStats } from '@/lib/moderation/queue'
import { Role } from '@prisma/client'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only moderators and admins can access moderation queue
    if (![Role.MODERATOR, Role.ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const priority = searchParams.get('priority') as 'high' | 'medium' | 'low' | undefined
    const includeStats = searchParams.get('includeStats') === 'true'

    const queue = await getModerationQueue({
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      priority,
    })

    const response: any = { queue }

    if (includeStats) {
      const stats = await getModerationStats()
      response.stats = stats
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching moderation queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    )
  }
}