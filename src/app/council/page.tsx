import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import Navbar from '@/components/layout/navbar'
import CouncilDashboard from '@/components/council/council-dashboard'

export default async function CouncilPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'COUNCIL_MEMBER' && session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Council Dashboard</h1>
            <p className="mt-2 text-sm text-gray-700">
              View public comment analytics, sentiment, and engagement metrics.
            </p>
          </div>
          
          <CouncilDashboard />
        </div>
      </div>
    </>
  )
}