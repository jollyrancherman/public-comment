'use client'

import { useState } from 'react'

interface ExportToolsProps {
  selectedMeeting: string
}

export default function ExportTools({ selectedMeeting }: ExportToolsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setIsExporting(true)
      
      const params = new URLSearchParams()
      params.set('format', format)
      if (selectedMeeting !== 'all') {
        params.set('meetingId', selectedMeeting)
      }
      
      const response = await fetch(`/api/council/export?${params}`)
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const filename = selectedMeeting === 'all' 
        ? `all-comments.${format}`
        : `meeting-${selectedMeeting}-comments.${format}`
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Export Data</h3>
      <p className="text-sm text-gray-600 mb-4">
        Export comment data for council packets or analysis.
        {selectedMeeting !== 'all' && ' Current filter will be applied to export.'}
      </p>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
        
        <button
          onClick={() => handleExport('json')}
          disabled={isExporting}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {isExporting ? 'Exporting...' : 'Export JSON'}
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>• CSV format is optimized for spreadsheet applications</p>
        <p>• JSON format includes full metadata and is machine-readable</p>
      </div>
    </div>
  )
}