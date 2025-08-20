import Navbar from '@/components/layout/navbar'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Public Comment Platform
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Share your voice on city matters. Submit comments for upcoming meetings and participate in community recommendations.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  href="/meetings"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                >
                  View Meetings
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link
                  href="/recommendations"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  Browse Recommendations
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Submit Comments</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Share your thoughts on agenda items for upcoming city meetings. Your voice matters in local governance.
                  </p>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Track Meetings</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Stay informed about upcoming council and commission meetings. View agendas and supporting documents.
                  </p>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Community Forum</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Propose ideas and engage in discussions about improving our city. Vote on community recommendations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
              <ol className="space-y-4">
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">1</span>
                  <span className="ml-3 text-gray-700">Sign in with your email to get started</span>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">2</span>
                  <span className="ml-3 text-gray-700">Browse upcoming meetings and agenda items</span>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">3</span>
                  <span className="ml-3 text-gray-700">Submit your comments on items that matter to you</span>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">4</span>
                  <span className="ml-3 text-gray-700">Your comments become visible when the meeting starts</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}