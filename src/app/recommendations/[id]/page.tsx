import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/navbar'
import RecommendationDetail from '@/components/recommendations/recommendation-detail'

interface RecommendationPageProps {
  params: {
    id: string
  }
}

export default async function RecommendationPage({ params }: RecommendationPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  const recommendation = await prisma.recommendation.findUnique({
    where: { 
      id: params.id,
      status: 'PUBLISHED'
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
      comments: {
        where: {
          isHidden: false,
          parentId: null, // Only top-level comments
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
        orderBy: {
          createdAt: 'desc',
        },
      },
      votes: {
        where: {
          userId: session.user.id,
        },
      },
      _count: {
        select: {
          votes: true,
          comments: true,
        },
      },
    },
  })

  if (!recommendation) {
    notFound()
  }

  // Calculate vote totals
  const voteStats = await prisma.vote.groupBy({
    by: ['value'],
    where: {
      recommendationId: recommendation.id,
    },
    _count: {
      value: true,
    },
  })

  const upvotes = voteStats.find(v => v.value === 1)?._count.value || 0
  const downvotes = voteStats.find(v => v.value === -1)?._count.value || 0

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RecommendationDetail
            recommendation={recommendation}
            upvotes={upvotes}
            downvotes={downvotes}
            userVote={recommendation.votes[0]?.value || 0}
            currentUserId={session.user.id}
          />
        </div>
      </div>
    </>
  )
}