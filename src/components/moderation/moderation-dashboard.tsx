'use client'

import { useState, useEffect } from 'react'
import { CommentVisibility, CommentStance } from '@prisma/client'
import ModerationQueue from './moderation-queue'

interface ModerationStats {
  total: number
  pending: number
  hidden: number
  visible: number
  recentActions: number
  percentModerated: string
}

interface ModerationDashboardProps {
  initialStats: ModerationStats
}

export default function ModerationDashboard({ initialStats }: ModerationDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [selectedComments, setSelectedComments] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [stats, setStats] = useState(initialStats)

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedComments.length === 0) {
      alert('Please select comments to moderate')
      return
    }

    const confirmMessage = action === 'approve' 
      ? `Approve ${selectedComments.length} comment(s)?`
      : `Reject ${selectedComments.length} comment(s)?`

    if (!confirm(confirmMessage)) return

    setIsProcessing(true)

    try {
      const response = await fetch('/api/moderation/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentIds: selectedComments,
          action,
          reason: action === 'reject' ? 'Bulk moderation - content violates guidelines' : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Successfully processed ${data.successful} comment(s)`)
        setSelectedComments([])
        // Refresh the queue
        window.location.reload()
      } else {
        alert(data.error || 'Failed to process moderation action')
      }
    } catch (error) {
      console.error('Error processing bulk action:', error)
      alert('Failed to process moderation action')
    } finally {
      setIsProcessing(false)
    }
  }

  const refreshStats = async () => {
    try {
      const response = await fetch('/api/moderation/queue?includeStats=true')
      const data = await response.json()
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error refreshing stats:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'all', label: 'All Comments', color: 'gray' },
              { key: 'high', label: 'High Priority', color: 'red' },
              { key: 'medium', label: 'Medium Priority', color: 'yellow' },
              { key: 'low', label: 'Low Priority', color: 'green' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? `border-${tab.color}-500 text-${tab.color}-600`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Bulk Actions */}
        {selectedComments.length > 0 && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-800">
                {selectedComments.length} comment(s) selected
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleBulkAction('approve')}
                  disabled={isProcessing}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  Approve Selected
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={isProcessing}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  Reject Selected
                </button>
                <button
                  onClick={() => setSelectedComments([])}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Moderation Queue */}
      <ModerationQueue 
        filter={filter}
        selectedComments={selectedComments}
        onSelectionChange={setSelectedComments}
        onActionComplete={refreshStats}
      />

      {/* Auto-refresh notice */}
      <div className="text-center text-sm text-gray-500">
        <p>Queue refreshes automatically every 30 seconds</p>
      </div>
    </div>
  )
}