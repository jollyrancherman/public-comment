import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const voteSchema = z.object({
  recommendationId: z.string(),
  value: z.number().int().min(-1).max(1), // -1 (downvote), 0 (remove), 1 (upvote)
})

// Hot score calculation: upvotes with time decay
function calculateHotScore(upvotes: number, downvotes: number, createdAt: Date): number {
  const score = upvotes - downvotes
  const hoursAge = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
  return score / Math.pow(hoursAge + 2, 1.8)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = voteSchema.parse(body)

    // Check if recommendation exists
    const recommendation = await prisma.recommendation.findUnique({
      where: { 
        id: data.recommendationId,
        status: 'PUBLISHED'
      },
    })

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    // Handle vote logic
    if (data.value === 0) {
      // Remove existing vote
      await prisma.vote.deleteMany({
        where: {
          recommendationId: data.recommendationId,
          userId: session.user.id,
        },
      })
    } else {
      // Upsert vote (create or update)
      await prisma.vote.upsert({
        where: {
          recommendationId_userId: {
            recommendationId: data.recommendationId,
            userId: session.user.id,
          },
        },
        update: {
          value: data.value,
        },
        create: {
          recommendationId: data.recommendationId,
          userId: session.user.id,
          value: data.value,
        },
      })
    }

    // Calculate new vote totals
    const voteStats = await prisma.vote.groupBy({
      by: ['value'],
      where: {
        recommendationId: data.recommendationId,
      },
      _count: {
        value: true,
      },
    })

    const upvotes = voteStats.find(v => v.value === 1)?._count.value || 0
    const downvotes = voteStats.find(v => v.value === -1)?._count.value || 0

    // Update recommendation's cached vote counts and hot score
    const newHotScore = calculateHotScore(upvotes, downvotes, recommendation.publishedAt!)
    
    await prisma.recommendation.update({
      where: { id: data.recommendationId },
      data: {
        upvotes,
        downvotes,
        hotScore: newHotScore,
      },
    })

    return NextResponse.json({
      upvotes,
      downvotes,
      userVote: data.value,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Vote error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}