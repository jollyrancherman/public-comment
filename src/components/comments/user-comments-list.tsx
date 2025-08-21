'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CommentStance, CommentVisibility, MeetingStatus } from '@prisma/client'

type Comment = {
  id: string
  publicBody: string
  stance: CommentStance
  visibility: CommentVisibility
  submittedAt: string
  withdrawnAt?: string | null
  meeting: {
    id: string
    title: string
    startTime: string
    status: MeetingStatus
  }
  agendaItems: Array<{
    agendaItem: {
      id: string
      code: string
      title: string
    }
  }>
}

interface UserCommentsListProps {
  comments: Comment[]
}

export default function UserCommentsList({ comments: initialComments }: UserCommentsListProps) {
  const [comments, setComments] = useState(initialComments)

  const handleWithdrawComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to withdraw this comment?')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Update the comment status locally
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, visibility: CommentVisibility.WITHDRAWN, withdrawnAt: new Date().toISOString() }
            : comment
        ))
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

  const getStatusBadge = (comment: Comment) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    
    if (comment.withdrawnAt) {
      return `${baseClasses} bg-gray-100 text-gray-800`
    }
    
    switch (comment.visibility) {
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

  const getStatusText = (comment: Comment) => {
    if (comment.withdrawnAt) return 'Withdrawn'
    
    switch (comment.visibility) {
      case CommentVisibility.VISIBLE:
        return 'Visible'
      case CommentVisibility.PENDING_VISIBLE:
        return 'Pending'
      case CommentVisibility.HIDDEN:
        return 'Hidden'
      case CommentVisibility.WITHDRAWN:
        return 'Withdrawn'
    }
  }

  const canWithdraw = (comment: Comment) => {
    return comment.visibility !== CommentVisibility.WITHDRAWN &&
           comment.visibility !== CommentVisibility.HIDDEN &&
           comment.meeting.status !== MeetingStatus.ENDED
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          You haven't submitted any comments yet. Start by attending a meeting!
        </p>
        <div className="mt-6">
          <Link
            href="/meetings"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Browse Meetings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="border border-gray-200 rounded-lg p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className={getStanceBadge(comment.stance)}>
                {comment.stance.toLowerCase().replace('_', ' ')}
              </span>
              
              <span className={getStatusBadge(comment)}>
                {getStatusText(comment)}
              </span>
              
              <span className="text-sm text-gray-500">
                {formatDate(comment.submittedAt)}
              </span>
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

          {/* Meeting Info */}
          <div className="mb-3">
            <Link 
              href={`/meetings/${comment.meeting.id}`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {comment.meeting.title}
            </Link>
            <span className="text-sm text-gray-500 ml-2">
              {formatDate(comment.meeting.startTime)}
            </span>
          </div>

          {/* Agenda Items */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {comment.agendaItems.map((item) => (
                <span
                  key={item.agendaItem.id}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                  title={item.agendaItem.title}
                >
                  {item.agendaItem.code}
                </span>
              ))}
            </div>
          </div>

          {/* Comment Body */}
          <div className="text-gray-900">
            <p className="line-clamp-3">
              {comment.publicBody}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between">
            <Link
              href={`/meetings/${comment.meeting.id}`}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              View Meeting →
            </Link>
            
            <div className="text-xs text-gray-500">
              {comment.visibility === CommentVisibility.PENDING_VISIBLE && 
                'Will be visible when meeting starts'
              }
              {comment.visibility === CommentVisibility.VISIBLE && 
                'Visible to public'
              }
              {comment.visibility === CommentVisibility.HIDDEN && 
                'Hidden by moderator'
              }
              {comment.withdrawnAt && 
                `Withdrawn on ${formatDate(comment.withdrawnAt)}`
              }
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}