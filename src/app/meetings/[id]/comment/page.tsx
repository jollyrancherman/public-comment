import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import CommentForm from '@/components/comments/comment-form'
import { MeetingStatus } from '@prisma/client'

export default async function CommentPage({ 
  params, 
  searchParams 
}: { 
  params: { id: string }
  searchParams: { item?: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect(`/auth/login?callbackUrl=/meetings/${params.id}/comment`)
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: params.id },
    include: {
      agendaItems: {
        orderBy: { orderIndex: 'asc' },
        where: searchParams.item ? { id: searchParams.item } : undefined,
      },
    },
  })

  if (!meeting) {
    notFound()
  }

  // Check if commenting is allowed
  if (meeting.status === MeetingStatus.ENDED) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Comments Closed</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This meeting has ended and is no longer accepting comments.
                </p>
                <div className="mt-6">
                  <a
                    href={`/meetings/${meeting.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    View Meeting Details
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Filter out agenda items that have passed their cutoff time
  const now = new Date()
  const availableItems = meeting.agendaItems.filter(item => 
    !item.cutoffTime || now <= item.cutoffTime
  )

  if (availableItems.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3L9 19l-3-3V8a3 3 0 013-3h3a3 3 0 013 3z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Available Items</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All agenda items for this meeting have passed their comment cutoff time.
                </p>
                <div className="mt-6">
                  <a
                    href={`/meetings/${meeting.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    View Meeting Details
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <nav className="mb-4">
              <a href={`/meetings/${meeting.id}`} className="text-indigo-600 hover:text-indigo-500">
                ← Back to {meeting.title}
              </a>
            </nav>
            
            <h1 className="text-2xl font-bold text-gray-900">Submit Public Comment</h1>
            <p className="mt-2 text-sm text-gray-700">
              Share your thoughts on the agenda items for this meeting. Your comment will be visible to the public once the meeting begins.
            </p>
          </div>

          <CommentForm 
            meeting={meeting} 
            availableItems={availableItems}
            preselectedItemId={searchParams.item}
          />
        </div>
      </div>
    </>
  )
}