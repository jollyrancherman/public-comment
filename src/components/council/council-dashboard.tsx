'use client'

import { useState, useEffect } from 'react'
import CouncilMetrics from './council-metrics'
import CommentActivity from './comment-activity'
import MeetingSelector from './meeting-selector'
import ExportTools from './export-tools'
import type { Meeting } from '@prisma/client'

export interface DashboardData {
  stanceCounts: {
    FOR: number
    AGAINST: number
    CONCERNED: number
    NEUTRAL: number
  }
  qualityMetrics: {
    averageLength: number
    civilityScore: number
    uniquenessScore: number
    totalComments: number
  }
  activityData: Array<{
    date: string
    count: number
    stance: string
  }>
  meetings: Meeting[]
}

export default function CouncilDashboard() {
  const [selectedMeeting, setSelectedMeeting] = useState<string>('all')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams()
        if (selectedMeeting !== 'all') {
          params.set('meetingId', selectedMeeting)
        }
        
        const response = await fetch(`/api/council/dashboard?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        
        const dashboardData = await response.json()
        setData(dashboardData)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedMeeting])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">Error loading dashboard: {error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-600">No data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Meeting Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <MeetingSelector
          meetings={data.meetings}
          selectedMeeting={selectedMeeting}
          onMeetingChange={setSelectedMeeting}
        />
      </div>

      {/* Export Tools */}
      <ExportTools selectedMeeting={selectedMeeting} />

      {/* Metrics Overview */}
      <CouncilMetrics
        stanceCounts={data.stanceCounts}
        qualityMetrics={data.qualityMetrics}
      />

      {/* Comment Activity Chart */}
      <CommentActivity activityData={data.activityData} />
    </div>
  )
}