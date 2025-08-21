import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(10).max(5000),
  tags: z.array(z.string().max(30)).max(5),
})

const querySchema = z.object({
  sort: z.enum(['hot', 'new', 'top']).default('hot'),
  tag: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
})

// Hot score calculation: upvotes with time decay
function calculateHotScore(upvotes: number, downvotes: number, createdAt: Date): number {
  const score = upvotes - downvotes
  const hoursAge = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
  return score / Math.pow(hoursAge + 2, 1.8)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      sort: searchParams.get('sort') || 'hot',
      tag: searchParams.get('tag') || undefined,
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0',
    })

    // Build where clause
    const whereClause: Record<string, unknown> = {
      status: 'PUBLISHED',
    }

    if (query.tag) {
      whereClause.tags = {
        has: query.tag,
      }
    }

    // Build order clause based on sort
    let orderBy: Record<string, unknown> | Record<string, unknown>[]
    switch (query.sort) {
      case 'new':
        orderBy = { publishedAt: 'desc' }
        break
      case 'top':
        orderBy = [{ upvotes: 'desc' }, { downvotes: 'asc' }]
        break
      case 'hot':
      default:
        orderBy = { hotScore: 'desc' }
        break
    }

    const recommendations = await prisma.recommendation.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        votes: {
          where: {
            userId: session.user.id,
          },
          select: {
            value: true,
          },
        },
        _count: {
          select: {
            comments: {
              where: {
                isHidden: false,
              },
            },
            votes: true,
          },
        },
      },
      orderBy,
      take: query.limit,
      skip: query.offset,
    })

    // Add vote totals and user vote to each recommendation
    const recommendationsWithVotes = await Promise.all(
      recommendations.map(async (rec) => {
        const voteStats = await prisma.vote.groupBy({
          by: ['value'],
          where: {
            recommendationId: rec.id,
          },
          _count: {
            value: true,
          },
        })

        const upvotes = voteStats.find(v => v.value === 1)?._count.value || 0
        const downvotes = voteStats.find(v => v.value === -1)?._count.value || 0

        return {
          ...rec,
          upvotes,
          downvotes,
          userVote: rec.votes[0]?.value || 0,
          votes: undefined, // Remove the detailed votes array
        }
      })
    )

    return NextResponse.json({
      recommendations: recommendationsWithVotes,
      hasMore: recommendations.length === query.limit,
    })

  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    // Create recommendation
    const recommendation = await prisma.recommendation.create({
      data: {
        title: data.title,
        body: data.body,
        tags: data.tags,
        userId: session.user.id,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        hotScore: calculateHotScore(0, 0, new Date()),
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      recommendation,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create recommendation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}