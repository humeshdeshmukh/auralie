'use client';

import { useState, useMemo } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CycleDay, FertilityEntry, FertilityStats } from '../types';

interface CycleCalendarProps {
  entries: FertilityEntry[];
  stats: FertilityStats;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function CycleCalendar({ entries, stats, selectedDate, onDateSelect }: CycleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  const getDayData = (day: Date): CycleDay => {
    const entry = entries.find(e => isSameDay(new Date(e.date), day));
    const dayNumber = Math.floor((day.getTime() - new Date(stats.nextPeriod).getTime()) / (1000 * 60 * 60 * 24) + stats.cycleLength) % stats.cycleLength || stats.cycleLength;
    
    const isFertile = dayNumber >= stats.fertileWindow.start && dayNumber <= stats.fertileWindow.end;
    const isOvulation = dayNumber === stats.ovulationDay;
    const isPeriod = dayNumber <= stats.periodLength;

    return {
      date: day.toISOString(),
      dayNumber,
      isToday: isToday(day),
      isSelected: isSameDay(day, selectedDate),
      isPeriod,
      isFertile,
      isOvulation,
      symptoms: entry?.symptoms || [],
      mood: entry?.mood,
      temperature: entry?.basalBodyTemp,
      notes: entry?.notes
    };
  };

  const getDayClassName = (day: CycleDay) => {
    let classes = [
      'h-12 w-12 flex items-center justify-center rounded-full text-sm font-medium',
      day.isToday ? 'border-2 border-primary' : '',
      day.isSelected ? 'bg-primary text-white' : '',
      !day.isSelected && day.isPeriod ? 'bg-pink-100 text-pink-800' : '',
      !day.isSelected && day.isFertile && !day.isPeriod ? 'bg-purple-50 text-purple-800' : '',
      day.isOvulation ? 'ring-2 ring-yellow-400' : '',
      !isSameMonth(day.date, currentMonth) ? 'text-gray-400' : 'hover:bg-gray-100',
    ];

    return classes.filter(Boolean).join(' ');
  };

  const nextMonth = () => {
    setCurrentMonth(addDays(startOfMonth(currentMonth), 32));
  };

  const prevMonth = () => {
    setCurrentMonth(addDays(startOfMonth(currentMonth), -1));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={prevMonth}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, i) => {
          const dayData = getDayData(day);
          return (
            <button
              key={day.toString()}
              onClick={() => onDateSelect(day)}
              className={getDayClassName(dayData)}
              aria-label={`Day ${dayData.dayNumber}${dayData.isPeriod ? ', period day' : ''}${dayData.isFertile ? ', fertile day' : ''}${dayData.isOvulation ? ', ovulation day' : ''}`}
            >
              {format(day, 'd')}
              {dayData.mood && (
                <span className="absolute bottom-0.5 text-xs">
                  {['😢', '🙁', '😐', '🙂', '😊'][dayData.mood - 1]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-pink-100 mr-1"></span>
          <span>Period</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-purple-50 mr-1"></span>
          <span>Fertile</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full ring-2 ring-yellow-400 mr-1"></span>
          <span>Ovulation</span>
        </div>
      </div>
    </div>
  );
}
