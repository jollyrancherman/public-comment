'use client'

import { SortOption } from './recommendations-forum'

interface SortingTabsProps {
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}

export default function SortingTabs({ sortBy, onSortChange }: SortingTabsProps) {
  const tabs = [
    { key: 'hot' as SortOption, label: 'Hot', description: 'Trending recommendations' },
    { key: 'new' as SortOption, label: 'New', description: 'Most recent' },
    { key: 'top' as SortOption, label: 'Top', description: 'Most upvoted' },
  ]

  return (
    <div className="flex space-x-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onSortChange(tab.key)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            sortBy === tab.key
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          title={tab.description}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}