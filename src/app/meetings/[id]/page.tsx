import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/navbar'
import MeetingDetails from '@/components/meetings/meeting-details'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'

export default async function MeetingPage({ 
  params, 
  searchParams 
}: { 
  params: { id: string }
  searchParams: { submitted?: string }
}) {
  const session = await getServerSession(authOptions)
  
  const meeting = await prisma.meeting.findUnique({
    where: { id: params.id },
    include: {
      agendaItems: {
        orderBy: { orderIndex: 'asc' },
        include: {
          _count: {
            select: { commentItems: true },
          },
        },
      },
      _count: {
        select: { comments: true },
      },
    },
  })

  if (!meeting) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {searchParams.submitted && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="rounded-md bg-green-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Comment submitted successfully!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Your comment has been received and will be visible to the public when the meeting starts.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <MeetingDetails meeting={meeting} session={session} />
      </div>
    </>
  )
}