'use client'

import Link from 'next/link'
import { MeetingStatus, Role } from '@prisma/client'
import { Session } from 'next-auth'

type Meeting = {
  id: string
  title: string
  description?: string | null
  body: string
  startTime: Date
  endTime: Date
  status: MeetingStatus
  location?: string | null
  videoUrl?: string | null
  agendaItems: {
    id: string
    code: string
    title: string
    description?: string | null
    orderIndex: number
    cutoffTime?: Date | null
    supportingDocs?: any
    _count: {
      commentItems: number
    }
  }[]
  _count: {
    comments: number
  }
}

interface MeetingDetailsProps {
  meeting: Meeting
  session: Session | null
}

export default function MeetingDetails({ meeting, session }: MeetingDetailsProps) {
  const canManage = session?.user.role === Role.STAFF || session?.user.role === Role.ADMIN
  const canComment = !!session
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: MeetingStatus) => {
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium'
    
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

  const isCommentingOpen = (item: Meeting['agendaItems'][0]) => {
    if (meeting.status === MeetingStatus.ENDED) return false
    if (!item.cutoffTime) return true
    return new Date() < new Date(item.cutoffTime)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="mb-4">
          <Link href="/meetings" className="text-indigo-600 hover:text-indigo-500">
            ← Back to Meetings
          </Link>
        </nav>
        
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
              <span className={getStatusBadge(meeting.status)}>
                {meeting.status.toLowerCase()}
              </span>
            </div>
            
            <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(meeting.startTime)}
              </div>
              
              {meeting.location && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {meeting.location}
                </div>
              )}
              
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {meeting._count.comments} total comments
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex space-x-3 md:mt-0">
            {meeting.videoUrl && (
              <a
                href={meeting.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Watch Live
              </a>
            )}
            
            {canManage && (
              <Link
                href={`/staff/meetings/${meeting.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Edit Meeting
              </Link>
            )}
          </div>
        </div>
        
        {meeting.description && (
          <div className="mt-4">
            <p className="text-gray-700">{meeting.description}</p>
          </div>
        )}
      </div>

      {/* Agenda Items */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Agenda</h2>
            {canComment && meeting.agendaItems.length > 0 && (
              <Link
                href={`/meetings/${meeting.id}/comment`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Submit Comment
              </Link>
            )}
          </div>
        </div>
        
        {meeting.agendaItems.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-6 4h6m-6 4h6m6-16h6m-6 4h6m-6 4h6m-6 4h6" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No agenda items</h3>
            <p className="mt-1 text-sm text-gray-500">The agenda for this meeting has not been published yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {meeting.agendaItems.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800">
                        {item.code}
                      </span>
                      <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                    </div>
                    
                    {item.description && (
                      <p className="mt-2 text-sm text-gray-700">{item.description}</p>
                    )}
                    
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {item._count.commentItems} comments
                      </div>
                      
                      {item.cutoffTime && (
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Comments close: {formatDate(item.cutoffTime)}
                        </div>
                      )}
                      
                      {!isCommentingOpen(item) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Comments Closed
                        </span>
                      )}
                    </div>
                    
                    {item.supportingDocs?.files && item.supportingDocs.files.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Supporting Documents:</h4>
                        <div className="space-y-1">
                          {item.supportingDocs.files.map((file: any, index: number) => (
                            <a
                              key={index}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                            >
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {file.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {canComment && isCommentingOpen(item) && (
                    <div className="flex-shrink-0 ml-4">
                      <Link
                        href={`/meetings/${meeting.id}/comment?item=${item.id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Comment
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}