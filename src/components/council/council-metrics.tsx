'use client'

interface StanceCounts {
  FOR: number
  AGAINST: number
  CONCERNED: number
  NEUTRAL: number
}

interface QualityMetrics {
  averageLength: number
  civilityScore: number
  uniquenessScore: number
  totalComments: number
}

interface CouncilMetricsProps {
  stanceCounts: StanceCounts
  qualityMetrics: QualityMetrics
}

export default function CouncilMetrics({ stanceCounts, qualityMetrics }: CouncilMetricsProps) {
  const total = stanceCounts.FOR + stanceCounts.AGAINST + stanceCounts.CONCERNED + stanceCounts.NEUTRAL
  
  const getPercentage = (count: number) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
  }

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'FOR':
        return 'text-green-600 bg-green-50'
      case 'AGAINST':
        return 'text-red-600 bg-red-50'
      case 'CONCERNED':
        return 'text-yellow-600 bg-yellow-50'
      case 'NEUTRAL':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + '%'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Stance Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Comment Stances</h3>
        <div className="space-y-4">
          {Object.entries(stanceCounts).map(([stance, count]) => (
            <div key={stance} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStanceColor(stance)}`}>
                  {stance.toLowerCase().replace('_', ' ')}
                </span>
                <span className="ml-3 text-sm text-gray-700">{count} comments</span>
              </div>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className={`h-2 rounded-full ${
                      stance === 'FOR' ? 'bg-green-600' :
                      stance === 'AGAINST' ? 'bg-red-600' :
                      stance === 'CONCERNED' ? 'bg-yellow-600' : 'bg-gray-600'
                    }`}
                    style={{ width: `${getPercentage(count)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-10 text-right">
                  {getPercentage(count)}%
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">Total: {total} comments</p>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(qualityMetrics.averageLength)}
            </div>
            <div className="text-sm text-gray-500">Avg Length (words)</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formatScore(qualityMetrics.civilityScore)}
            </div>
            <div className="text-sm text-gray-500">Civility Score</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formatScore(qualityMetrics.uniquenessScore)}
            </div>
            <div className="text-sm text-gray-500">Uniqueness</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {qualityMetrics.totalComments}
            </div>
            <div className="text-sm text-gray-500">Total Comments</div>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>• Civility Score: AI-assessed respectfulness and constructiveness</p>
          <p>• Uniqueness: Percentage of non-duplicate content</p>
        </div>
      </div>
    </div>
  )
}