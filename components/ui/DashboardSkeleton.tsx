import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Skeleton */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">PA</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">ProposalAI</h1>
            </div>
            <div className="flex items-center space-x-1">
              {/* Navigation links skeleton */}
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center space-x-1 px-3 py-2 rounded-lg">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section Skeleton */}
        <div className="mb-8">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse mb-2 w-96"></div>
          <div className="h-6 bg-gray-200 rounded-lg animate-pulse mb-8 w-80"></div>
          
          {/* Creation Hero Card Skeleton */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-8 shadow-2xl">
            <div className="max-w-4xl mx-auto text-center">
              <div className="h-8 bg-white/20 rounded-lg animate-pulse mb-4 w-80 mx-auto"></div>
              <div className="h-6 bg-white/20 rounded-lg animate-pulse mb-8 w-64 mx-auto"></div>
              
              {/* Creation Options Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                    <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 animate-pulse"></div>
                    <div className="h-6 bg-white/20 rounded-lg animate-pulse mb-2 w-24 mx-auto"></div>
                    <div className="h-4 bg-white/20 rounded-lg animate-pulse w-full"></div>
                  </div>
                ))}
              </div>

              {/* Smart Suggestions Skeleton */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <div className="h-6 bg-white/20 rounded-lg animate-pulse mb-4 w-40 mx-auto"></div>
                <div className="flex flex-wrap gap-3 justify-center">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-24 h-8 bg-white/20 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Intelligence Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-24"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse mb-1 w-16"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Unified Activity Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
              <div className="flex items-center gap-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100">
                  {/* Status Icon Skeleton */}
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  
                  {/* Content Skeleton */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-5 bg-gray-200 rounded animate-pulse w-48"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-64 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                  </div>
                  
                  {/* Action Buttons Skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Insights Skeleton */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-32"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 