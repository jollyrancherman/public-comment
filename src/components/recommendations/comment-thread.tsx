'use client'

import { useState } from 'react'
import CommentForm from './comment-form'

interface Comment {
  id: string
  body: string
  createdAt: string
  user: {
    email: string
    name: string | null
  }
  replies: Array<{
    id: string
    body: string
    createdAt: string
    user: {
      email: string
      name: string | null
    }
  }>
}

interface CommentThreadProps {
  comment: Comment
  currentUserId: string
  onReplyAdded: (parentId: string, reply: unknown) => void
}

export default function CommentThread({ comment, onReplyAdded }: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  const handleReplySubmit = (reply: unknown) => {
    onReplyAdded(comment.id, reply)
    setShowReplyForm(false)
  }

  return (
    <div className="border-l-2 border-gray-200 pl-4">
      {/* Main Comment */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">
              {comment.user.name || comment.user.email.split('@')[0]}
            </span>
            <span className="mx-2">•</span>
            <span>
              {new Date(comment.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Reply
          </button>
        </div>
        
        <div className="text-gray-900">
          {comment.body.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-2 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div className="mt-4 ml-4">
          <CommentForm
            recommendationId=""
            parentCommentId={comment.id}
            onCommentAdded={handleReplySubmit}
            onCancel={() => setShowReplyForm(false)}
            placeholder="Write a reply..."
            submitText="Reply"
          />
        </div>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="mt-4 ml-4">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-sm text-gray-600 hover:text-gray-800 mb-3"
          >
            {showReplies ? 'Hide' : 'Show'} {comment.replies.length} repl{comment.replies.length === 1 ? 'y' : 'ies'}
          </button>
          
          {showReplies && (
            <div className="space-y-3">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <span className="font-medium">
                      {reply.user.name || reply.user.email.split('@')[0]}
                    </span>
                    <span className="mx-2">•</span>
                    <span>
                      {new Date(reply.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="text-gray-900">
                    {reply.body.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-2 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}