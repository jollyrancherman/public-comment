import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/navbar'
import MeetingDetails from '@/components/meetings/meeting-details'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'

export default async function MeetingPage({ params }: { params: { id: string } }) {
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
        <MeetingDetails meeting={meeting} session={session} />
      </div>
    </>
  )
}