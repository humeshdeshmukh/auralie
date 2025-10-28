'use client';

import { useEffect, useMemo } from 'react';
import { format, addDays, differenceInDays, isWithinInterval } from 'date-fns';

interface CycleData {
  id?: string;
  startDate: string;
  endDate?: string;
  cycleLength?: number;
  periodLength?: number;
  symptoms?: string[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isPeriodStart?: boolean;
  isPeriodEnd?: boolean;
  date?: string; // For entries
  flow?: string;
  mood?: string;
}

interface CycleStatusProps {
  currentCycle: CycleData | null;
  entries: CycleData[];
  onCycleStart?: (date: Date) => void;
  onCycleEnd?: (date: Date) => void;
}

function CycleStatus({ currentCycle, entries = [], onCycleStart, onCycleEnd }: CycleStatusProps) {
  // Calculate average cycle length from entries

  // Memoize the average cycle length calculation
  const averageCycleLength = useMemo(() => {
    if (entries.length <= 1) return 28; // Default to 28 days if not enough data

    const sortedEntries = [...entries]
      .filter(e => e.startDate && e.endDate)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

    if (sortedEntries.length <= 1) return 28;

    const lengths = [];
    for (let i = 1; i < sortedEntries.length; i++) {
      const prevEnd = new Date(sortedEntries[i - 1].endDate!);
      const currStart = new Date(sortedEntries[i].startDate!);
      const length = differenceInDays(currStart, prevEnd);
      if (length > 0) lengths.push(length);
    }

    return lengths.length > 0 
      ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
      : 28;
  }, [entries]);

  // Calculate cycle state using useMemo to avoid unnecessary recalculations
  const {
    day,
    nextPeriod,
    fertileWindow,
    ovulationDate,
    isFertile
  } = useMemo(() => {
    if (!currentCycle?.startDate) {
      return {
        day: null as number | null,
        nextPeriod: null as Date | null,
        fertileWindow: null as { start: Date; end: Date } | null,
        ovulationDate: null as Date | null,
        isFertile: false,
        averageLength: averageCycleLength
      };
    }

    const startDate = new Date(currentCycle.startDate);
    const today = new Date();
    const cycleLength = currentCycle.cycleLength || averageCycleLength;
    
    // Calculate current cycle day (1-based)
    const dayInCycle = differenceInDays(today, startDate) + 1;
    
    // Calculate next period date
    const nextPeriodDate = addDays(startDate, cycleLength);
    
    // Calculate ovulation (typically around day 14 of a 28-day cycle)
    const ovulationDay = Math.floor(cycleLength * 0.5);
    const ovulation = addDays(startDate, ovulationDay);
    
    // Calculate fertile window (typically 5 days before ovulation to 1 day after)
    const fertileWindowStart = addDays(ovulation, -5);
    const fertileWindowEnd = addDays(ovulation, 1);
    
    return {
      day: dayInCycle > 0 ? dayInCycle : null,
      nextPeriod: nextPeriodDate,
      fertileWindow: { start: fertileWindowStart, end: fertileWindowEnd },
      ovulationDate: ovulation,
      isFertile: isWithinInterval(today, { start: fertileWindowStart, end: fertileWindowEnd }),
      averageLength: averageCycleLength
    };
  }, [currentCycle, averageCycleLength]);

  // Handle cycle start/end based on entries
  useEffect(() => {
    if (!entries.length || (!onCycleStart && !onCycleEnd)) return;

    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime()
    );

    const mostRecentEntry = sortedEntries[sortedEntries.length - 1];
    
    if (mostRecentEntry.isPeriodStart && onCycleStart && mostRecentEntry.date) {
      onCycleStart(new Date(mostRecentEntry.date));
    } else if (mostRecentEntry.isPeriodEnd && onCycleEnd && mostRecentEntry.date) {
      onCycleEnd(new Date(mostRecentEntry.date));
    }
  }, [entries, onCycleStart, onCycleEnd]);

  const cyclePhase = useMemo(() => {
    if (!currentCycle?.startDate) return 'Not tracking';
    
    const startDate = new Date(currentCycle.startDate);
    const today = new Date();
    
    if (currentCycle.endDate) {
      return 'In between cycles';
    }
    
    const day = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return `Day ${day} of cycle`;
  }, [currentCycle]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Cycle Status</h2>
          <p className="text-sm text-gray-500">
            {currentCycle?.startDate 
              ? `Started on ${format(new Date(currentCycle.startDate), 'MMM d, yyyy')}`
              : cyclePhase}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          isFertile ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {isFertile ? 'Fertile Window' : 'Not Fertile'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Cycle Day</p>
            <p className="text-3xl font-bold">{day || '--'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Next Period</p>
            <p className="text-xl font-semibold">
              {nextPeriod ? format(nextPeriod, 'MMM d, yyyy') : '--'}
            </p>
            {nextPeriod && (
              <p className="text-sm text-gray-500">
                in {Math.ceil(differenceInDays(nextPeriod, new Date()))} days
              </p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Ovulation</p>
            <p className="text-xl font-semibold">
              {ovulationDate ? format(ovulationDate, 'MMM d, yyyy') : '--'}
            </p>
            {ovulationDate && (
              <p className="text-sm text-gray-500">
                {isWithinInterval(new Date(), {
                  start: addDays(ovulationDate, -1),
                  end: addDays(ovulationDate, 1)
                }) ? (
                  'Today is around ovulation'
                ) : differenceInDays(ovulationDate, new Date()) > 0 ? (
                  `in ${differenceInDays(ovulationDate, new Date())} days`
                ) : (
                  'Passed'
                )}
              </p>
            )}
          </div>
          {fertileWindow && (
            <div>
              <p className="text-sm text-gray-500">Fertile Window</p>
              <p className="text-lg font-semibold">
                {format(fertileWindow.start, 'MMM d')} - {format(fertileWindow.end, 'MMM d')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CycleStatus;
