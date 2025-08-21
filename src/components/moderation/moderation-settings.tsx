'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ModerationSettingsProps {
  initialSettings: {
    autoModerate: boolean
    profanityFilter: boolean
    piiRedaction: boolean
    riskThreshold: number
  }
}

export default function ModerationSettings({ initialSettings }: ModerationSettingsProps) {
  const router = useRouter()
  const [settings, setSettings] = useState(initialSettings)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/moderation/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        alert('Settings saved successfully')
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Automated Moderation */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Automated Moderation</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure which moderation features are enabled automatically.
          </p>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="autoModerate"
                type="checkbox"
                checked={settings.autoModerate}
                onChange={(e) => setSettings({ ...settings, autoModerate: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="autoModerate" className="font-medium text-gray-700">
                Enable Automated Moderation
              </label>
              <p className="text-sm text-gray-500">
                Automatically process new comments through the moderation pipeline.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="profanityFilter"
                type="checkbox"
                checked={settings.profanityFilter}
                onChange={(e) => setSettings({ ...settings, profanityFilter: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="profanityFilter" className="font-medium text-gray-700">
                Profanity Filter
              </label>
              <p className="text-sm text-gray-500">
                Automatically detect and filter profane language.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="piiRedaction"
                type="checkbox"
                checked={settings.piiRedaction}
                onChange={(e) => setSettings({ ...settings, piiRedaction: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="piiRedaction" className="font-medium text-gray-700">
                PII Redaction
              </label>
              <p className="text-sm text-gray-500">
                Automatically detect and redact personally identifiable information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Thresholds */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Risk Thresholds</h2>
          <p className="mt-1 text-sm text-gray-500">
            Set thresholds for automatic content flagging.
          </p>
        </div>
        
        <div className="px-6 py-4">
          <div>
            <label htmlFor="riskThreshold" className="block text-sm font-medium text-gray-700">
              Auto-Hide Threshold
            </label>
            <div className="mt-1 flex items-center space-x-3">
              <input
                type="range"
                id="riskThreshold"
                min="0"
                max="1"
                step="0.1"
                value={settings.riskThreshold}
                onChange={(e) => setSettings({ ...settings, riskThreshold: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-900 w-12">
                {(settings.riskThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Comments with a risk score above this threshold will be automatically hidden.
            </p>
          </div>
        </div>
      </div>

      {/* AI Configuration Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">AI Configuration</h2>
          <p className="mt-1 text-sm text-gray-500">
            Status of AI moderation services.
          </p>
        </div>
        
        <div className="px-6 py-4">
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">OpenAI API</dt>
              <dd className="text-sm text-gray-900">
                {process.env.NEXT_PUBLIC_OPENAI_CONFIGURED === 'true' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Not Configured
                  </span>
                )}
              </dd>
            </div>
          </dl>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  AI Moderation Note
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    To enable AI-powered moderation, add your OpenAI API key to the environment variables.
                    Without it, only basic pattern-based moderation will be available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}