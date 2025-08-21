import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/navbar'
import ModerationSettings from '@/components/moderation/moderation-settings'

export default async function ModerationSettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || ![Role.MODERATOR, Role.ADMIN].includes(session.user.role)) {
    redirect('/auth/login')
  }

  // Get current moderation settings from database
  const settings = await prisma.systemConfig.findUnique({
    where: { key: 'moderation_settings' },
  })

  const currentSettings = settings?.value as any || {
    autoModerate: true,
    profanityFilter: true,
    piiRedaction: true,
    riskThreshold: 0.7,
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <nav className="mb-4">
              <a href="/moderation" className="text-indigo-600 hover:text-indigo-500">
                ← Back to Moderation Dashboard
              </a>
            </nav>
            
            <h1 className="text-2xl font-bold text-gray-900">Moderation Settings</h1>
            <p className="mt-2 text-sm text-gray-700">
              Configure automated moderation rules and thresholds.
            </p>
          </div>

          <ModerationSettings initialSettings={currentSettings} />
        </div>
      </div>
    </>
  )
}