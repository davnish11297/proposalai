import React from 'react';

interface QualityScoreProps {
  score: number;
  readability: number;
  completeness: number;
  persuasiveness: number;
  structure: number;
  suggestions: Array<{
    type: 'missing' | 'improvement' | 'enhancement';
    category: 'content' | 'structure' | 'formatting' | 'strategy';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  industryInsights?: string[];
  loading?: boolean;
  className?: string;
}

export const QualityScoreWidget: React.FC<QualityScoreProps> = ({
  score,
  readability,
  completeness,
  persuasiveness,
  structure,
  suggestions,
  industryInsights = [],
  loading = false,
  className = '',
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreRing = (score: number) => {
    const percentage = Math.max(0, Math.min(100, score));
    const circumference = 2 * Math.PI * 16; // radius = 16
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return {
      strokeDasharray,
      strokeDashoffset,
      stroke: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444',
    };
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${className}`}>
      {/* Header with Overall Score */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quality Score</h3>
          <p className="text-sm text-gray-600">Real-time proposal analysis</p>
        </div>
        
        {/* Circular Progress */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              {...getScoreRing(score)}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${getScoreColor(score).split(' ')[0]}`}>
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Readability</span>
            <span className="text-sm font-medium">{readability}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                readability >= 80 ? 'bg-green-500' : 
                readability >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${readability}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Completeness</span>
            <span className="text-sm font-medium">{completeness}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                completeness >= 80 ? 'bg-green-500' : 
                completeness >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${completeness}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Persuasiveness</span>
            <span className="text-sm font-medium">{persuasiveness}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                persuasiveness >= 80 ? 'bg-green-500' : 
                persuasiveness >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${persuasiveness}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Structure</span>
            <span className="text-sm font-medium">{structure}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                structure >= 80 ? 'bg-green-500' : 
                structure >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${structure}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Top Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Top Suggestions</h4>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {getPriorityIcon(suggestion.priority)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{suggestion.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                  suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {suggestion.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Industry Insights */}
      {industryInsights.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">💡 Industry Insights</h4>
          <div className="space-y-2">
            {industryInsights.slice(0, 3).map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-xs text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};