'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { format, addDays, startOfDay, isToday } from 'date-fns';
import { Loader2 } from 'lucide-react';
import CycleCalendar from './components/CycleCalendar';
import SymptomTracker from './components/SymptomTracker';
import { generateFertilityInsights, analyzeSymptomPatterns } from './lib/geminiService';
import { FertilityEntry, FertilityStats, CycleDay, FertilityInsight } from './types';

// Mock data - Replace with actual API calls
const MOCK_ENTRIES: FertilityEntry[] = [
  {
    id: '1',
    userId: 'user1',
    date: format(addDays(new Date(), -5), 'yyyy-MM-dd'),
    symptoms: ['cramps', 'bloating'],
    mood: 2,
    basalBodyTemp: 36.5,
    notes: 'Moderate cramps today',
    flowLevel: 'medium',
  },
  {
    id: '2',
    userId: 'user1',
    date: format(addDays(new Date(), -4), 'yyyy-MM-dd'),
    symptoms: ['bloating'],
    mood: 3,
    basalBodyTemp: 36.6,
    flowLevel: 'light',
  },
  {
    id: '3',
    userId: 'user1',
    date: format(addDays(new Date(), -3), 'yyyy-MM-dd'),
    symptoms: ['cervical_mucus'],
    mood: 4,
    basalBodyTemp: 36.7,
    flowLevel: 'spotting',
  },
];

const MOCK_STATS: FertilityStats = {
  cycleLength: 28,
  periodLength: 5,
  ovulationDay: 14,
  fertileWindow: {
    start: 10,
    end: 16,
  },
  nextPeriod: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
  nextOvulation: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
  pregnancyTestDay: format(addDays(new Date(), 28), 'yyyy-MM-dd'),
  currentCycleDay: 14,
  isFertileWindow: true,
  phase: 'ovulation',
};

export default function FertilityInsightsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<FertilityEntry[]>(MOCK_ENTRIES);
  const [stats, setStats] = useState<FertilityStats>(MOCK_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<FertilityInsight | null>(null);
  const [activeTab, setActiveTab] = useState<'tracker' | 'insights' | 'stats'>('tracker');
  const [symptomAnalysis, setSymptomAnalysis] = useState<string>('');

  // Load user data on mount
  useEffect(() => {
    if (!currentUser) {
      router.push('/login?redirect=/fertility-insights');
      return;
    }

    const loadData = async () => {
      try {
        // TODO: Replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate AI insights
        const aiInsights = await generateFertilityInsights(MOCK_ENTRIES, MOCK_STATS);
        setInsights(aiInsights);
        
        // Analyze symptom patterns
        const analysis = await analyzeSymptomPatterns(MOCK_ENTRIES);
        setSymptomAnalysis(analysis);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser, router]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSaveEntry = async (data: Partial<FertilityEntry>) => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const existingEntryIndex = entries.findIndex(e => 
        format(new Date(e.date), 'yyyy-MM-dd') === format(data.date as string, 'yyyy-MM-dd')
      );
      
      let updatedEntries;
      if (existingEntryIndex >= 0) {
        updatedEntries = [...entries];
        updatedEntries[existingEntryIndex] = { ...updatedEntries[existingEntryIndex], ...data } as FertilityEntry;
      } else {
        updatedEntries = [...entries, { ...data, id: `entry-${Date.now()}` } as FertilityEntry];
      }
      
      setEntries(updatedEntries);
      
      // Regenerate insights with updated data
      const aiInsights = await generateFertilityInsights(updatedEntries, stats);
      setInsights(aiInsights);
      
      const analysis = await analyzeSymptomPatterns(updatedEntries);
      setSymptomAnalysis(analysis);
      
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentEntry = (): FertilityEntry | null => {
    return (
      entries.find(
        (e) => format(new Date(e.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      ) || null
    );
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
            <CycleCalendar
              entries={entries}
              stats={stats}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
            
            <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cycle Summary</h3>
              <div className="space-y-3">
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
                    {format(new Date(stats.nextPeriod), 'MMM d')} 
                    <span className="text-sm text-gray-500 ml-1">
                      ({Math.ceil((new Date(stats.nextPeriod).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                    </span>
                  </span>
                </div>
                {stats.isFertileWindow && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-800 font-medium">
                      🌸 You're in your fertile window! Perfect time to try to conceive.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Column - Tracker/Insights */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('tracker')}
                  className={`px-6 py-3 text-sm font-medium ${activeTab === 'tracker' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Daily Tracker
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`px-6 py-3 text-sm font-medium ${activeTab === 'insights' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  AI Insights
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-6 py-3 text-sm font-medium ${activeTab === 'stats' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
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
                
                {activeTab === 'insights' && insights && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">Fertility Analysis</h3>
                      <p className="text-blue-700">{insights.analysis}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Recommendations</h3>
                      <ul className="space-y-2">
                        {insights.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {symptomAnalysis && (
                      <div className="mt-6">
                        <h3 className="font-semibold text-gray-800 mb-3">Symptom Patterns</h3>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: symptomAnalysis }} />
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'stats' && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">Cycle Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <StatCard
                        title="Average Cycle Length"
                        value={`${stats.cycleLength} days`}
                        icon="🔄"
                        trend="stable"
                      />
                      <StatCard
                        title="Period Length"
                        value={`${stats.periodLength} days`}
                        icon="🩸"
                        trend="stable"
                      />
                      <StatCard
                        title="Next Fertile Window"
                        value={`Day ${stats.fertileWindow.start}-${stats.fertileWindow.end}`}
                        icon="📆"
                        trend="up"
                      />
                      <StatCard
                        title="Ovulation Day"
                        value={`Day ${stats.ovulationDay}`}
                        icon="🥚"
                        trend="down"
                      />
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Symptom Frequency (Last 3 Months)</h4>
                      <div className="space-y-2">
                        {Object.entries(
                          entries.flatMap(e => e.symptoms || []).reduce((acc, symptom) => {
                            acc[symptom] = (acc[symptom] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        )
                        .sort((a, b) => b[1] - a[1])
                        .map(([symptom, count]) => (
                          <div key={symptom} className="flex items-center">
                            <span className="w-32 text-sm text-gray-600 capitalize">
                              {symptom.replace(/_/g, ' ')}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-4">
                              <div 
                                className="bg-primary h-full rounded-full" 
                                style={{ width: `${(count / entries.length) * 100}%` }}
                              />
                            </div>
                            <span className="ml-2 text-sm text-gray-600 w-8 text-right">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for stats cards
function StatCard({ title, value, icon, trend }: { title: string; value: string; icon: string; trend: 'up' | 'down' | 'stable' }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
      {trend !== 'stable' && (
        <div className={`mt-2 text-sm flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? '↑' : '↓'}
          <span className="ml-1">From last month</span>
        </div>
      )}
    </div>
  );
}
