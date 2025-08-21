import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all unique tags from published recommendations
    const recommendations = await prisma.recommendation.findMany({
      where: {
        status: 'PUBLISHED',
      },
      select: {
        tags: true,
      },
    })

    // Flatten and count tag usage
    const tagCounts = new Map<string, number>()
    
    recommendations.forEach(rec => {
      rec.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    // Sort tags by usage count, then alphabetically
    const sortedTags = Array.from(tagCounts.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) {
          return b[1] - a[1] // Sort by count descending
        }
        return a[0].localeCompare(b[0]) // Then alphabetically
      })
      .map(([tag]) => tag)

    return NextResponse.json({
      tags: sortedTags,
    })

  } catch (error) {
    console.error('Tags API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}