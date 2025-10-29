'use client';

import { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isWithinInterval,
  parseISO,
  startOfWeek,
  endOfWeek,
  isSameMonth
} from 'date-fns';
import { CycleEntry, CyclePrediction } from '../types';

interface CycleCalendarProps {
  entries: CycleEntry[];
  predictions: CyclePrediction | null;
  onSelectDate: (date: string) => void;
}

export default function CycleCalendar({ entries, predictions, onSelectDate }: CycleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  // Calculate days in month for reference (not used directly, but keeping for potential future use)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the start of the week for the first day of the month
  const startOfFirstWeek = startOfWeek(monthStart, { weekStartsOn: 0 });
  
  // Get the end of the week for the last day of the month
  const endOfLastWeek = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  // Get all days to display in the calendar (including days from previous/next month)
  const calendarDays = eachDayOfInterval({ start: startOfFirstWeek, end: endOfLastWeek });

  // Check if a date is within a period with proper null/undefined checks
  const isDateInPeriod = (date: Date, startDate: string | undefined, endDate: string | undefined) => {
    if (!startDate || !endDate) return false;
    
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      return isWithinInterval(date, { start, end });
    } catch (error) {
      console.error('Error parsing dates:', error);
      return false;
    }
  };

  // Check if a date is a predicted period with null checks
  const isPredictedPeriod = (date: Date) => {
    if (!predictions?.nextPeriodStart || !predictions?.nextPeriodEnd) return false;
    return isDateInPeriod(date, predictions.nextPeriodStart, predictions.nextPeriodEnd);
  };

  // Check if a date is in the fertile window
  const isFertileWindow = (date: Date) => {
    if (!predictions?.fertileWindow) return false;
    return isDateInPeriod(date, predictions.fertileWindow.start, predictions.fertileWindow.end);
  };

  // Check if a date is ovulation day
  const isOvulationDay = (date: Date) => {
    if (!predictions?.ovulationDate) return false;
    return isSameDay(parseISO(predictions.ovulationDate), date);
  };

  // Get the entry for a specific date (check both start and end dates)
  const getEntryForDate = (date: Date) => {
    return entries.find(entry => {
      const startDate = parseISO(entry.startDate);
      const endDate = entry.endDate ? parseISO(entry.endDate) : startDate;
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  };

  // Get the background color for a date
  const getDateBackground = (date: Date) => {
    const entry = getEntryForDate(date);
    
    // Show actual entry first
    if (entry) {
      if (entry.flowLevel === 'heavy') return 'bg-red-100 border-red-400';
      if (entry.flowLevel === 'medium') return 'bg-red-50 border-red-300';
      if (entry.flowLevel === 'light') return 'bg-pink-50 border-pink-200';
      if (entry.flowLevel === 'spotting') return 'bg-pink-100 border-pink-200 border-dashed';
      return 'bg-green-50 border-green-200'; // Default for entries without flow level
    }
    
    // Then show predictions for future dates only
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date >= today) {
      if (isPredictedPeriod(date)) return 'bg-pink-50 border-pink-200 border-dashed';
      if (isFertileWindow(date)) return 'bg-blue-50 border-blue-200';
      if (isOvulationDay(date)) return 'bg-purple-100 border-purple-400';
    }
    
    return 'bg-white border-gray-200';
  };

  // Get the text color for a date
  const getDateTextColor = (date: Date) => {
    if (!isSameMonth(date, currentDate)) return 'text-gray-300';
    if (isToday(date)) return 'text-blue-600 font-bold';
    
    const entry = getEntryForDate(date);
    if (entry) {
      if (entry.flowLevel === 'heavy') return 'text-red-800 font-medium';
      if (entry.flowLevel === 'medium') return 'text-red-700';
      if (entry.flowLevel === 'light') return 'text-pink-700';
      if (entry.flowLevel === 'spotting') return 'text-pink-600';
      return 'text-green-700';
    }
    
    return 'text-gray-700';
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    onSelectDate(format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Next month"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date: Date) => {
          const entry = getEntryForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          
          return (
            <button
              key={date.toString()}
              onClick={() => handleDateClick(date)}
              className={`
                relative h-24 p-1 text-left text-sm border rounded-md transition-colors
                ${getDateBackground(date)} 
                ${getDateTextColor(date)}
                ${!isCurrentMonth ? 'opacity-50' : 'hover:bg-gray-50'}
                ${isToday(date) ? 'ring-2 ring-blue-400' : ''}
              `}
              disabled={!isCurrentMonth}
            >
              <div className="flex justify-between">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday(date) ? 'bg-blue-600 text-white' : ''}`}>
                  {format(date, 'd')}
                </span>
                {entry && (
                  <span className="text-xs text-gray-500">
                    {entry.flowLevel && entry.flowLevel.charAt(0).toUpperCase() + entry.flowLevel.slice(1)}
                  </span>
                )}
              </div>
              
              {entry?.symptoms && entry.symptoms.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {entry.symptoms.slice(0, 2).map((symptom, i) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                      {symptom}
                    </span>
                  ))}
                  {entry.symptoms.length > 2 && (
                    <span className="text-xs text-gray-500">+{entry.symptoms.length - 2}</span>
                  )}
                </div>
              )}
              
              {isOvulationDay(date) && (
                <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-purple-500"></div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-red-400 mr-1"></span>
          <span>Period</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full border-2 border-dashed border-pink-300 mr-1"></span>
          <span>Predicted</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-blue-100 mr-1"></span>
          <span>Fertile</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-purple-100 mr-1"></span>
          <span>Ovulation</span>
        </div>
      </div>
    </div>
  );
}

// These helper functions are no longer needed as we're using date-fns functions directly
