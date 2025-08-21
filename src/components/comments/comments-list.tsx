'use client'

import { useState, useEffect } from 'react'
import { CommentStance, CommentVisibility } from '@prisma/client'
import { useSession } from 'next-auth/react'

type Comment = {
  id: string
  publicBody: string
  stance: CommentStance
  visibility: CommentVisibility
  submittedAt: string
  withdrawnAt?: string | null
  user: {
    name?: string | null
    zipCode?: string | null
    district?: string | null
  }
  agendaItems: Array<{
    agendaItem: {
      id: string
      code: string
      title: string
    }
  }>
}

interface CommentsListProps {
  meetingId?: string
  agendaItemId?: string
  showControls?: boolean
}

export default function CommentsList({ meetingId, agendaItemId, showControls = false }: CommentsListProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{
    stance?: CommentStance
    visibility?: CommentVisibility
  }>({})

  useEffect(() => {
    fetchComments()
  }, [meetingId, agendaItemId, filter])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (meetingId) params.append('meetingId', meetingId)
      if (agendaItemId) params.append('agendaItemId', agendaItemId)
      if (filter.stance) params.append('stance', filter.stance)
      if (filter.visibility) params.append('visibility', filter.visibility)
      
      const response = await fetch(`/api/comments?${params}`)
      const data = await response.json()
      
      setComments(data.comments || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to withdraw this comment?')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchComments()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to withdraw comment')
      }
    } catch (error) {
      console.error('Error withdrawing comment:', error)
      alert('Failed to withdraw comment')
    }
  }

  const getStanceBadge = (stance: CommentStance) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    
    switch (stance) {
      case CommentStance.FOR:
        return `${baseClasses} bg-green-100 text-green-800`
      case CommentStance.AGAINST:
        return `${baseClasses} bg-red-100 text-red-800`
      case CommentStance.CONCERNED:
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case CommentStance.NEUTRAL:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getVisibilityBadge = (visibility: CommentVisibility) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    
    switch (visibility) {
      case CommentVisibility.VISIBLE:
        return `${baseClasses} bg-green-100 text-green-800`
      case CommentVisibility.PENDING_VISIBLE:
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case CommentVisibility.HIDDEN:
        return `${baseClasses} bg-red-100 text-red-800`
      case CommentVisibility.WITHDRAWN:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const canWithdraw = (comment: Comment) => {
    return session?.user.id && 
           comment.visibility !== CommentVisibility.WITHDRAWN &&
           comment.visibility !== CommentVisibility.HIDDEN
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      {showControls && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Filter Comments</h3>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stance</label>
              <select
                value={filter.stance || ''}
                onChange={(e) => setFilter(prev => ({ 
                  ...prev, 
                  stance: e.target.value as CommentStance || undefined 
                }))}
                className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Stances</option>
                <option value={CommentStance.FOR}>For</option>
                <option value={CommentStance.AGAINST}>Against</option>
                <option value={CommentStance.CONCERNED}>Concerned</option>
                <option value={CommentStance.NEUTRAL}>Neutral</option>
              </select>
            </div>
            
            {session?.user.role && ['STAFF', 'MODERATOR', 'COUNCIL_MEMBER', 'ADMIN'].includes(session.user.role) && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Visibility</label>
                <select
                  value={filter.visibility || ''}
                  onChange={(e) => setFilter(prev => ({ 
                    ...prev, 
                    visibility: e.target.value as CommentVisibility || undefined 
                  }))}
                  className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Comments</option>
                  <option value={CommentVisibility.VISIBLE}>Visible</option>
                  <option value={CommentVisibility.PENDING_VISIBLE}>Pending</option>
                  <option value={CommentVisibility.HIDDEN}>Hidden</option>
                  <option value={CommentVisibility.WITHDRAWN}>Withdrawn</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments */}
      {comments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Be the first to share your thoughts on this meeting.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white shadow rounded-lg p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className={getStanceBadge(comment.stance)}>
                    {comment.stance.toLowerCase().replace('_', ' ')}
                  </span>
                  
                  {showControls && (
                    <span className={getVisibilityBadge(comment.visibility)}>
                      {comment.visibility.toLowerCase().replace('_', ' ')}
                    </span>
                  )}
                  
                  <span className="text-sm text-gray-500">
                    {formatDate(comment.submittedAt)}
                  </span>
                  
                  {comment.withdrawnAt && (
                    <span className="text-sm text-red-600">
                      Withdrawn {formatDate(comment.withdrawnAt)}
                    </span>
                  )}
                </div>
                
                {canWithdraw(comment) && (
                  <button
                    onClick={() => handleWithdrawComment(comment.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Withdraw
                  </button>
                )}
              </div>

              {/* Comment Body */}
              <div className="mb-4">
                <p className="text-gray-900 whitespace-pre-wrap">{comment.publicBody}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>
                    By {comment.user.name || 'Anonymous'}
                    {comment.user.district && ` (${comment.user.district})`}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {comment.agendaItems.map((item) => (
                    <span
                      key={item.agendaItem.id}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {item.agendaItem.code}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}