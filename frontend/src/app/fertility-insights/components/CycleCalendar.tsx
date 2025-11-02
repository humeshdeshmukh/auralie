'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Thermometer, Calendar as CalendarIcon, Info } from 'lucide-react';
import { CycleDay, FertilityEntry, FertilityStats } from '../types';

interface CycleCalendarProps {
  entries: FertilityEntry[];
  stats: FertilityStats;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function CycleCalendar({ entries, stats, selectedDate, onDateSelect }: CycleCalendarProps) {
  // start month follows selected date initially
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(selectedDate || new Date()));
  const [showHelp, setShowHelp] = useState(false);

  // keep calendar in sync if selectedDate changes externally
  useEffect(() => {
    if (selectedDate) setCurrentMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    // Align to full week (Sunday - Saturday)
    const startDay = start.getDay();
    const startDate = addDays(start, -startDay);

    const endDay = end.getDay();
    const endDate = addDays(end, 6 - endDay);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Day number calculation relative to nextPeriod; robust to missing stats
  const calculateDayNumber = (day: Date) => {
    if (!stats || !stats.nextPeriod || !stats.cycleLength) return NaN;
    const nextPeriod = new Date(stats.nextPeriod);
    const msPerDay = 24 * 60 * 60 * 1000;

    // normalize to UTC-midnight for both dates
    const dA = new Date(day);
    dA.setHours(0, 0, 0, 0);
    const dB = new Date(nextPeriod);
    dB.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((dA.getTime() - dB.getTime()) / msPerDay);
    const cycleLen = Number(stats.cycleLength) || 0;
    if (cycleLen <= 0) return NaN;

    const normalized = ((diffDays % cycleLen) + cycleLen) % cycleLen;
    return normalized + 1; // 1..cycleLen
  };

  const getEntryForDay = (day: Date) => {
    return entries.find(e => {
      try {
        return isSameDay(new Date(e.date), day);
      } catch {
        return false;
      }
    });
  };

  const getDayData = (day: Date): CycleDay => {
    const entry = getEntryForDay(day);
    const dayNumber = calculateDayNumber(new Date(day));
    const cycleLength = Number(stats?.cycleLength) || NaN;
    const fertileStart = stats?.fertileWindow?.start;
    const fertileEnd = stats?.fertileWindow?.end;
    const ovulationDay = Number(stats?.ovulationDay);
    const periodLength = Number(stats?.periodLength);

    const isFertile = !isNaN(dayNumber) && typeof fertileStart === 'number' && typeof fertileEnd === 'number'
      ? dayNumber >= fertileStart && dayNumber <= fertileEnd
      : false;

    const isOvulation = !isNaN(dayNumber) && !isNaN(ovulationDay) ? dayNumber === ovulationDay : false;
    const isPeriod = !isNaN(dayNumber) && !isNaN(periodLength) ? dayNumber <= periodLength : false;

    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isWeekend = [0, 6].includes(day.getDay());

    const symptoms = Array.isArray(entry?.symptoms) ? entry!.symptoms : [];
    const mood = entry?.mood ?? undefined;
    const temperature = typeof entry?.basalBodyTemp === 'number' ? entry!.basalBodyTemp : undefined;

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
      symptoms,
      mood,
      temperature,
      notes: entry?.notes,
      flowLevel: entry?.flowLevel || 'none',
      hasNotes: !!entry?.notes
    } as CycleDay;
  };

  // Use the original color class names from your first file: bg-primary, ring-primary, pink/purple/yellow scales
  const getDayClassName = (day: CycleDay) => {
    const classes = [
      'relative',
      'flex',
      'flex-col',
      'items-center',
      'justify-start',
      'p-2',
      'rounded-lg',
      'text-sm',
      'font-medium',
      'transition-all',
      'duration-200',
      'outline-none',
      'focus:ring-2',
      'w-full',
      'h-full',
      'min-h-[54px]'
    ];

    if (day.isSelected) {
      // original used `bg-primary` text-white
      classes.push('bg-primary', 'text-white', 'shadow-lg', 'ring-primary');
    } else if (day.isPeriod) {
      if (day.flowLevel === 'heavy') classes.push('bg-red-100', 'text-red-900');
      else if (day.flowLevel === 'medium') classes.push('bg-pink-100', 'text-pink-800');
      else classes.push('bg-pink-50', 'text-pink-700');
    } else if (day.isOvulation) {
      classes.push('bg-yellow-50', 'text-yellow-800', 'ring-2', 'ring-yellow-400');
    } else if (day.isFertile) {
      classes.push('bg-purple-50', 'text-purple-800');
    } else if (!day.isCurrentMonth) {
      classes.push('text-gray-300', 'bg-transparent', 'hover:bg-gray-50');
    } else if (day.isWeekend) {
      classes.push('bg-gray-50', 'text-gray-700');
    } else {
      classes.push('bg-white', 'text-gray-800');
    }

    if (day.isCurrentMonth) classes.push('border', 'border-gray-100');
    if (day.isToday) classes.push('ring-2', 'ring-primary');

    if (day.hasNotes) classes.push('font-semibold');

    return classes.join(' ');
  };

  const getTooltipContent = (day: Date, dayData: CycleDay) => {
    const parts: string[] = [];

    if (dayData.isPeriod) parts.push(`Period${dayData.flowLevel ? ` (${dayData.flowLevel} flow)` : ''}`);
    if (dayData.isOvulation) parts.push('Ovulation day');
    if (dayData.isFertile && !dayData.isPeriod) parts.push('Fertile window');
    if (typeof dayData.temperature === 'number') parts.push(`Temperature: ${dayData.temperature.toFixed(1)}°C`);
    if (dayData.mood !== undefined && dayData.mood !== null) {
      // don't assume mapping — show raw value
      parts.push(`Mood: ${dayData.mood}`);
    }
    if (dayData.symptoms?.length) {
      parts.push(`Symptoms: ${dayData.symptoms.join(', ')}`);
    }
    if (dayData.notes) parts.push(`Notes: ${dayData.notes}`);

    const header = format(day, 'EEEE, MMMM d, yyyy');
    return header + (parts.length ? ` — ${parts.join(' · ')}` : '');
  };

  const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const prevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    onDateSelect(today);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h3>
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
            <div className="h-8 w-px bg-gray-200" />
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

      {/* Weekday labels */}
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

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, index) => {
          const dayData = getDayData(day);

          return (
            <div key={`day-${index}`} className="relative group">
              <button
                onClick={() => onDateSelect(day)}
                className={getDayClassName(dayData)}
                title={getTooltipContent(day, dayData)}
                aria-label={`${format(day, 'EEEE, MMMM d, yyyy')}${!dayData.isCurrentMonth ? ' (not in current month)' : ''}`}
              >
                <div className="flex flex-col items-center w-full h-full">
                  <span className={`text-xs ${!dayData.isCurrentMonth ? 'opacity-40' : ''} ${dayData.isSelected ? 'text-white' : ''}`}>
                    {format(day, 'd')}
                  </span>

                  <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 w-full">
                    {/* Mood: display raw value if present (no demo mapping) */}
                    {typeof dayData.mood !== 'undefined' && dayData.mood !== null && (
                      <span className={`text-xs ${dayData.isSelected ? 'text-white' : 'text-yellow-600'}`}>
                        {String(dayData.mood)}
                      </span>
                    )}

                    {/* Temperature */}
                    {typeof dayData.temperature === 'number' && (
                      <span className="text-xs flex items-center text-blue-600">
                        <Thermometer className="h-3 w-3" />
                        <span className="text-[10px] ml-0.5">{dayData.temperature.toFixed(1)}°</span>
                      </span>
                    )}

                    {/* Symptoms: show bullets or raw symptom text (no mock icons) */}
                    {Array.isArray(dayData.symptoms) &&
                      dayData.symptoms.slice(0, 2).map((symptom, idx) => (
                        <span key={idx} className="text-xs" title={String(symptom)}>
                          •
                        </span>
                      ))}

                    {Array.isArray(dayData.symptoms) && dayData.symptoms.length > 2 && (
                      <span className="text-xs">+{dayData.symptoms.length - 2}</span>
                    )}

                    {/* Notes */}
                    {dayData.hasNotes && <span className="text-xs">📝</span>}
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
              <span className="w-3 h-3 rounded-full bg-pink-100 border border-pink-300 mr-1.5" />
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
                <li>Icons/indicators represent logged data (mood, temperature, symptoms)</li>
                <li>Hover over a date for more details</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
