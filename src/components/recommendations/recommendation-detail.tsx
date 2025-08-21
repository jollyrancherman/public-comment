'use client'

import { useState } from 'react'
import Link from 'next/link'
import VoteButtons from './vote-buttons'
import CommentThread from './comment-thread'
import CommentForm from './comment-form'

interface RecommendationDetailProps {
  recommendation: {
    id: string
    title: string
    body: string
    tags: string[]
    publishedAt: string
    user: {
      email: string
      name: string | null
    }
    comments: Array<{
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
    }>
  }
  upvotes: number
  downvotes: number
  userVote: number
  currentUserId: string
}

export default function RecommendationDetail({ 
  recommendation, 
  upvotes, 
  downvotes, 
  userVote,
  currentUserId
}: RecommendationDetailProps) {
  const [voteState, setVoteState] = useState({
    upvotes,
    downvotes,
    userVote
  })
  const [comments, setComments] = useState(recommendation.comments)

  const handleVoteUpdate = (recommendationId: string, newVote: number, newUpvotes: number, newDownvotes: number) => {
    setVoteState({
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: newVote
    })
  }

  const handleCommentAdded = (newComment: unknown) => {
    setComments(prev => [newComment, ...prev])
  }

  const handleReplyAdded = (parentId: string, reply: unknown) => {
    setComments(prev =>
      prev.map(comment =>
        comment.id === parentId
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      )
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/recommendations" className="text-gray-500 hover:text-gray-700">
              Recommendations
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-900 font-medium truncate max-w-md">
            {recommendation.title}
          </li>
        </ol>
      </nav>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            {/* Vote Buttons */}
            <VoteButtons
              recommendationId={recommendation.id}
              upvotes={voteState.upvotes}
              downvotes={voteState.downvotes}
              userVote={voteState.userVote}
              onVoteUpdate={handleVoteUpdate}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {recommendation.title}
              </h1>

              {/* Metadata */}
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <span>
                  Posted by {recommendation.user.name || recommendation.user.email.split('@')[0]}
                </span>
                <span className="mx-2">•</span>
                <span>
                  {new Date(recommendation.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Tags */}
              {recommendation.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {recommendation.tags.map((tag, index) => (
                    <Link
                      key={index}
                      href={`/recommendations?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Body */}
              <div className="prose max-w-none text-gray-900">
                {recommendation.body.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Discussion ({comments.length})
          </h2>

          {/* Comment Form */}
          <CommentForm
            recommendationId={recommendation.id}
            onCommentAdded={handleCommentAdded}
          />

          {/* Comments List */}
          <div className="mt-8 space-y-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onReplyAdded={handleReplyAdded}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}