'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { format, addDays, startOfDay } from 'date-fns';
import { Loader2 } from 'lucide-react';
import CycleCalendar from './components/CycleCalendar';
import SymptomTracker from './components/SymptomTracker';
import AIInsights from './components/AIInsights';
import Statistics from './components/Statistics';
import HealthLog from './components/HealthLog';
import { generateFertilityInsights, analyzeSymptomPatterns } from './lib/geminiService';
import { FertilityEntry, FertilityStats, FertilityInsight } from './types';

/**
 * NOTE:
 * - Replace fetch stubs with real API calls.
 * - computeStatsFromEntries() is a small helper here to produce sensible stats; replace with
 *   your server-side computation if available.
 */

// Helper: compute basic stats from entries (lightweight fallback)
function computeStatsFromEntries(entries: FertilityEntry[]): FertilityStats {
  // Default sensible values
  const cycleLength = 28;
  const periodLength = 5;
  const ovulationDay = 14;
  const fertileWindow = { start: 10, end: 16 };
  const nextPeriod = format(addDays(new Date(), cycleLength), 'yyyy-MM-dd');
  const nextOvulation = format(addDays(new Date(), 7), 'yyyy-MM-dd');
  const pregnancyTestDay = format(addDays(new Date(), cycleLength * 2), 'yyyy-MM-dd');
  const currentCycleDay = entries.length ? 1 : 1;

  return {
    cycleLength,
    periodLength,
    ovulationDay,
    fertileWindow,
    nextPeriod,
    nextOvulation,
    pregnancyTestDay,
    currentCycleDay,
    isFertileWindow: false,
    phase: 'unknown'
  } as FertilityStats;
}

export default function FertilityInsightsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<FertilityEntry[]>([]); // start empty, load real data
  const [stats, setStats] = useState<FertilityStats>(() => computeStatsFromEntries([]));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [insights, setInsights] = useState<FertilityInsight | null>(null);
  const [activeTab, setActiveTab] = useState<'tracker' | 'insights' | 'stats'>('tracker');
  const [symptomAnalysis, setSymptomAnalysis] = useState<string>('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const [lastGenerationTime, setLastGenerationTime] = useState<number>(0);
  const RATE_LIMIT_MS = 30000; // 30s

  // Load user data (entries + stats) from backend on mount
  useEffect(() => {
    if (!currentUser) {
      router.push('/login?redirect=/fertility-insights');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        // TODO: replace with real API calls
        // Example:
        // const fetchedEntries = await api.get('/entries');
        // const fetchedStats = await api.get('/stats');
        // setEntries(fetchedEntries);
        // setStats(fetchedStats);
        
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 700));
        
        // Start with empty entries or fetch real ones
        setEntries([]);
        setStats(computeStatsFromEntries([]));
      } catch (err) {
        console.error('Failed to load fertility data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser, router]);

  const generateInsights = async () => {
    const now = Date.now();
    if (now - lastGenerationTime < RATE_LIMIT_MS) {
      const timeLeft = Math.ceil((RATE_LIMIT_MS - (now - lastGenerationTime)) / 1000);
      alert(`Please wait ${timeLeft}s before generating new insights.`);
      return;
    }

    setIsGeneratingInsights(true);
    setLastGenerationTime(now);
    try {
      const [aiInsights, analysis] = await Promise.all([
        generateFertilityInsights(entries, stats),
        analyzeSymptomPatterns(entries)
      ]);
      
      setInsights(aiInsights);
      setSymptomAnalysis(analysis);
      
      // Navigate to insights tab
      setActiveTab('insights');
      router.push('/fertility-insights?tab=insights');
    } catch (err) {
      console.error('Error generating insights', err);
      setInsights({
        analysis: 'Failed to generate insights. Please try again later.',
        recommendations: ['Check your internet connection and try again.'],
        fertilityWindow: { 
          start: '0', 
          end: '0', 
          confidence: 'low' as const 
        },
        ovulationPrediction: { 
          date: '', 
          confidence: 'low' as const 
        },
        symptomsAnalysis: {
          'no-symptoms': {
            pattern: 'No symptom patterns detected',
            correlation: 'No significant correlations found'
          }
        }
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Normalize date for equality: yyyy-MM-dd
  const dateKey = (d: Date | string) => format(new Date(d), 'yyyy-MM-dd');

  // Called by SymptomTracker
  const handleSaveEntry = async (data: Partial<FertilityEntry>) => {
    setIsLoading(true);
    let incomingDateKey = '';
    
    try {
      // Normalize incoming date
      incomingDateKey = dateKey(data.date!);

      // If parent back-end save exists, call it here:
      // Example:
      // const saved = await api.post('/entries', payload);
      // For now we simulate and perform optimistic update.
      await Promise.resolve(); // placeholder if onSave is async

      // Update local entries (create or update)
      setEntries(prev => {
        const newEntries = [...prev];
        const idx = newEntries.findIndex(e => dateKey(e.date) === incomingDateKey);
        
        if (idx >= 0) {
          newEntries[idx] = { ...newEntries[idx], ...data } as FertilityEntry;
        } else {
          const newEntry: FertilityEntry = {
            id: `entry-${Date.now()}`,
            userId: currentUser?.id || 'me',
            date: incomingDateKey,
            symptoms: data.symptoms || [],
            mood: data.mood,
            basalBodyTemp: data.basalBodyTemp,
            notes: data.notes,
            flowLevel: (data as any).flowLevel || 'none'
          };
          newEntries.push(newEntry);
        }
        
        return newEntries;
      });

      // After saving, switch to the statistics tab
      setActiveTab('stats');

      // Recompute stats (replace with server-side result if available)
      setStats(prevStats => {
        const newEntries = [...entries];
        const idx = newEntries.findIndex(e => dateKey(e.date) === incomingDateKey);
        
        if (idx >= 0) {
          newEntries[idx] = { ...newEntries[idx], ...data } as FertilityEntry;
        } else {
          const newEntry: FertilityEntry = {
            id: `entry-${Date.now()}`,
            userId: currentUser?.id || 'me',
            date: incomingDateKey,
            symptoms: data.symptoms || [],
            mood: data.mood,
            basalBodyTemp: data.basalBodyTemp,
            notes: data.notes,
            flowLevel: (data as any).flowLevel || 'none'
          };
          newEntries.push(newEntry);
        }
        
        return { ...prevStats, ...computeStatsFromEntries(newEntries) };
      });

      // Update insights if we have enough data
      if (entries.length >= 2) {
        const recentEntries = [...entries, { ...data, date: incomingDateKey } as FertilityEntry]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);
        
        setInsights(prev => ({
          ...prev,
          lastUpdated: new Date().toISOString(),
          cycleAnalysis: `Analyzed ${recentEntries.length} recent entries`
        }));
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      // Handle error (e.g., show toast notification)
      alert('Failed to save entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    // keep at startOfDay so SymptomTracker receives a normalized date
    setSelectedDate(startOfDay(date));
  };

  const getCurrentEntry = (): FertilityEntry | null => {
    const key = dateKey(selectedDate);
    return entries.find(e => dateKey(e.date) === key) || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your fertility insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fertility Insights</h1>
          <p className="text-gray-600">Track your cycle, symptoms, and get personalized insights</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-1">
            <CycleCalendar entries={entries} stats={stats} selectedDate={selectedDate} onDateSelect={handleDateSelect} />

            <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cycle Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Phase:</span>
                  <span className="font-medium capitalize">{stats.phase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cycle Day:</span>
                  <span className="font-medium">{stats.currentCycleDay} of {stats.cycleLength}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Period:</span>
                  <span className="font-medium">
                    {stats.nextPeriod ? format(new Date(stats.nextPeriod), 'MMM d') : '—'}
                  </span>
                </div>
                {stats.isFertileWindow && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-800 font-medium">🌸 You're in your fertile window!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Column - Tracker/Insights */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button 
                  onClick={() => setActiveTab('tracker')} 
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'tracker' 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Daily Tracker
                </button>
                <button 
                  onClick={() => setActiveTab('insights')} 
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'insights' 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  AI Insights
                </button>
                <button 
                  onClick={() => setActiveTab('stats')} 
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'stats' 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Statistics
                </button>
              </div>
              <div className="p-6">
                {activeTab === 'tracker' && (
                  <SymptomTracker 
                    selectedDate={selectedDate} 
                    entry={getCurrentEntry()} 
                    onSave={handleSaveEntry} 
                  />
                )}
                {activeTab === 'insights' && (
                  <AIInsights
                    insights={insights}
                    isGenerating={isGeneratingInsights}
                    onGenerateInsights={generateInsights}
                  />
                )}
                {activeTab === 'stats' && (
                  <Statistics entries={entries} stats={stats} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// StatCard component is now moved to Statistics.tsx
