'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CommentStance } from '@prisma/client'

interface Meeting {
  id: string
  title: string
  description?: string | null
}

interface AgendaItem {
  id: string
  code: string
  title: string
  description?: string | null
  cutoffTime?: Date | null
}

interface CommentFormProps {
  meeting: Meeting
  availableItems: AgendaItem[]
  preselectedItemId?: string
}

interface CommentFormData {
  agendaItemIds: string[]
  body: string
  stance: CommentStance
  includeLocation: boolean
  latitude?: number
  longitude?: number
}

export default function CommentForm({ meeting, availableItems, preselectedItemId }: CommentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  
  const [formData, setFormData] = useState<CommentFormData>({
    agendaItemIds: preselectedItemId ? [preselectedItemId] : [],
    body: '',
    stance: CommentStance.NEUTRAL,
    includeLocation: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = {
        meetingId: meeting.id,
        agendaItemIds: formData.agendaItemIds,
        body: formData.body,
        stance: formData.stance,
        ...(formData.includeLocation && formData.latitude && formData.longitude ? {
          latitude: formData.latitude,
          longitude: formData.longitude,
        } : {}),
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit comment')
      }

      router.push(`/meetings/${meeting.id}?submitted=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAgendaItemChange = (itemId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      agendaItemIds: checked 
        ? [...prev.agendaItemIds, itemId]
        : prev.agendaItemIds.filter(id => id !== itemId)
    }))
  }

  const handleLocationToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      includeLocation: checked,
      ...(checked ? {} : { latitude: undefined, longitude: undefined })
    }))

    if (checked && !formData.latitude) {
      setLocationLoading(true)
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFormData(prev => ({
              ...prev,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }))
            setLocationLoading(false)
          },
          (error) => {
            console.error('Error getting location:', error)
            setFormData(prev => ({ ...prev, includeLocation: false }))
            setLocationLoading(false)
          }
        )
      } else {
        setFormData(prev => ({ ...prev, includeLocation: false }))
        setLocationLoading(false)
      }
    }
  }

  const getStanceColor = (stance: CommentStance) => {
    switch (stance) {
      case CommentStance.FOR:
        return 'bg-green-100 text-green-800 border-green-200'
      case CommentStance.AGAINST:
        return 'bg-red-100 text-red-800 border-red-200'
      case CommentStance.CONCERNED:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case CommentStance.NEUTRAL:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCutoffTime = (cutoffTime: Date | null) => {
    if (!cutoffTime) return 'No cutoff time'
    return new Date(cutoffTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Agenda Items Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Agenda Items to Comment On *
          </label>
          <div className="space-y-3">
            {availableItems.map((item) => (
              <div key={item.id} className="relative">
                <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agendaItemIds.includes(item.id)}
                    onChange={(e) => handleAgendaItemChange(item.id, e.target.checked)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800">
                        {item.code}
                      </span>
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Comments close: {formatCutoffTime(item.cutoffTime)}
                    </p>
                  </div>
                </label>
              </div>
            ))}
          </div>
          {formData.agendaItemIds.length === 0 && (
            <p className="mt-2 text-sm text-red-600">Please select at least one agenda item.</p>
          )}
        </div>

        {/* Comment Text */}
        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700">
            Your Comment *
          </label>
          <textarea
            name="body"
            id="body"
            rows={6}
            required
            value={formData.body}
            onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Share your thoughts on the selected agenda items. Please be respectful and constructive in your comments."
            maxLength={2000}
          />
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span>Minimum 10 characters required</span>
            <span>{formData.body.length}/2000</span>
          </div>
        </div>

        {/* Stance Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Your Position *
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.values(CommentStance).map((stance) => (
              <label
                key={stance}
                className={`relative flex items-center justify-center px-3 py-2 border rounded-md text-sm font-medium cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500 ${
                  formData.stance === stance
                    ? getStanceColor(stance)
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="stance"
                  value={stance}
                  checked={formData.stance === stance}
                  onChange={(e) => setFormData(prev => ({ ...prev, stance: e.target.value as CommentStance }))}
                  className="sr-only"
                />
                <span className="capitalize">
                  {stance.toLowerCase().replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Location Option */}
        <div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="includeLocation"
                type="checkbox"
                checked={formData.includeLocation}
                onChange={(e) => handleLocationToggle(e.target.checked)}
                disabled={locationLoading}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="includeLocation" className="font-medium text-gray-700">
                Include my general location
              </label>
              <p className="text-gray-500">
                Help city staff understand geographic distribution of comments. Your exact location will be rounded for privacy.
                {locationLoading && <span className="ml-2 text-indigo-600">Getting location...</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Privacy & Public Record Notice
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Your comment will become part of the public record</li>
                  <li>Comments will be visible to the public when the meeting starts</li>
                  <li>You can withdraw your comment until the agenda item is discussed</li>
                  <li>Location data (if provided) is rounded to protect your privacy</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || formData.agendaItemIds.length === 0 || formData.body.length < 10}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Comment'}
          </button>
        </div>
      </form>
    </div>
  )
}