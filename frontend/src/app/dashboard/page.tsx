'use client';

import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCycle } from '@/contexts/CycleContext';
import Link from 'next/link';
import { format, addDays, isToday, isBefore, isAfter } from 'date-fns';
import { Line } from 'react-chartjs-2';
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
function debounce<F extends (...args: any[]) => void>(fn: F, ms = 100) {
  let t: any;
  return (...args: Parameters<F>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* -------------------------
   Dashboard component
   ------------------------- */
export default function DashboardPage(): JSX.Element | null {
  const { user, loading: authLoading } = useAuth();
  const cycleCtx = (useCycle() as any) || {};
  const { currentCycle, healthLogs = [], predictions, stats, loading: cycleLoading } = cycleCtx;
  const router = useRouter();

  // states for stable rendering
  const [mounted, setMounted] = useState(false); // true after client layout mount
  const didRedirectRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Chart container refs and size
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState<{ width: number; height: number }>(() => ({ width: 700, height: 256 }));

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

  // Setup ResizeObserver (debounced) to set chart size once and update rarely
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const updateSize = () => {
      const node = chartContainerRef.current!;
      const rect = node.getBoundingClientRect();
      // read sizes in whole pixels to be stable
      const newW = Math.max(400, Math.round(rect.width));
      const newH = 256; // keep a stable height
      // Only update when changed to avoid re-renders
      setChartSize(prev => (prev.width !== newW || prev.height !== newH ? { width: newW, height: newH } : prev));
    };

    updateSize();
    const obs = new ResizeObserver(debounce(updateSize, 120));
    obs.observe(chartContainerRef.current);

    return () => obs.disconnect();
  }, [chartContainerRef.current]);

  // Compute cycle data (memoized)
  const cycleData = useMemo(() => {
    const cycleLength = stats?.averageCycleLength ?? defaultCycleData.cycleLength;
    const periodLength = stats?.averagePeriodLength ?? defaultCycleData.periodLength;
    const lastPeriodStart = currentCycle?.startDate ?? defaultCycleData.lastPeriodStart;
    const nextPeriod = predictions?.nextPeriod ?? defaultCycleData.predictions.nextPeriod;
    const fertileWindow = predictions?.fertileWindow ?? defaultCycleData.predictions.fertileWindow;
    const ovulation = predictions?.ovulation ?? defaultCycleData.predictions.ovulation;

    const cycleDay = calculateCycleDay(lastPeriodStart, cycleLength);
    const cyclePhase = getCyclePhase(cycleDay, cycleLength);

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
  }, [currentCycle, predictions, stats]);

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
      events.push({ date: cycleData.nextPeriod, title: 'Next period expected', icon: '🩸', color: 'bg-red-100 text-red-800' });
    }
    if (cycleData.ovulation) {
      events.push({ date: cycleData.ovulation, title: 'Ovulation expected', icon: '🥚', color: 'bg-purple-100 text-purple-800' });
    }
    const today = new Date();
    const upcomingLogs = (healthLogs || []).filter((log: any) => {
      const logDate = new Date(log.date);
      return logDate >= today && logDate <= addDays(today, 7);
    });
    upcomingLogs.forEach((log: any) => {
      events.push({ date: log.date, title: log.notes || 'Health log entry', icon: '📝', color: 'bg-green-100 text-green-800' });
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

    const moodData = recent.map((entry: any) => {
      const mood = entry.mood;
      if (typeof mood === 'string') {
        const moodMap: Record<string, number> = { 'Very Happy': 5, Happy: 4, Neutral: 3, Sad: 2, 'Very Sad': 1 };
        return moodMap[mood] ?? 3;
      }
      return Number(mood) || 3;
    });

    const energyData = recent.map((entry: any) => {
      const energy = entry.energy;
      if (typeof energy === 'string') {
        const energyMap: Record<string, number> = { 'Very High': 5, High: 4, Medium: 3, Low: 2, 'Very Low': 1 };
        return energyMap[energy] ?? 3;
      }
      return Number(energy) || 3;
    });

    return {
      labels: recent.map((entry: any) => format(new Date(entry.date), 'MMM d')),
      datasets: [
        { label: 'Mood (1-5)', data: moodData, borderColor: 'rgb(219, 39, 119)', backgroundColor: 'rgba(219, 39, 119, 0.5)', tension: 0.3 },
        { label: 'Energy (1-5)', data: energyData, borderColor: 'rgb(124, 58, 237)', backgroundColor: 'rgba(124, 58, 237, 0.5)', tension: 0.3 },
      ],
    };
  }, [healthLogs]);

  // Chart options: responsive false + animation disabled (stable)
  const chartOptions = useMemo(
    () => ({
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { position: 'top' as const },
        tooltip: { mode: 'index' as const, intersect: false },
        title: { display: true, text: 'Mood & Energy Trends' },
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
      if (cycleCtx && typeof cycleCtx.fetchLatest === 'function') {
        await cycleCtx.fetchLatest();
      } else if (cycleCtx && typeof cycleCtx.refresh === 'function') {
        await cycleCtx.refresh();
      } else {
        // fallback: Next.js router.refresh (may be no-op depending on data fetching)
        try {
          router.refresh();
        } catch (e) {
          /* ignore */
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
        {/* Welcome + Refresh */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome back, {user?.email?.split('@')[0] ?? 'User'}! 👋</h2>
              <p className="text-gray-600">Here&apos;s what&apos;s happening with your health today.</p>
            </div>

            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${cycleData.cyclePhase.color} mr-2`}>
                {cycleData.cyclePhase.name} Phase
              </span>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 mr-2">
                Day {cycleData.cycleDay} of {cycleData.cycleLength}
              </span>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border text-sm shadow-sm hover:shadow-md"
                title="Refresh data"
              >
                {isRefreshing ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <span className="text-xs">Refreshing...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d="M20 7v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 17a8 8 0 0113-6.32L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-xs">Refresh</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <MemoStatCard title="Cycle Day" value={`${cycleData.cycleDay}`} />
          <MemoStatCard title="Next Period" value={cycleData.nextPeriod ? format(new Date(cycleData.nextPeriod), 'MMM d') : '--'} />
          <MemoStatCard title="Cycle Length" value={`${cycleData.cycleLength} days`} />
          <MemoStatCard title="Period Length" value={`${cycleData.periodLength} days`} />
        </div>

        {/* Health Overview (Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Health Trends</h3>

              {/* Chart container - fixed height + measured width */}
              <div ref={chartContainerRef} className="w-full" style={{ height: chartSize.height }}>
                {/* Pass stable numeric width/height to chart and disable responsive */}
                <Line options={chartOptions as any} data={chartData} width={chartSize.width} height={chartSize.height} />
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Recent Symptoms</h4>
                <div className="space-y-2">
                  {recentLogs.slice(0, 3).map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{format(new Date(entry.date), 'MMM d')}</span>
                      <div className="flex space-x-2">
                        <span className="text-sm text-gray-600">Mood: {typeof entry.mood === 'number' ? entry.mood : entry.mood}</span>
                        {entry.symptoms && entry.symptoms.length > 0 && (
                          <>
                            <span className="text-sm text-gray-600">•</span>
                            <div className="flex flex-wrap gap-1">
                              {entry.symptoms.slice(0, 2).map((symptom: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-pink-100 text-pink-800">{symptom}</span>
                              ))}
                              {entry.symptoms.length > 2 && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-pink-50 text-pink-600">+{entry.symptoms.length - 2} more</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming & Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming</h3>
                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => (
                    <div key={index} className="flex items-start">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-xl ${event.color} mr-3`}>
                        {event.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(event.date), 'EEEE, MMM d')}
                          {isToday(new Date(event.date)) && <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">Today</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <MemoActionLink href="/health-log" title="Log Health" bg="pink" />
                  <MemoActionLink href="/cycle-tracking" title="Track Cycle" bg="purple" />
                  <MemoActionLink href="/education" title="Learn" bg="blue" />
                  <MemoActionLink href="/profile" title="Profile" bg="green" />
                </div>
              </div>
            </div>
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
   Smaller presentational components (memoized)
   ------------------------- */
const StatCard = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-pink-100 rounded-lg p-3">
          <DefaultIcon />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};
const MemoStatCard = React.memo(StatCard);

const ActionLink = ({ href, title, bg }: { href: string; title: string; bg?: string }) => {
  const bgColor = bg === 'purple' ? 'bg-purple-50 hover:bg-purple-100' : bg === 'blue' ? 'bg-blue-50 hover:bg-blue-100' : bg === 'green' ? 'bg-green-50 hover:bg-green-100' : 'bg-pink-50 hover:bg-pink-100';
  const innerBg = bg === 'purple' ? 'bg-purple-100 text-purple-600' : bg === 'blue' ? 'bg-blue-100 text-blue-600' : bg === 'green' ? 'bg-green-100 text-green-600' : 'bg-pink-100 text-pink-600';
  return (
    <Link href={href} className={`p-3 ${bgColor} rounded-lg transition-colors text-center`}>
      <div className={`mx-auto w-8 h-8 ${innerBg} rounded-full flex items-center justify-center mb-1`}>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
      </div>
      <span className="text-xs font-medium text-gray-700">{title}</span>
    </Link>
  );
};
const MemoActionLink = React.memo(ActionLink);

const LegendItem = ({ color, label }: { color: string; label: string }) => {
  return (
    <div className="flex items-center">
      <span className={`w-3 h-3 ${color} rounded-sm mr-1`} />
      <span>{label}</span>
    </div>
  );
};

/* -------------------------
   Cycle + Logs chunk extracted
   ------------------------- */
function CycleAndLogs({ cycleData, recentLogs }: { cycleData: any; recentLogs: any[] }) {
  return (
    <>
      {/* Cycle Tracking Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Cycle Tracking</h3>
            <Link href="/cycle-tracking" className="text-sm font-medium text-pink-600 hover:text-pink-700">
              View Full Calendar →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Current Phase</h4>
              <div className="flex items-center">
                <div className={`h-12 w-1 ${cycleData.cyclePhase.color.split(' ')[0]} rounded-full mr-3`} />
                <div>
                  <p className="text-lg font-semibold text-gray-900">{cycleData.cyclePhase.name} Phase</p>
                  <p className="text-sm text-gray-500">Day {cycleData.cycleDay} of {cycleData.cycleLength}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  {cycleData.cyclePhase.name === 'Menstrual' && 'Your period has started. Rest and take care of yourself.'}
                  {cycleData.cyclePhase.name === 'Follicular' && 'Your body is preparing for ovulation. Energy levels are typically higher during this phase.'}
                  {cycleData.cyclePhase.name === 'Ovulation' && "You're most fertile now. Track your symptoms carefully if you're trying to conceive or avoid pregnancy."}
                  {cycleData.cyclePhase.name === 'Luteal' && 'You may experience PMS symptoms. Practice self-care and monitor your mood and energy levels.'}
                </p>
              </div>

              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="h-2 w-2 bg-pink-500 rounded-full mr-2" />
                  <span>
                    High fertility:{' '}
                    {cycleData.fertileWindow && cycleData.ovulation
                      ? `${format(addDays(new Date(cycleData.fertileWindow.start), -2), 'MMM d')} - ${format(new Date(cycleData.ovulation), 'MMM d')}`
                      : '--'}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <span className="h-2 w-2 bg-red-500 rounded-full mr-2" />
                  <span>Peak fertility: {cycleData.ovulation ? format(new Date(cycleData.ovulation), 'MMM d') : '--'}</span>
                </div>
              </div>
            </div>

            {/* Calendar mini */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-700">This Cycle</h4>
                <div className="text-xs text-gray-500">
                  {cycleData.lastPeriodStart
                    ? `${format(new Date(cycleData.lastPeriodStart), 'MMM d')} - ${format(addDays(new Date(cycleData.lastPeriodStart), cycleData.cycleLength), 'MMM d, yyyy')}`
                    : '--'}
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-medium mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="h-8 flex items-center justify-center">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: cycleData.cycleLength }).map((_, index) => {
                  const day = index + 1;
                  const lastPeriod = cycleData.lastPeriodStart ? new Date(cycleData.lastPeriodStart) : new Date();
                  const currentDate = addDays(lastPeriod, index);
                  const isPeriodDay = day <= cycleData.periodLength;
                  const isOvulationDay = cycleData.ovulation ? format(currentDate, 'yyyy-MM-dd') === cycleData.ovulation : false;
                  const fertileStart = cycleData.fertileWindow?.start ? new Date(cycleData.fertileWindow.start) : null;
                  const fertileEnd = cycleData.fertileWindow?.end ? new Date(cycleData.fertileWindow.end) : null;
                  const isFertile =
                    fertileStart &&
                    fertileEnd &&
                    !isOvulationDay &&
                    isAfter(currentDate, addDays(fertileStart, -1)) &&
                    isBefore(currentDate, addDays(fertileEnd, 1));
                  const todayFlag = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                  return (
                    <div
                      key={index}
                      title={format(currentDate, 'EEEE, MMM d, yyyy')}
                      className={`h-8 rounded-md flex items-center justify-center text-sm font-medium
                        ${isPeriodDay ? 'bg-pink-100 text-pink-800' : ''}
                        ${isOvulationDay ? 'bg-purple-100 text-purple-800 font-bold' : ''}
                        ${isFertile ? 'bg-pink-50 text-pink-600' : ''}
                        ${todayFlag ? 'ring-2 ring-pink-500' : ''}
                        ${day === cycleData.cycleDay ? 'font-bold' : ''}
                      `}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
                <LegendItem color="bg-pink-100" label="Period" />
                <LegendItem color="bg-pink-50" label="Fertile" />
                <LegendItem color="bg-purple-100" label="Ovulation" />
                <LegendItem color="ring-1 ring-gray-300" label="Today" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Recent Health Logs</h3>
              <Link href="/health-log" className="text-sm font-medium text-pink-600 hover:text-pink-700">
                View All Logs →
              </Link>
            </div>

            <div className="overflow-x-auto">
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
                  {recentLogs.slice(0, 5).map((entry: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{format(new Date(entry.date), 'MMM d, yyyy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`h-2.5 w-2.5 rounded-full ${entry.mood >= 4 ? 'bg-green-500' : entry.mood >= 3 ? 'bg-yellow-500' : 'bg-red-500'} mr-2`} />
                          <span className="text-sm text-gray-900">{entry.mood ?? '--'}/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`h-2.5 w-2.5 rounded-full ${entry.energy >= 4 ? 'bg-green-500' : entry.energy >= 3 ? 'bg-yellow-500' : 'bg-red-500'} mr-2`} />
                          <span className="text-sm text-gray-900">{entry.energy ?? '--'}/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {entry.symptoms?.slice(0, 2).map((symptom: string, i: number) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">{symptom}</span>
                          ))}
                          {entry.symptoms && entry.symptoms.length > 2 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-50 text-pink-600">+{entry.symptoms.length - 2} more</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{entry.notes ? (entry.notes.length > 30 ? `${entry.notes.substring(0, 30)}...` : entry.notes) : '--'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/health-log/edit?date=${entry.date}`} className="text-pink-600 hover:text-pink-900">View</Link>
                      </td>
                    </tr>
                  ))}
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
    </>
  );
}

/* -------------------------
   Small icons / helpers
   ------------------------- */
function DefaultIcon() {
  return (
    <svg className="h-8 w-8 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export { MemoStatCard as StatCard, MemoActionLink as ActionLink, LegendItem, DefaultIcon };
