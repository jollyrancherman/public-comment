import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { Role } from '@prisma/client'
import Navbar from '@/components/layout/navbar'
import MeetingForm from '@/components/meetings/meeting-form'

export default async function NewMeetingPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || ![Role.STAFF, Role.ADMIN].includes(session.user.role)) {
    redirect('/auth/login')
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create New Meeting</h1>
            <p className="mt-2 text-sm text-gray-700">
              Set up a new city meeting with agenda items for public comment.
            </p>
          </div>

          <MeetingForm />
        </div>
      </div>
    </>
  )
}