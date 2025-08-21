'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SortOption } from './recommendations-forum'
import VoteButtons from './vote-buttons'

interface Recommendation {
  id: string
  title: string
  body: string
  tags: string[]
  upvotes: number
  downvotes: number
  hotScore: number
  publishedAt: string
  user: {
    email: string
    name: string | null
  }
  _count: {
    comments: number
    votes: number
  }
  userVote?: number
}

interface RecommendationsListProps {
  sortBy: SortOption
  selectedTag: string
}

export default function RecommendationsList({ sortBy, selectedTag }: RecommendationsListProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams()
        params.set('sort', sortBy)
        if (selectedTag) {
          params.set('tag', selectedTag)
        }
        
        const response = await fetch(`/api/recommendations?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations')
        }
        
        const data = await response.json()
        setRecommendations(data.recommendations)
      } catch (err) {
        console.error('Error fetching recommendations:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [sortBy, selectedTag])

  const handleVoteUpdate = (recommendationId: string, newVote: number, upvotes: number, downvotes: number) => {
    setRecommendations(prev =>
      prev.map(rec =>
        rec.id === recommendationId
          ? { ...rec, userVote: newVote, upvotes, downvotes }
          : rec
      )
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">Error loading recommendations: {error}</p>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations</h3>
        <p className="mt-1 text-sm text-gray-500">
          {selectedTag ? `No recommendations found for tag "${selectedTag}".` : 'Be the first to create a recommendation.'}
        </p>
        <div className="mt-6">
          <Link
            href="/recommendations/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create Recommendation
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {recommendations.map((recommendation) => (
        <div key={recommendation.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start space-x-4">
            {/* Vote Buttons */}
            <VoteButtons
              recommendationId={recommendation.id}
              upvotes={recommendation.upvotes}
              downvotes={recommendation.downvotes}
              userVote={recommendation.userVote || 0}
              onVoteUpdate={handleVoteUpdate}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <Link
                  href={`/recommendations/${recommendation.id}`}
                  className="text-lg font-medium text-gray-900 hover:text-indigo-600"
                >
                  {recommendation.title}
                </Link>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{recommendation._count.comments} comments</span>
                  <span>
                    {new Date(recommendation.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-gray-600 line-clamp-3">
                {recommendation.body.length > 200
                  ? recommendation.body.substring(0, 200) + '...'
                  : recommendation.body}
              </p>

              {/* Tags */}
              {recommendation.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {recommendation.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Author */}
              <div className="mt-3 text-sm text-gray-500">
                Posted by {recommendation.user.name || recommendation.user.email.split('@')[0]}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}