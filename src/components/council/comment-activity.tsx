'use client'

interface ActivityData {
  date: string
  count: number
  stance: string
}

interface CommentActivityProps {
  activityData: ActivityData[]
}

export default function CommentActivity({ activityData }: CommentActivityProps) {
  // Group data by date and aggregate by stance
  const groupedData = activityData.reduce((acc, item) => {
    const date = item.date
    if (!acc[date]) {
      acc[date] = { date, FOR: 0, AGAINST: 0, CONCERNED: 0, NEUTRAL: 0, total: 0 }
    }
    acc[date][item.stance as keyof typeof acc[string]] += item.count
    acc[date].total += item.count
    return acc
  }, {} as Record<string, { date: string; FOR: number; AGAINST: number; CONCERNED: number; NEUTRAL: number; total: number }>)

  const chartData = Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date))
  
  // Calculate max value for scaling
  const maxValue = Math.max(...chartData.map(d => d.total), 1)

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Comment Activity</h3>
        <div className="text-center py-8 text-gray-500">
          No comment activity data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Comment Activity Over Time</h3>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">For</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Against</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Concerned</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Neutral</span>
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-20 text-xs text-gray-500 text-right mr-3">
              {new Date(item.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            
            <div className="flex-1 flex">
              <div className="flex h-6 bg-gray-100 rounded overflow-hidden" style={{ width: '300px' }}>
                {/* Stacked bars */}
                <div 
                  className="bg-green-500" 
                  style={{ width: `${(item.FOR / maxValue) * 100}%` }}
                  title={`For: ${item.FOR}`}
                ></div>
                <div 
                  className="bg-red-500" 
                  style={{ width: `${(item.AGAINST / maxValue) * 100}%` }}
                  title={`Against: ${item.AGAINST}`}
                ></div>
                <div 
                  className="bg-yellow-500" 
                  style={{ width: `${(item.CONCERNED / maxValue) * 100}%` }}
                  title={`Concerned: ${item.CONCERNED}`}
                ></div>
                <div 
                  className="bg-gray-500" 
                  style={{ width: `${(item.NEUTRAL / maxValue) * 100}%` }}
                  title={`Neutral: ${item.NEUTRAL}`}
                ></div>
              </div>
              
              <span className="ml-3 text-sm text-gray-600 w-8">
                {item.total}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-green-600">
              {chartData.reduce((sum, item) => sum + item.FOR, 0)}
            </div>
            <div className="text-xs text-gray-500">Total For</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">
              {chartData.reduce((sum, item) => sum + item.AGAINST, 0)}
            </div>
            <div className="text-xs text-gray-500">Total Against</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-600">
              {chartData.reduce((sum, item) => sum + item.CONCERNED, 0)}
            </div>
            <div className="text-xs text-gray-500">Total Concerned</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-600">
              {chartData.reduce((sum, item) => sum + item.NEUTRAL, 0)}
            </div>
            <div className="text-xs text-gray-500">Total Neutral</div>
          </div>
        </div>
      </div>
    </div>
  )
}