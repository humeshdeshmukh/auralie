'use client';

import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  StatsCards, 
  HealthOverview, 
  UpcomingEvents, 
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
  const [mounted, setMounted] = useState(false); // true after client layout mount
  const didRedirectRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Chart container refs and size
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 300 });

  // Update chart size on window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current) {
        setChartSize({
          width: chartContainerRef.current.offsetWidth,
          height: 300,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // combine loading
  const loading = Boolean(authLoading) || Boolean(cycleLoading);

  // ensure we only run redirect once and after mount+loading settled
  useLayoutEffect(() => {
    // mark client-mounted to avoid hydration mismatch
    setMounted(true);
  }, []);

  useEffect(() => {
    // wait until loaders finished and we are mounted
    if (!mounted) return;
    if (authLoading || cycleLoading) return;

    if (!user && !didRedirectRef.current) {
      didRedirectRef.current = true;
      // use replace to avoid back-button weirdness
      router.replace('/login');
    }
  }, [authLoading, cycleLoading, user, router, mounted]);

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

  // Chart options: responsive false + animation disabled (stable)
  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart' as const, // Use const assertion for literal type
      },
      plugins: {
        legend: { position: 'top' as const },
        tooltip: { mode: 'index' as const, intersect: false },
        title: { display: true, text: 'Mood and Energy Trends' },
      },
      scales: {
        y: {
          min: 1,
          max: 5,
          ticks: { stepSize: 1 },
        },
      },
    }),
    []
  );

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
        {/* Welcome Header */}
        <WelcomeHeader 
          userName={user?.email?.split('@')[0] || 'User'}
          cyclePhase={cycleData.cyclePhase}
          cycleDay={cycleData.cycleDay}
          cycleLength={cycleData.cycleLength}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Stats Cards */}
        <StatsCards 
          cycleDay={cycleData.cycleDay}
          nextPeriod={cycleData.nextPeriod}
          cycleLength={cycleData.cycleLength}
          periodLength={cycleData.periodLength}
        />

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Health Overview (Chart + Recent Symptoms) */}
          <HealthOverview 
            chartData={chartData}
            chartOptions={chartOptions}
            chartSize={chartSize}
            recentLogs={recentLogs}
            chartContainerRef={chartContainerRef}
          />

          {/* Right Sidebar */}
          <div className="space-y-6">
            <UpcomingEvents events={upcomingEvents} />
            <QuickActions />
          </div>
        </div>

        {/* Cycle Tracking & Recent Logs */}
        <CycleAndLogs cycleData={cycleData} recentLogs={recentLogs} />
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

/* -------------------------
   Cycle + Logs chunk extracted
   ------------------------- */
interface CycleData {
  cycleDay: number;
  cycleLength: number;
  periodLength: number;
  lastPeriodStart: string;
  cyclePhase: {
    name: string;
    color: string;
  };
  nextPeriod: string | null;
  ovulation: string | null;
  fertileWindow: {
    start: string;
    end: string;
  };
}

interface HealthLog {
  date: string;
  mood: number;
  energy: number;
  symptoms?: string[];
  notes?: string;
}

function CycleAndLogs({ cycleData, recentLogs = [] }: { cycleData: CycleData; recentLogs?: HealthLog[] }) {
  const { cycleDay, cycleLength } = cycleData;
  
  // Ensure recentLogs is always an array and handle undefined/null cases
  const safeRecentLogs = Array.isArray(recentLogs) ? recentLogs : [];
  
  // Calculate cycle progress
  const cycleProgress = Math.min(100, Math.round((cycleDay / cycleLength) * 100));
  
  // Calculate phase progress
  const phaseInfo = (() => {
    const phaseLengths = {
      menstrual: Math.max(1, Math.round(cycleLength * 0.18)),
      follicular: Math.max(1, Math.round(cycleLength * 0.32)),
      ovulation: Math.max(1, Math.round(cycleLength * 0.11)),
    };
    
    if (cycleDay <= phaseLengths.menstrual) {
      return {
        name: 'Menstrual',
        color: 'bg-pink-500',
        progress: Math.min(100, Math.round((cycleDay / phaseLengths.menstrual) * 100)),
        daysLeft: phaseLengths.menstrual - cycleDay + 1,
      };
    } else if (cycleDay <= phaseLengths.menstrual + phaseLengths.follicular) {
      const dayInPhase = cycleDay - phaseLengths.menstrual;
      return {
        name: 'Follicular',
        color: 'bg-blue-500',
        progress: Math.min(100, Math.round((dayInPhase / phaseLengths.follicular) * 100)),
        daysLeft: phaseLengths.menstrual + phaseLengths.follicular - cycleDay + 1,
      };
    } else if (cycleDay <= phaseLengths.menstrual + phaseLengths.follicular + phaseLengths.ovulation) {
      const dayInPhase = cycleDay - (phaseLengths.menstrual + phaseLengths.follicular);
      return {
        name: 'Ovulation',
        color: 'bg-purple-500',
        progress: Math.min(100, Math.round((dayInPhase / phaseLengths.ovulation) * 100)),
        daysLeft: phaseLengths.menstrual + phaseLengths.follicular + phaseLengths.ovulation - cycleDay + 1,
      };
    } else {
      const dayInPhase = cycleDay - (phaseLengths.menstrual + phaseLengths.follicular + phaseLengths.ovulation);
      const lutealLength = cycleLength - (phaseLengths.menstrual + phaseLengths.follicular + phaseLengths.ovulation);
      return {
        name: 'Luteal',
        color: 'bg-yellow-500',
        progress: Math.min(100, Math.round((dayInPhase / lutealLength) * 100)),
        daysLeft: cycleLength - cycleDay + 1,
      };
    }
  })();

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Cycle Tracking</h3>
          <a href="/cycle-tracking" className="text-sm font-medium text-pink-600 hover:text-pink-700">
            View details &rarr;
          </a>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Day {cycleDay} of {cycleLength}</span>
            <span>{phaseInfo.name} Phase ({phaseInfo.progress}%)</span>
          </div>
          
          <div className="mt-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Recent Health Logs</h4>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mood</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Energy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symptoms</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {safeRecentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No health logs found. <Link href="/health-log/new" className="text-pink-600 hover:underline">Add your first log</Link>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No health logs found. <Link href="/health-log/new" className="text-pink-600 hover:underline">Add your first log</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <Link href="/health-log/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add New Log
            </Link>
          </div>
        </div>
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
