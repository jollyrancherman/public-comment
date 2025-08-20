import { prisma } from '@/lib/prisma'

const OTP_RATE_LIMIT = 5 // Max OTP requests per hour
const COMMENT_RATE_LIMIT = 10 // Max comments per day
const RECOMMENDATION_RATE_LIMIT = 5 // Max recommendations per week

export async function checkOTPRateLimit(email: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  
  const recentAttempts = await prisma.emailOTP.count({
    where: {
      email,
      createdAt: {
        gte: oneHourAgo,
      },
    },
  })
  
  return recentAttempts < OTP_RATE_LIMIT
}

export async function checkCommentRateLimit(userId: string): Promise<boolean> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const recentComments = await prisma.comment.count({
    where: {
      userId,
      createdAt: {
        gte: oneDayAgo,
      },
    },
  })
  
  return recentComments < COMMENT_RATE_LIMIT
}

export async function checkRecommendationRateLimit(userId: string): Promise<boolean> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  const recentRecommendations = await prisma.recommendation.count({
    where: {
      userId,
      createdAt: {
        gte: oneWeekAgo,
      },
    },
  })
  
  return recentRecommendations < RECOMMENDATION_RATE_LIMIT
}