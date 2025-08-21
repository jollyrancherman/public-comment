import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import Navbar from '@/components/layout/navbar'
import RecommendationsForum from '@/components/recommendations/recommendations-forum'

export default async function RecommendationsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Community Recommendations</h1>
            <p className="mt-2 text-sm text-gray-700">
              Share ideas and proposals with the community. Engage in discussions and vote on recommendations.
            </p>
          </div>
          
          <RecommendationsForum />
        </div>
      </div>
    </>
  )
}