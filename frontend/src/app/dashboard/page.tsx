'use client';

import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useFirebaseCycle } from '@/contexts/FirebaseCycleContext';
import { format, addDays } from 'date-fns';
import type { ChartData } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Import components
import { 
  WelcomeHeader, 
  QuickActions 
} from './components';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/* -------------------------
   Defaults & helpers
   ------------------------- */
const defaultCycleData = {
  cycleLength: 28,
  periodLength: 5,
  lastPeriodStart: new Date().toISOString().split('T')[0],
  predictions: {
    nextPeriod: format(addDays(new Date(), 28), 'yyyy-MM-dd'),
    fertileWindow: {
      start: format(addDays(new Date(), 12), 'yyyy-MM-dd'),
      end: format(addDays(new Date(), 17), 'yyyy-MM-dd'),
    },
    ovulation: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    predictedPeriodLength: 5,
    predictedCycleLength: 28,
  },
};

const calculateCycleDay = (lastPeriodStart: string | undefined, cycleLength: number) => {
  if (!lastPeriodStart) return 1;
  const lastPeriod = new Date(lastPeriodStart);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
  return (diffDays % cycleLength) + 1;
};

const getCyclePhase = (day: number, cycleLength: number) => {
  const phaseLengths = {
    menstrual: Math.max(1, Math.round(cycleLength * 0.18)),
    follicular: Math.max(1, Math.round(cycleLength * 0.32)),
    ovulation: Math.max(1, Math.round(cycleLength * 0.11)),
  };

  if (day <= phaseLengths.menstrual) return { name: 'Menstrual', color: 'bg-pink-100 text-pink-800' };
  if (day <= phaseLengths.menstrual + phaseLengths.follicular)
    return { name: 'Follicular', color: 'bg-blue-100 text-blue-800' };
  if (day <= phaseLengths.menstrual + phaseLengths.follicular + phaseLengths.ovulation)
    return { name: 'Ovulation', color: 'bg-purple-100 text-purple-800' };
  return { name: 'Luteal', color: 'bg-yellow-100 text-yellow-800' };
};

/* small debounce */
// This function is currently unused but kept for future use
// function debounce<F extends (...args: unknown[]) => void>(
//   fn: F, 
//   ms = 100
// ): (...args: Parameters<F>) => void {
//   let timeoutId: NodeJS.Timeout | null = null;
  
//   return (...args: Parameters<F>): void => {
//     if (timeoutId) {
//       clearTimeout(timeoutId);
//     }
//     timeoutId = setTimeout(() => fn(...args), ms);
//   };
// }

/* -------------------------
   Dashboard component
   ------------------------- */
function DashboardPage(): JSX.Element | null {
  const { user, loading: authLoading } = useAuth();
  const { 
    currentCycle, 
    healthLogs, 
    stats, 
    loading: cycleLoading, 
    refreshData 
  } = useFirebaseCycle();
  const router = useRouter();

  // states for stable rendering
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Chart container refs and size
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // combine loading
  const loading = Boolean(authLoading) || Boolean(cycleLoading);

  // Compute cycle data (memoized)
  const cycleData = useMemo(() => {
    const cycleLength = stats?.averageCycleLength ?? defaultCycleData.cycleLength;
    const periodLength = stats?.averagePeriodLength ?? defaultCycleData.periodLength;
    const lastPeriodStart = currentCycle?.startDate ?? defaultCycleData.lastPeriodStart;
    
    // Handle next period prediction which could be a string, object, or use a default
    const nextPeriod = (() => {
      // Try to get next period from stats.nextPeriodPrediction
      if (stats?.nextPeriodPrediction) {
        if (typeof stats.nextPeriodPrediction === 'string') {
          return stats.nextPeriodPrediction;
        } else if (stats.nextPeriodPrediction.start) {
          return stats.nextPeriodPrediction.start;
        }
      }
      
      // Try to get from nextPeriodStart if available
      if (stats?.nextPeriodStart) {
        return stats.nextPeriodStart;
      }
      
      // If we have a last period start, calculate based on average cycle length
      if (stats?.lastPeriodStart) {
        const lastPeriodDate = new Date(stats.lastPeriodStart);
        const nextPeriodDate = new Date(lastPeriodDate);
        nextPeriodDate.setDate(lastPeriodDate.getDate() + (stats.averageCycleLength || 28));
        return format(nextPeriodDate, 'yyyy-MM-dd');
      }
      
      // Fall back to default
      return defaultCycleData.predictions.nextPeriod;
    })();

    // Handle ovulation date
    const ovulation = stats?.fertileWindow?.ovulationDay ?? 
      (stats?.lastPeriodStart 
        ? format(addDays(new Date(stats.lastPeriodStart), 14), 'yyyy-MM-dd')
        : format(addDays(new Date(), 14), 'yyyy-MM-dd'));

    // Calculate fertile window based on ovulation
    const fertileWindow = {
      start: format(addDays(new Date(ovulation), -5), 'yyyy-MM-dd'),
      end: format(addDays(new Date(ovulation), 1), 'yyyy-MM-dd'),
    };

    const cycleDay = currentCycle?.startDate 
      ? calculateCycleDay(
          currentCycle.startDate,
          currentCycle.cycleLength || defaultCycleData.cycleLength
        )
      : 1;
    
    const cyclePhase = getCyclePhase(
      cycleDay,
      currentCycle?.cycleLength || defaultCycleData.cycleLength
    );
    
    return {
      cycleLength,
      periodLength,
      lastPeriodStart,
      nextPeriod,
      fertileWindow,
      ovulation,
      cycleDay,
      cyclePhase,
    };
  }, [currentCycle, stats]);

  // recent logs
  const recentLogs = useMemo(
    () =>
      [...(healthLogs || [])]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7)
        .reverse(),
    [healthLogs]
  );

  // upcoming events
  const upcomingEvents = useMemo(() => {
    const events: Array<{ date: string; title: string; icon: string; color: string }> = [];
    if (cycleData.nextPeriod) {
      events.push({ 
        date: cycleData.nextPeriod, 
        title: 'Next period expected', 
        icon: '', 
        color: 'bg-red-100 text-red-800' 
      });
    }
    if (cycleData.ovulation) {
      events.push({ 
        date: cycleData.ovulation, 
        title: 'Ovulation expected', 
        icon: '', 
        color: 'bg-purple-100 text-purple-800' 
      });
    }
    const today = new Date();
    const upcomingLogs = (healthLogs || []).filter((log: any) => {
      const logDate = new Date(log.date);
      return logDate >= today && logDate <= addDays(today, 7);
    });
    upcomingLogs.forEach((log: any) => {
      events.push({ 
        date: log.date, 
        title: log.notes || 'Health log entry', 
        icon: '', 
        color: 'bg-green-100 text-green-800' 
      });
    });
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [cycleData.nextPeriod, cycleData.ovulation, healthLogs]);

  // chart data - stable
  const chartData = useMemo<ChartData<'line', number[], string>>(() => {
    const defaultChartData: ChartData<'line', number[], string> = {
      labels: [],
      datasets: [
        {
          label: 'Mood (1-5)',
          data: [],
          borderColor: 'rgb(219, 39, 119)',
          backgroundColor: 'rgba(219, 39, 119, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Energy (1-5)',
          data: [],
          borderColor: 'rgb(124, 58, 237)',
          backgroundColor: 'rgba(124, 58, 237, 0.5)',
          tension: 0.3,
        },
      ],
    };

    if (!healthLogs || healthLogs.length === 0) return defaultChartData;

    const recent = [...healthLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);

    const moodData = recent.map((entry: HealthLog) => {
      const mood = entry.mood;
      if (typeof mood === 'string') {
        const moodMap: Record<string, number> = { 'Very Happy': 5, Happy: 4, Neutral: 3, Sad: 2, 'Very Sad': 1 };
        return moodMap[mood] ?? 3;
      }
      return Number(mood) || 3;
    });

    const energyData = recent.map((entry: HealthLog) => {
      const energy = entry.energy;
      if (typeof energy === 'string') {
        const energyMap: Record<string, number> = { 'Very High': 5, High: 4, Medium: 3, Low: 2, 'Very Low': 1 };
        return energyMap[energy] ?? 3;
      }
      return Number(energy) || 3;
    });

    return {
      labels: recent.map((entry: HealthLog) => format(new Date(entry.date), 'MMM d')),
      datasets: [
        { label: 'Mood (1-5)', data: moodData, borderColor: 'rgb(219, 39, 119)', backgroundColor: 'rgba(219, 39, 119, 0.5)', tension: 0.3 },
        { label: 'Energy (1-5)', data: energyData, borderColor: 'rgb(124, 58, 237)', backgroundColor: 'rgba(124, 58, 237, 0.5)', tension: 0.3 },
      ],
    };
  }, [healthLogs]);

  // Refresh handler - single-shot debounced
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // prefer an explicit fetch method on the context if provided
      if (refreshData) {
        await refreshData();
      } else {
        // fallback: Next.js router.refresh (may be no-op depending on data fetching)
        try {
          router.refresh();
        } catch (error) {
          console.error('Error during refresh:', error);
        }
      }
      // short delay so UI doesn't instantly flip
      await new Promise(res => setTimeout(res, 250));
    } finally {
      setIsRefreshing(false);
    }
  };

  // If not mounted or still loading, show skeleton that reserves space to avoid layout jumps
  if (!mounted || loading) {
    return <DashboardSkeleton />;
  }

  // If not authenticated after loading and mounted, redirect already triggered; return null to avoid flicker
  if (!user) return null;

  // Main render (chart receives stable numeric width/height)
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Welcome Header */}
          <WelcomeHeader 
            userName={user?.email?.split('@')[0] || 'User'}
            cyclePhase={cycleData.cyclePhase}
            cycleDay={cycleData.cycleDay}
            cycleLength={cycleData.cycleLength}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          {/* Quick Actions */}
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

/* -------------------------
   Skeleton (reserves same layout space)
   ------------------------- */
function DashboardSkeleton() {
  // Use same heights as main layout to avoid jumps
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6" style={{ height: 86 }} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white h-28 rounded-xl" />
          <div className="bg-white h-28 rounded-xl" />
          <div className="bg-white h-28 rounded-xl" />
          <div className="bg-white h-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white h-96 rounded-xl" />
          <div className="bg-white h-96 rounded-xl" />
        </div>
        <div className="bg-white rounded-xl h-96" />
      </div>
    </div>
  );
}

// Small icons / helpers
function DefaultIcon() {
  return (
    <svg className="h-8 w-8 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export { DefaultIcon };

export default DashboardPage;
