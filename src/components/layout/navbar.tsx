'use client'

import { useSession } from '@/components/providers/session-provider'
import Link from 'next/link'

export default function Navbar() {
  const { session, loading, signOut } = useSession()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-semibold">Public Comment</span>
            </Link>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/meetings"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
              >
                Meetings
              </Link>
              <Link
                href="/recommendations"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
              >
                Recommendations
              </Link>
              
              {session && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
                >
                  My Dashboard
                </Link>
              )}
              
              {session?.user.role === 'STAFF' && (
                <Link
                  href="/staff"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
                >
                  Staff Dashboard
                </Link>
              )}
              
              {session?.user.role === 'MODERATOR' && (
                <Link
                  href="/moderation"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
                >
                  Moderation
                </Link>
              )}
              
              {session?.user.role === 'COUNCIL_MEMBER' && (
                <Link
                  href="/council"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
                >
                  Council Dashboard
                </Link>
              )}
              
              {session?.user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {session.user.email}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                  {session.user.role}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}