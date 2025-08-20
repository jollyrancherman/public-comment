'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MeetingStatus } from '@prisma/client'

type Meeting = {
  id: string
  title: string
  description?: string | null
  body: string
  startTime: string
  endTime: string
  status: MeetingStatus
  location?: string | null
  videoUrl?: string | null
  agendaItems: {
    id: string
    code: string
    title: string
  }[]
  _count: {
    comments: number
  }
}

export default function MeetingsList() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'ended'>('all')

  useEffect(() => {
    fetchMeetings()
  }, [filter])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const params = filter !== 'all' ? `?status=${filter.toUpperCase()}` : ''
      const response = await fetch(`/api/meetings${params}`)
      const data = await response.json()
      setMeetings(data.meetings)
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: MeetingStatus) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    
    switch (status) {
      case MeetingStatus.UPCOMING:
        return `${baseClasses} bg-blue-100 text-blue-800`
      case MeetingStatus.ACTIVE:
        return `${baseClasses} bg-green-100 text-green-800`
      case MeetingStatus.ENDED:
        return `${baseClasses} bg-gray-100 text-gray-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Meetings' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'active', label: 'Active' },
            { key: 'ended', label: 'Past' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Meetings list */}
      {meetings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14c0 4.418-7.163 8-16 8-1.381 0-2.721-.087-4-.252"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No meetings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'No meetings have been scheduled yet.' : `No ${filter} meetings found.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="bg-white shadow rounded-lg">
              <div className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        <Link 
                          href={`/meetings/${meeting.id}`}
                          className="hover:text-indigo-600"
                        >
                          {meeting.title}
                        </Link>
                      </h3>
                      <span className={getStatusBadge(meeting.status)}>
                        {meeting.status.toLowerCase()}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600">{meeting.body} Meeting</p>
                    
                    {meeting.description && (
                      <p className="mt-2 text-sm text-gray-700">{meeting.description}</p>
                    )}
                    
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(meeting.startTime)}
                      </div>
                      
                      {meeting.location && (
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {meeting.location}
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {meeting.agendaItems.length} agenda items
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {meeting._count.comments} comments
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-4">
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
                
                {meeting.agendaItems.length > 0 && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Agenda Items:</h4>
                    <div className="flex flex-wrap gap-2">
                      {meeting.agendaItems.slice(0, 5).map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {item.code}: {item.title.slice(0, 30)}{item.title.length > 30 ? '...' : ''}
                        </span>
                      ))}
                      {meeting.agendaItems.length > 5 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                          +{meeting.agendaItems.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}