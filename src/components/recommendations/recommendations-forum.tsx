'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import RecommendationsList from './recommendations-list'
import SortingTabs from './sorting-tabs'
import TagFilter from './tag-filter'

export type SortOption = 'hot' | 'new' | 'top'

export default function RecommendationsForum() {
  const [sortBy, setSortBy] = useState<SortOption>('hot')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    // Fetch available tags
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/recommendations/tags')
        if (response.ok) {
          const data = await response.json()
          setTags(data.tags)
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error)
      }
    }

    fetchTags()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <SortingTabs sortBy={sortBy} onSortChange={setSortBy} />
        </div>
        
        <Link
          href="/recommendations/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Recommendation
        </Link>
      </div>

      {/* Tag Filter */}
      <TagFilter
        tags={tags}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
      />

      {/* Recommendations List */}
      <RecommendationsList
        sortBy={sortBy}
        selectedTag={selectedTag}
      />
    </div>
  )
}