'use client'

interface TagFilterProps {
  tags: string[]
  selectedTag: string
  onTagChange: (tag: string) => void
}

export default function TagFilter({ tags, selectedTag, onTagChange }: TagFilterProps) {
  if (tags.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Filter by Tag</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onTagChange('')}
          className={`px-3 py-1 text-sm rounded-full border ${
            selectedTag === ''
              ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagChange(tag)}
            className={`px-3 py-1 text-sm rounded-full border ${
              selectedTag === tag
                ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}