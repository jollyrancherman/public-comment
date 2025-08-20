import { Suspense } from 'react'
import Navbar from '@/components/layout/navbar'
import MeetingsList from '@/components/meetings/meetings-list'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { Role } from '@prisma/client'

export default async function MeetingsPage() {
  const session = await getServerSession(authOptions)
  const canManageMeetings = session?.user.role === Role.STAFF || session?.user.role === Role.ADMIN

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">City Meetings</h1>
              <p className="mt-2 text-sm text-gray-700">
                View upcoming and past city council and commission meetings. Submit comments on agenda items.
              </p>
            </div>
            {canManageMeetings && (
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Link
                  href="/staff/meetings/new"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Create Meeting
                </Link>
              </div>
            )}
          </div>

          <div className="mt-8">
            <Suspense fallback={<MeetingsListSkeleton />}>
              <MeetingsList />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  )
}

function MeetingsListSkeleton() {
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