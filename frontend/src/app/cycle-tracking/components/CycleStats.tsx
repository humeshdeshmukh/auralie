'use client';

import { format } from 'date-fns';
import { CycleStats as CycleStatsType, CycleEntry } from '../types';
import NextPeriodPanel from './NextPeriodPanel';

interface CycleStatsProps {
  stats: CycleStatsType;
  onAddEntry: () => void;
  onSelectEntry?: (entry: CycleEntry) => void;
  entries?: CycleEntry[];
  userId: string;
}

export default function CycleStats({ stats, onAddEntry, userId }: CycleStatsProps) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getFertilityStatus = (): string => {
    // Return a default value for now
    return 'Not available';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-pink-700 mb-6 pb-2 border-b border-gray-200">Cycle Overview</h2>
        
        <div className="space-y-4">
          {/* Average Cycle Length */}
          <div className="bg-pink-50 p-5 rounded-lg border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-pink-700 mb-1">Average Cycle</div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-pink-800">{stats.averageCycleLength || '--'}</span>
                  <span className="ml-2 text-gray-500">days</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">Typical cycle duration</div>
            </div>
          </div>
          
          {/* Period Length */}
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700 mb-1">Period Length</div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-blue-800">{stats.averagePeriodLength || '--'}</span>
                  <span className="ml-2 text-gray-500">days</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">Average period duration</div>
            </div>
          </div>
          
          {/* Cycle Variability */}
          <div className={`p-5 rounded-lg border ${
            stats.cycleVariability < 3 ? 'bg-green-50 border-green-100' : 
            stats.cycleVariability < 7 ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Cycle Consistency</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  stats.cycleVariability < 3 ? 'bg-green-100 text-green-800' : 
                  stats.cycleVariability < 5 ? 'bg-green-100 text-green-800' : 
                  stats.cycleVariability < 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {stats.cycleVariability < 3 ? 'Very Consistent' : 
                   stats.cycleVariability < 5 ? 'Consistent' : 
                   stats.cycleVariability < 7 ? 'Moderate' : 'High Variation'}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="text-2xl font-bold text-gray-900">{stats.cycleVariability || '--'}<span className="ml-1 text-sm font-normal text-gray-500">days</span></div>
                <div className="w-3/4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>More</span>
                    <span>Less</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        stats.cycleVariability < 3 ? 'bg-green-500' : 
                        stats.cycleVariability < 5 ? 'bg-green-400' : 
                        stats.cycleVariability < 7 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{
                        width: `${Math.min(95, 95 - ((stats.cycleVariability || 0) * 7))}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Current Status</h2>
          <button
            onClick={onAddEntry}
            className="text-sm bg-pink-600 hover:bg-pink-700 text-white px-3 py-1 rounded-md"
          >
            + Add Entry
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-600">Fertility</span>
              <span className="text-sm text-gray-500">{getFertilityStatus()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Next Period Panel */}
      <NextPeriodPanel userId={userId} />

      {stats.lastPeriodStart && (
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Last Period</h2>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-gray-900 font-medium">
                {formatDate(stats.lastPeriodStart)}
              </p>
              {stats.averagePeriodLength && (
                <p className="text-sm text-gray-500">
                  {stats.averagePeriodLength} days average
                </p>
              )}
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
              {stats.nextPeriodStart ? 'In Progress' : 'Completed'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
