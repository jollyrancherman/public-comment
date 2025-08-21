'use client'

import { useState, useEffect } from 'react'
import { CommentVisibility, CommentStance } from '@prisma/client'
import { getModerationSummary } from '@/lib/moderation/service'

interface QueueComment {
  id: string
  rawBody: string
  publicBody: string
  stance: CommentStance
  visibility: CommentVisibility
  piiDetected: boolean
  profanityDetected: boolean
  riskFlags: any
  moderationNotes?: string | null
  submittedAt: string
  priority: 'high' | 'medium' | 'low'
  riskScore: number
  user: {
    id: string
    email: string
    name?: string | null
  }
  meeting: {
    id: string
    title: string
    startTime: string
  }
  agendaItems: Array<{
    agendaItem: {
      code: string
      title: string
    }
  }>
  moderationLogs: Array<{
    id: string
    action: string
    reason?: string | null
    createdAt: string
    moderator: {
      name?: string | null
      email: string
    }
  }>
}

interface ModerationQueueProps {
  filter: 'all' | 'high' | 'medium' | 'low'
  selectedComments: string[]
  onSelectionChange: (ids: string[]) => void
  onActionComplete: () => void
}

export default function ModerationQueue({ 
  filter, 
  selectedComments, 
  onSelectionChange,
  onActionComplete 
}: ModerationQueueProps) {
  const [comments, setComments] = useState<QueueComment[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [filter])

  const fetchQueue = async () => {
    try {
      const params = filter !== 'all' ? `?priority=${filter}` : ''
      const response = await fetch(`/api/moderation/queue${params}`)
      const data = await response.json()
      setComments(data.queue || [])
    } catch (error) {
      console.error('Error fetching moderation queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSingleAction = async (commentId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch('/api/moderation/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          action,
          reason: reason || (action === 'reject' ? 'Content violates community guidelines' : undefined),
        }),
      })

      if (response.ok) {
        // Remove from queue
        setComments(prev => prev.filter(c => c.id !== commentId))
        onActionComplete()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to process action')
      }
    } catch (error) {
      console.error('Error processing action:', error)
      alert('Failed to process action')
    }
  }

  const toggleExpanded = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const toggleSelection = (commentId: string) => {
    if (selectedComments.includes(commentId)) {
      onSelectionChange(selectedComments.filter(id => id !== commentId))
    } else {
      onSelectionChange([...selectedComments, commentId])
    }
  }

  const selectAll = () => {
    if (selectedComments.length === comments.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(comments.map(c => c.id))
    }
  }

  const getPriorityBadge = (priority: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    switch (priority) {
      case 'high':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'low':
        return `${baseClasses} bg-green-100 text-green-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
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

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3 3m0 0l3-3m-3 3V2m5 16l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No comments to moderate</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' ? 'All comments have been moderated.' : `No ${filter} priority comments.`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Select All Header */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedComments.length === comments.length && comments.length > 0}
            onChange={selectAll}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-3 text-sm text-gray-700">
            Select all {comments.length} comments
          </span>
        </div>
      </div>

      {/* Comments List */}
      <div className="divide-y divide-gray-200">
        {comments.map((comment) => {
          const isExpanded = expandedComments.has(comment.id)
          const isSelected = selectedComments.includes(comment.id)

          return (
            <div key={comment.id} className={`p-6 ${isSelected ? 'bg-indigo-50' : ''}`}>
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(comment.id)}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={getPriorityBadge(comment.priority)}>
                        {comment.priority} priority
                      </span>
                      <span className={getStanceBadge(comment.stance)}>
                        {comment.stance.toLowerCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        Risk Score: {(comment.riskScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <button
                      onClick={() => toggleExpanded(comment.id)}
                      className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      {isExpanded ? 'Show less' : 'Show more'}
                    </button>
                  </div>

                  {/* User Info */}
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">{comment.user.name || 'Anonymous'}</span>
                    <span className="mx-2">•</span>
                    <span>{comment.user.email}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(comment.submittedAt).toLocaleString()}</span>
                  </div>

                  {/* Meeting & Agenda Items */}
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Meeting:</span> {comment.meeting.title}
                    <div className="mt-1">
                      <span className="font-medium">Agenda Items:</span>
                      {comment.agendaItems.map((item, idx) => (
                        <span key={idx} className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {item.agendaItem.code}: {item.agendaItem.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Moderation Flags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {comment.piiDetected && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        PII Detected
                      </span>
                    )}
                    {comment.profanityDetected && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        Profanity
                      </span>
                    )}
                    {comment.riskFlags?.harassment && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        Harassment
                      </span>
                    )}
                    {comment.riskFlags?.threat && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        Threats
                      </span>
                    )}
                    {comment.riskFlags?.hate && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        Hate Speech
                      </span>
                    )}
                  </div>

                  {/* Comment Content */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Processed Content:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {comment.publicBody}
                    </p>
                  </div>

                  {isExpanded && (
                    <>
                      {/* Original Content */}
                      <div className="bg-red-50 rounded-lg p-4 mb-3">
                        <h4 className="text-sm font-medium text-red-900 mb-2">Original Content:</h4>
                        <p className="text-sm text-red-700 whitespace-pre-wrap">
                          {comment.rawBody}
                        </p>
                      </div>

                      {/* Moderation Notes */}
                      {comment.moderationNotes && (
                        <div className="bg-yellow-50 rounded-lg p-4 mb-3">
                          <h4 className="text-sm font-medium text-yellow-900 mb-2">System Notes:</h4>
                          <p className="text-sm text-yellow-700 whitespace-pre-wrap">
                            {comment.moderationNotes}
                          </p>
                        </div>
                      )}

                      {/* Moderation History */}
                      {comment.moderationLogs.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Moderation History:</h4>
                          <div className="space-y-2">
                            {comment.moderationLogs.map((log) => (
                              <div key={log.id} className="text-sm">
                                <span className="font-medium">{log.moderator.name || log.moderator.email}</span>
                                <span className="mx-2">•</span>
                                <span className="text-gray-600">{log.action}</span>
                                <span className="mx-2">•</span>
                                <span className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                                {log.reason && (
                                  <div className="text-gray-600 mt-1">{log.reason}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleSingleAction(comment.id, 'approve')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason (optional):')
                        if (reason !== null) {
                          handleSingleAction(comment.id, 'reject', reason)
                        }
                      }}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}