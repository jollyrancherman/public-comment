'use client'

import type { Meeting } from '@prisma/client'

interface MeetingSelectorProps {
  meetings: Meeting[]
  selectedMeeting: string
  onMeetingChange: (meetingId: string) => void
}

export default function MeetingSelector({ meetings, selectedMeeting, onMeetingChange }: MeetingSelectorProps) {
  return (
    <div>
      <label htmlFor="meeting-select" className="block text-sm font-medium text-gray-700 mb-2">
        Filter by Meeting
      </label>
      <select
        id="meeting-select"
        value={selectedMeeting}
        onChange={(e) => onMeetingChange(e.target.value)}
        className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="all">All Meetings</option>
        {meetings.map((meeting) => (
          <option key={meeting.id} value={meeting.id}>
            {meeting.title} - {new Date(meeting.startTime).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </option>
        ))}
      </select>
      
      {selectedMeeting !== 'all' && (
        <div className="mt-2 text-sm text-gray-600">
          Showing data for: {meetings.find(m => m.id === selectedMeeting)?.title}
        </div>
      )}
    </div>
  )
}