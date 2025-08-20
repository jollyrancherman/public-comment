'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MeetingStatus } from '@prisma/client'

interface MeetingFormData {
  title: string
  description: string
  body: string
  startTime: string
  endTime: string
  location: string
  videoUrl: string
  status: MeetingStatus
}

export default function MeetingForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState<MeetingFormData>({
    title: '',
    description: '',
    body: 'COUNCIL',
    startTime: '',
    endTime: '',
    location: '',
    videoUrl: '',
    status: MeetingStatus.UPCOMING,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create meeting')
      }

      router.push(`/meetings/${data.meeting.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Helper to get current datetime in local timezone for input
  const getCurrentDateTime = () => {
    const now = new Date()
    const offset = now.getTimezoneOffset() * 60000
    const localTime = new Date(now.getTime() - offset)
    return localTime.toISOString().slice(0, 16)
  }

  // Helper to add hours to a datetime string
  const addHours = (datetime: string, hours: number) => {
    if (!datetime) return ''
    const date = new Date(datetime)
    date.setHours(date.getHours() + hours)
    const offset = date.getTimezoneOffset() * 60000
    const localTime = new Date(date.getTime() - offset)
    return localTime.toISOString().slice(0, 16)
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Meeting Title *
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="City Council Regular Meeting"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Brief description of the meeting purpose and agenda"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700">
              Meeting Body *
            </label>
            <select
              name="body"
              id="body"
              required
              value={formData.body}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="COUNCIL">City Council</option>
              <option value="PLANNING">Planning Commission</option>
              <option value="PARKS">Parks and Recreation</option>
              <option value="FINANCE">Finance Committee</option>
              <option value="PUBLIC_SAFETY">Public Safety</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value={MeetingStatus.UPCOMING}>Upcoming</option>
              <option value={MeetingStatus.ACTIVE}>Active</option>
              <option value={MeetingStatus.ENDED}>Ended</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
              Start Time *
            </label>
            <input
              type="datetime-local"
              name="startTime"
              id="startTime"
              required
              value={formData.startTime}
              onChange={(e) => {
                handleChange(e)
                // Auto-set end time to 2 hours later if not already set
                if (!formData.endTime) {
                  setFormData(prev => ({
                    ...prev,
                    endTime: addHours(e.target.value, 2)
                  }))
                }
              }}
              min={getCurrentDateTime()}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
              End Time *
            </label>
            <input
              type="datetime-local"
              name="endTime"
              id="endTime"
              required
              value={formData.endTime}
              onChange={handleChange}
              min={formData.startTime}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            name="location"
            id="location"
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="City Hall, Council Chambers"
          />
        </div>

        <div>
          <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">
            Video Stream URL
          </label>
          <input
            type="url"
            name="videoUrl"
            id="videoUrl"
            value={formData.videoUrl}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="https://example.com/live-stream"
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional live stream URL for remote participation
          </p>
        </div>

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
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Meeting'}
          </button>
        </div>
      </form>
    </div>
  )
}