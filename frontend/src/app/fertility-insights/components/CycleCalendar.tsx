'use client';

import { useState, useMemo } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Thermometer, Calendar as CalendarIcon, Info } from 'lucide-react';
import { CycleDay, FertilityEntry, FertilityStats } from '../types';

const moodEmojis = ['😢', '🙁', '😐', '🙂', '😊'];
const symptomIcons: Record<string, string> = {
  'cramps': '💢',
  'bloating': '🎈',
  'headache': '🤕',
  'nausea': '🤢',
  'fatigue': '😴',
  'mood_swings': '😵‍💫',
  'breast_tenderness': '💝',
  'acne': '🌟',
  'cervical_mucus': '💧',
  'spotting': '🔴',
};

interface CycleCalendarProps {
  entries: FertilityEntry[];
  stats: FertilityStats;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function CycleCalendar({ entries, stats, selectedDate, onDateSelect }: CycleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showHelp, setShowHelp] = useState(false);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    // Add days from previous month to start the week on Sunday
    const startDay = start.getDay(); // 0 = Sunday
    const startDate = addDays(start, -startDay);
    
    // Add days from next month to complete the last week
    const endDay = end.getDay();
    const endDate = addDays(end, 6 - endDay);
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const getDayData = (day: Date): CycleDay => {
    const entry = entries.find(e => isSameDay(new Date(e.date), day));
    const dayNumber = Math.floor((day.getTime() - new Date(stats.nextPeriod).getTime()) / (1000 * 60 * 60 * 24) + stats.cycleLength) % stats.cycleLength || stats.cycleLength;
    
    const isFertile = dayNumber >= stats.fertileWindow.start && dayNumber <= stats.fertileWindow.end;
    const isOvulation = dayNumber === stats.ovulationDay;
    const isPeriod = dayNumber <= stats.periodLength;
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isWeekend = [0, 6].includes(day.getDay());

    return {
      date: day.toISOString(),
      dayNumber,
      isToday: isToday(day),
      isSelected: isSameDay(day, selectedDate),
      isPeriod,
      isFertile,
      isOvulation,
      isCurrentMonth,
      isWeekend,
      symptoms: entry?.symptoms || [],
      mood: entry?.mood,
      temperature: entry?.basalBodyTemp,
      notes: entry?.notes,
      flowLevel: entry?.flowLevel || 'none',
      hasNotes: !!entry?.notes
    };
  };

  const getDayClassName = (day: CycleDay) => {
    const baseClasses = [
      'relative h-14 w-10 md:h-16 md:w-12 flex flex-col items-center justify-start p-1 rounded-lg text-sm font-medium transition-all duration-200',
      'border border-transparent',
      'hover:shadow-md hover:scale-105 hover:z-10',
      'focus:outline-none focus:ring-2 focus:ring-primary/50',
      'transition-all duration-200',
    ];

    // Text and background colors based on state
    if (day.isSelected) {
      baseClasses.push('bg-primary text-white shadow-lg');
    } else if (day.isPeriod) {
      baseClasses.push(day.flowLevel === 'heavy' ? 'bg-red-100 text-red-900' : 
                      day.flowLevel === 'medium' ? 'bg-pink-100 text-pink-800' :
                      'bg-pink-50 text-pink-700');
    } else if (day.isOvulation) {
      baseClasses.push('bg-yellow-50 text-yellow-800 ring-2 ring-yellow-400');
    } else if (day.isFertile) {
      baseClasses.push('bg-purple-50 text-purple-800');
    } else if (!day.isCurrentMonth) {
      baseClasses.push('text-gray-300 hover:bg-gray-50');
    } else if (day.isWeekend) {
      baseClasses.push('bg-gray-50 text-gray-700');
    } else {
      baseClasses.push('bg-white text-gray-800');
    }

    // Add border for current month
    if (day.isCurrentMonth) {
      baseClasses.push('border-gray-200');
    }

    // Add highlight for today
    if (day.isToday) {
      baseClasses.push('ring-2 ring-primary');
    }

    // Add indicator for notes
    if (day.hasNotes) {
      baseClasses.push('font-bold');
    }

    return baseClasses.join(' ');
  };

  const getTooltipContent = (day: Date, dayData: CycleDay) => {
    const parts = [];
    
    if (dayData.isPeriod) {
      parts.push(`Period${dayData.flowLevel ? ` (${dayData.flowLevel} flow)` : ''}`);
    }
    if (dayData.isOvulation) {
      parts.push('Ovulation day');
    }
    if (dayData.isFertile && !dayData.isPeriod) {
      parts.push('Fertile window');
    }
    if (dayData.temperature) {
      parts.push(`Temperature: ${dayData.temperature.toFixed(1)}°C`);
    }
    if (dayData.mood) {
      const moods = ['Very Low', 'Low', 'Neutral', 'Good', 'Great'];
      parts.push(`Mood: ${moods[dayData.mood - 1]}`);
    }
    if (dayData.symptoms.length > 0) {
      parts.push(`Symptoms: ${dayData.symptoms.map(s => s.replace(/_/g, ' ')).join(', ')}`);
    }
    if (dayData.notes) {
      parts.push(`Notes: ${dayData.notes}`);
    }
    
    return `${format(day, 'EEEE, MMMM d, yyyy')}\n\n${parts.join('\n')}`;
  };

  const nextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    onDateSelect(new Date());
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            Today
          </button>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-gray-50 text-gray-600 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="h-8 w-px bg-gray-200"></div>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-gray-50 text-gray-600 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div 
            key={i} 
            className={`text-center text-xs font-semibold py-1 ${i === 0 || i === 6 ? 'text-red-500' : 'text-gray-500'}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, index) => {
          const dayData = getDayData(day);
          
          return (
                <div key={`day-${index}`} className="relative group">
                  <button
                    onClick={() => onDateSelect(day)}
                    className={getDayClassName(dayData)}
                    title={getTooltipContent(day, dayData)}
                    aria-label={`${format(day, 'EEEE, MMMM d, yyyy')}${!dayData.isCurrentMonth ? ' (not in current month)' : ''}${dayData.isPeriod ? ', period day' : ''}${dayData.isFertile ? ', fertile day' : ''}${dayData.isOvulation ? ', ovulation day' : ''}`}
                  >
                  <div className="flex flex-col items-center w-full h-full">
                    <span className={`text-xs ${!dayData.isCurrentMonth ? 'opacity-40' : ''} ${dayData.isSelected ? 'text-white' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    
                    <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 w-full">
                      {/* Mood */}
                      {dayData.mood && (
                        <span className={`text-xs ${dayData.isSelected ? 'text-white' : 'text-yellow-600'}`}>
                          {moodEmojis[dayData.mood - 1]}
                        </span>
                      )}
                      
                      {/* Temperature */}
                      {dayData.temperature && (
                        <span className="text-xs flex items-center text-blue-600">
                          <Thermometer className="h-3 w-3" />
                          <span className="text-[10px] ml-0.5">{dayData.temperature.toFixed(1)}°</span>
                        </span>
                      )}
                      
                      {/* Symptoms */}
                      {dayData.symptoms.slice(0, 2).map((symptom, idx) => (
                        <span key={idx} className="text-xs">
                          {symptomIcons[symptom] || '•'}
                        </span>
                      ))}
                      
                      {/* More symptoms indicator */}
                      {dayData.symptoms.length > 2 && (
                        <span className="text-xs">+{dayData.symptoms.length - 2}</span>
                      )}
                      
                      {/* Notes indicator */}
                      {dayData.hasNotes && (
                        <span className="text-xs">📝</span>
                      )}
                    </div>
                  </div>
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                    {format(day, 'MMM d')}
                  </div>
                </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
          <div className="flex flex-col items-center">
            <div className="flex items-center mb-1">
              <span className="w-3 h-3 rounded-full bg-pink-100 border border-pink-300 mr-1.5"></span>
              <span>Period</span>
            </div>
            <div className="flex gap-1 text-[10px] text-gray-400">
              <span className="px-1 bg-pink-50">L</span>
              <span className="px-1 bg-pink-100">M</span>
              <span className="px-1 bg-pink-200">H</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-purple-50 border border-purple-200 mr-1.5"></span>
            <span>Fertile</span>
          </div>
          
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-yellow-50 border-2 border-yellow-400 mr-1.5"></span>
            <span>Ovulation</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-blue-500 mr-1.5">🌡️</span>
            <span>Temp</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-yellow-500 mr-1.5">😊</span>
            <span>Mood</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-green-500 mr-1.5">📝</span>
            <span>Notes</span>
          </div>
        </div>
        
        <div className="mt-3 text-center">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="inline-flex items-center text-xs text-gray-500 hover:text-primary transition-colors"
          >
            <Info className="h-3.5 w-3.5 mr-1" />
            How to use this calendar
          </button>
          
          {showHelp && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg text-left text-xs text-gray-700">
              <p className="font-medium mb-1">Calendar Guide:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>Click on any date to view or log symptoms, mood, and notes</li>
                <li>Color intensity shows period flow level (Light, Medium, Heavy)</li>
                <li>Icons represent logged data (mood, temperature, symptoms)</li>
                <li>Hover over a date for more details</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
