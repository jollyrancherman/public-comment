'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const COMMON_TAGS = [
  'Transportation',
  'Housing',
  'Environment',
  'Parks & Recreation',
  'Public Safety',
  'Economic Development',
  'Infrastructure',
  'Education',
  'Health & Social Services',
  'Budget & Finance',
  'Technology',
  'Community Events'
]

export default function RecommendationForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    tags: [] as string[],
    customTag: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          body: formData.body.trim(),
          tags: formData.tags,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create recommendation')
      }

      const data = await response.json()
      router.push(`/recommendations/${data.recommendation.id}`)
    } catch (err) {
      console.error('Error creating recommendation:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const handleAddCustomTag = () => {
    const customTag = formData.customTag.trim()
    if (customTag && !formData.tags.includes(customTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, customTag],
        customTag: ''
      }))
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            required
            maxLength={200}
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Clear, descriptive title for your recommendation"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.title.length}/200 characters
          </p>
        </div>

        {/* Body */}
        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="body"
            required
            rows={8}
            maxLength={5000}
            value={formData.body}
            onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe your recommendation in detail. What problem does it solve? How would it be implemented? What are the benefits?"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.body.length}/5,000 characters
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tags (select up to 5)
          </label>
          
          {/* Common Tags */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {COMMON_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-2 text-sm rounded-md border ${
                  formData.tags.includes(tag)
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                disabled={!formData.tags.includes(tag) && formData.tags.length >= 5}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Custom Tag Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={formData.customTag}
              onChange={(e) => setFormData(prev => ({ ...prev, customTag: e.target.value }))}
              placeholder="Add custom tag"
              maxLength={30}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddCustomTag}
              disabled={!formData.customTag.trim() || formData.tags.length >= 5}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>

          {/* Selected Tags */}
          {formData.tags.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-700 mb-2">Selected tags:</p>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-indigo-600 hover:text-indigo-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Guidelines */}
        <div className="bg-gray-50 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Guidelines</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Be specific and constructive in your recommendations</li>
            <li>• Explain the problem and your proposed solution clearly</li>
            <li>• Consider feasibility and potential impacts</li>
            <li>• Respect community guidelines and be civil</li>
            <li>• Search existing recommendations to avoid duplicates</li>
          </ul>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.title.trim() || !formData.body.trim()}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Recommendation'}
          </button>
        </div>
      </form>
    </div>
  )
}