'use client'

import { useState } from 'react'

interface CommentFormProps {
  recommendationId: string
  parentCommentId?: string
  onCommentAdded: (comment: unknown) => void
  onCancel?: () => void
  placeholder?: string
  submitText?: string
}

export default function CommentForm({ 
  recommendationId, 
  parentCommentId,
  onCommentAdded,
  onCancel,
  placeholder = "Share your thoughts on this recommendation...",
  submitText = "Post Comment"
}: CommentFormProps) {
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!body.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/recommendations/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendationId: parentCommentId ? undefined : recommendationId,
          parentId: parentCommentId,
          body: body.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to post comment')
      }

      const data = await response.json()
      onCommentAdded(data.comment)
      setBody('')
      
      if (onCancel) {
        onCancel()
      }
    } catch (err) {
      console.error('Error posting comment:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          rows={4}
          maxLength={2000}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          {body.length}/2,000 characters
        </p>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !body.trim()}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : submitText}
        </button>
      </div>
    </form>
  )
}