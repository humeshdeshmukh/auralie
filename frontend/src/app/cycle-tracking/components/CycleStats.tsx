'use client';

import { format, differenceInDays } from 'date-fns';
import { CycleStats as CycleStatsType, CyclePrediction } from '../types';

interface CycleStatsProps {
  stats: CycleStatsType;
  predictions: CyclePrediction | null;
  onAddEntry: () => void;
}

export default function CycleStats({ stats, predictions, onAddEntry }: CycleStatsProps) {
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

  const isDateInRange = (date: Date, start: string, end: string) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid date range:', { start, end });
        return false;
      }
      
      return date >= startDate && date <= endDate;
    } catch (error) {
      console.error('Error checking date range:', error);
      return false;
    }
  };

  const getDaysAway = (dateString: string | null | undefined): string | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const days = differenceInDays(date, new Date());
      if (days === 0) return 'Today';
      if (days === 1) return 'Tomorrow';
      if (days === -1) return 'Yesterday';
      return `${Math.abs(days)} ${days > 0 ? 'days' : 'days ago'}`;
    } catch (error) {
      console.error('Error calculating days away:', error);
      return null;
    }
  };

  const getFertilityStatus = () => {
    if (!predictions?.fertileWindow) return 'Unknown';
    
    const today = new Date();
    const fertileStart = parseISO(predictions.fertileWindow.start);
    const fertileEnd = parseISO(predictions.fertileWindow.end);
    
    if (today < fertileStart) {
      return `Not yet (in ${differenceInDays(fertileStart, today)} days)`;
    }
    
    if (today > fertileEnd) {
      return 'Not fertile';
    }
    
    return 'Fertile window';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-pink-700 mb-6 pb-2 border-b border-gray-200">Cycle Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Cycle Length */}
          <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
            <div className="text-sm font-medium text-pink-700 mb-1">Average Cycle</div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-pink-800">{stats.averageCycleLength || '--'}</span>
              <span className="text-gray-500 text-sm">days</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">Typical cycle duration</div>
          </div>
          
          {/* Average Period Length */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="text-sm font-medium text-blue-700 mb-1">Period Length</div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-blue-800">{stats.averagePeriodLength || '--'}</span>
              <span className="text-gray-500 text-sm">days</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">Average period duration</div>
          </div>
          
          {/* Cycle Variability */}
          <div className={`p-4 rounded-lg border ${
            stats.cycleVariability < 3 ? 'bg-green-50 border-green-100' : 
            stats.cycleVariability < 7 ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Cycle Variability</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                stats.cycleVariability < 3 ? 'bg-green-100 text-green-800' : 
                stats.cycleVariability < 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {stats.cycleVariability < 3 ? 'Low' : stats.cycleVariability < 7 ? 'Moderate' : 'High'}
              </span>
            </div>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-bold">{stats.cycleVariability || '--'}</span>
              <span className="text-gray-500 text-sm">days</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">Lower is more regular</div>
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
            {predictions?.fertileWindow && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full" 
                  style={{
                    width: '100%',
                    backgroundImage: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                    opacity: 0.8
                  }}
                ></div>
              </div>
            )}
          </div>
          
          {predictions?.ovulationDate && (
            <div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ovulation</span>
                <span className="text-sm text-gray-500">
                  {formatDate(predictions.ovulationDate)}
                  {getDaysAway(predictions.ovulationDate) && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      {getDaysAway(predictions.ovulationDate)}
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-purple-500 h-1.5 rounded-full" 
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Next Period</h2>
        
        {predictions ? (
          <div className="space-y-4">
            <div className="bg-pink-50 border-l-4 border-pink-500 p-4 rounded-r">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-pink-700">
                    {predictions.confidence === 'high' 
                      ? 'High confidence prediction based on your cycle history.'
                      : predictions.confidence === 'medium'
                        ? 'Medium confidence prediction. Add more data for better accuracy.'
                        : 'Low confidence prediction. Consider adding more cycle data.'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Starts</p>
                <p className="text-lg font-semibold">{formatDate(predictions.nextPeriodStart)}</p>
                <p className="text-sm text-gray-500">{getDaysAway(predictions.nextPeriodStart)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Ends</p>
                <p className="text-lg font-semibold">{formatDate(predictions.nextPeriodEnd)}</p>
                <p className="text-sm text-gray-500">{getDaysAway(predictions.nextPeriodEnd)}</p>
              </div>
            </div>
            
            {predictions.fertileWindow && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Fertile Window</p>
                <div className="flex items-center">
                  <div className="flex-1 bg-blue-50 rounded-lg p-3">
                    <p className="text-sm font-medium">
                      {formatDate(predictions.fertileWindow.start)} - {formatDate(predictions.fertileWindow.end)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {differenceInDays(parseISO(predictions.fertileWindow.end), parseISO(predictions.fertileWindow.start)) + 1} days
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No predictions yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Track your cycle for a few months to get accurate predictions.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={onAddEntry}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Period
              </button>
            </div>
          </div>
        )}
      </div>
      
      {stats.lastPeriodStart && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Last Period</h2>
          <div className="flex justify-between items-center">
            <div>
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
