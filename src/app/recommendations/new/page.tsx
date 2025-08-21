import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import Navbar from '@/components/layout/navbar'
import RecommendationForm from '@/components/recommendations/recommendation-form'

export default async function NewRecommendationPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create Recommendation</h1>
            <p className="mt-2 text-sm text-gray-700">
              Share your proposal with the community. Be clear, constructive, and specific.
            </p>
          </div>
          
          <RecommendationForm />
        </div>
      </div>
    </>
  )
}