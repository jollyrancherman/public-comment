'use client'

import { useState } from 'react'

interface VoteButtonsProps {
  recommendationId: string
  upvotes: number
  downvotes: number
  userVote: number // -1, 0, or 1
  onVoteUpdate: (recommendationId: string, newVote: number, upvotes: number, downvotes: number) => void
}

export default function VoteButtons({ 
  recommendationId, 
  upvotes, 
  downvotes, 
  userVote, 
  onVoteUpdate 
}: VoteButtonsProps) {
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (value: number) => {
    if (isVoting) return

    setIsVoting(true)
    try {
      const response = await fetch('/api/recommendations/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendationId,
          value: userVote === value ? 0 : value, // Toggle vote if same
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to vote')
      }

      const data = await response.json()
      onVoteUpdate(recommendationId, data.userVote, data.upvotes, data.downvotes)
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const netVotes = upvotes - downvotes

  return (
    <div className="flex flex-col items-center space-y-1">
      {/* Upvote */}
      <button
        onClick={() => handleVote(1)}
        disabled={isVoting}
        className={`p-1 rounded hover:bg-gray-100 disabled:opacity-50 ${
          userVote === 1 ? 'text-green-600' : 'text-gray-400'
        }`}
        title="Upvote"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Vote Count */}
      <span className={`text-sm font-medium ${
        netVotes > 0 ? 'text-green-600' : 
        netVotes < 0 ? 'text-red-600' : 
        'text-gray-600'
      }`}>
        {netVotes}
      </span>

      {/* Downvote */}
      <button
        onClick={() => handleVote(-1)}
        disabled={isVoting}
        className={`p-1 rounded hover:bg-gray-100 disabled:opacity-50 ${
          userVote === -1 ? 'text-red-600' : 'text-gray-400'
        }`}
        title="Downvote"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}