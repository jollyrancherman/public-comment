import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const commentSchema = z.object({
  recommendationId: z.string().optional(),
  parentId: z.string().optional(),
  body: z.string().min(1).max(2000),
}).refine(data => data.recommendationId || data.parentId, {
  message: "Either recommendationId or parentId must be provided"
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = commentSchema.parse(body)

    let recommendationId: string

    if (data.parentId) {
      // This is a reply to an existing comment
      const parentComment = await prisma.recommendationComment.findUnique({
        where: { 
          id: data.parentId,
          isHidden: false
        },
        select: {
          recommendationId: true,
        },
      })

      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }

      recommendationId = parentComment.recommendationId
    } else {
      // This is a top-level comment
      recommendationId = data.recommendationId!
    }

    // Check if recommendation exists and is published
    const recommendation = await prisma.recommendation.findUnique({
      where: { 
        id: recommendationId,
        status: 'PUBLISHED'
      },
    })

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    // Rate limiting: Max 10 comments per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentComments = await prisma.recommendationComment.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    })

    if (recentComments >= 10) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before posting again.' },
        { status: 429 }
      )
    }

    // Create comment
    const comment = await prisma.recommendationComment.create({
      data: {
        recommendationId,
        parentId: data.parentId || null,
        userId: session.user.id,
        body: data.body,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        replies: {
          where: {
            isHidden: false,
          },
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    return NextResponse.json({
      comment,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Comment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}