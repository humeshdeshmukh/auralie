'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, addDays, isToday, differenceInDays } from 'date-fns';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Types
type FertilityEntry = {
  id?: string;
  userId: string;
  date: string;
  basalBodyTemp?: number;
  cervicalMucus?: 'dry' | 'sticky' | 'creamy' | 'watery' | 'egg-white';
  lhSurge?: boolean;
  ovulationPain?: boolean;
  breastTenderness?: boolean;
  libido?: number;
  notes?: string;
  loggedAt: string;
};

type FertilityStats = {
  cycleLength: number;
  periodLength: number;
  ovulationDay: number;
  fertileWindow: {
    start: number;
    end: number;
  };
  nextPeriod: string;
  nextOvulation: string;
  pregnancyTestDay: string;
};

// Mock data for development
const mockEntries: FertilityEntry[] = [
  {
    id: '1',
    userId: 'user1',
    date: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
    basalBodyTemp: 97.8,
    cervicalMucus: 'creamy',
    lhSurge: false,
    ovulationPain: false,
    breastTenderness: true,
    libido: 6,
    notes: 'Feeling good today',
    loggedAt: new Date().toISOString()
  },
  {
    id: '2',
    userId: 'user1',
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    basalBodyTemp: 97.9,
    cervicalMucus: 'watery',
    lhSurge: true,
    ovulationPain: true,
    breastTenderness: true,
    libido: 8,
    notes: 'Possible ovulation',
    loggedAt: new Date().toISOString()
  },
  {
    id: '3',
    userId: 'user1',
    date: format(new Date(), 'yyyy-MM-dd'),
    basalBodyTemp: 98.1,
    cervicalMucus: 'egg-white',
    lhSurge: true,
    ovulationPain: false,
    breastTenderness: false,
    libido: 7,
    notes: 'Fertile window',
    loggedAt: new Date().toISOString()
  }
];

// Mock stats calculation
const calculateMockStats = (entries: FertilityEntry[]): FertilityStats => ({
  cycleLength: 28,
  periodLength: 5,
  ovulationDay: 14,
  fertileWindow: {
    start: 9,
    end: 15
  },
  nextPeriod: format(addDays(new Date(), 12), 'yyyy-MM-dd'),
  nextOvulation: format(addDays(new Date(), 12), 'yyyy-MM-dd'),
  pregnancyTestDay: format(addDays(new Date(), 26), 'yyyy-MM-dd')
});

// AI Prompt Template
const generateAIPrompt = (entries: FertilityEntry[], stats: FertilityStats) => `
Analyze this fertility data and provide comprehensive insights:

**User Data:**
- Average Cycle: ${stats.cycleLength} days
- Next Period: ${new Date(stats.nextPeriod).toLocaleDateString()}
- Next Ovulation: ${new Date(stats.nextOvulation).toLocaleDateString()}
- Fertile Window: ${new Date(stats.nextOvulation).getDate() - 5} to ${new Date(stats.nextOvulation).getDate() + 1}

**Recent Entries (Last 7 days):**
${entries.slice(0, 7).map(entry => `
- ${format(new Date(entry.date), 'MMM d')}: 
  - BBT: ${entry.basalBodyTemp || 'N/A'}°F
  - CM: ${entry.cervicalMucus || 'N/A'}
  - Symptoms: ${[
    entry.lhSurge && 'LH Surge',
    entry.ovulationPain && 'Ovulation Pain',
    entry.breastTenderness && 'Breast Tenderness'
  ].filter(Boolean).join(', ') || 'None'}
  - Libido: ${entry.libido || 'N/A'}/10
  - Notes: ${entry.notes || 'None'}`).join('\n')}

**Provide a detailed analysis including:**
1. Fertility status and predictions
2. Cycle patterns and anomalies
3. Health insights and correlations
4. Personalized recommendations
5. When to take action

Format the response in markdown with clear sections.`;

// Components
const StatCard = ({ title, value, description, trend }: { title: string; value: string | number; description?: string; trend?: 'up' | 'down' | 'neutral' }) => {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-400'
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        {trend && (
          <span className={`text-xs ${trendColors[trend]}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
      {description && <p className="mt-1 text-xs text-text-tertiary">{description}</p>}
    </div>
  );
};

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 bg-gray-100 rounded w-3/4"></div>
    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
    <div className="h-4 bg-gray-100 rounded w-2/3"></div>
  </div>
);

export default function FertilityPage() {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entry, setEntry] = useState<Partial<FertilityEntry>>({});
  const [entries, setEntries] = useState<FertilityEntry[]>([]);
  const [stats, setStats] = useState<FertilityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tracker');
  const [insights, setInsights] = useState('## Fertility Insights\n\nYour personalized insights will appear here after analyzing your data.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // In a real app, fetch from Firebase
        const mockData = [...mockEntries];
        setEntries(mockData);
        const calculatedStats = calculateMockStats(mockData);
        setStats(calculatedStats);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setEntry(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : 
             type === 'checkbox' ? (e.target as HTMLInputElement).checked :
             value
    }));
  };

  // Generate AI Insights
  const generateInsights = useCallback(async () => {
    if (!stats || entries.length === 0) return;
    
    try {
      setIsAnalyzing(true);
      setError('');
      
      // Use Gemini AI to generate insights
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = generateAIPrompt(entries, stats);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      setInsights(text);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [entries, stats]);

  // Save the current entry
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please sign in to save entries');
      return;
    }
    
    try {
      const newEntry: FertilityEntry = {
        ...entry as FertilityEntry,
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser.uid,
        date: format(selectedDate, 'yyyy-MM-dd'),
        loggedAt: new Date().toISOString()
      };
      
      // In a real app, save to Firebase
      setEntries(prev => [newEntry, ...prev]);
      setEntry({});
      
      // Recalculate stats
      const updatedEntries = [newEntry, ...entries];
      const updatedStats = calculateMockStats(updatedEntries);
      setStats(updatedStats);
      
      // Show success feedback
      setError('');
      
    } catch (err) {
      console.error('Error saving entry:', err);
      setError('Failed to save entry. Please try again.');
    }
  };

  // Navigation
  const navigateDay = (days: number) => {
    setSelectedDate(prev => addDays(prev, days));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="h-64 bg-gray-100 rounded-xl"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 h-96 bg-gray-100 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentCycleDay = stats ? 
    stats.cycleLength - Math.ceil(differenceInDays(new Date(stats.nextPeriod), new Date())) : 1;
  const isFertileWindow = stats && currentCycleDay >= (stats.ovulationDay - 5) && currentCycleDay <= (stats.ovulationDay + 1);

  return (
    <div className="min-h-screen bg-background-light p-4 md:p-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-background-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">Fertility Tracker</h1>
            <p className="text-text-secondary">Track your cycle and optimize your fertility journey</p>
          </div>
          
          {stats && (
            <div className="mt-4 md:mt-0 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isFertileWindow ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div>
                  <p className="text-sm text-text-secondary">Cycle Day</p>
                  <p className="text-xl font-bold text-text-primary">{currentCycleDay} <span className="text-sm font-normal text-text-tertiary">of {stats?.cycleLength}</span></p>
                </div>
                <div className="h-10 w-px bg-gray-200"></div>
                <div>
                  <p className="text-sm text-text-secondary">Fertility</p>
                  <p className="text-xl font-bold text-text-primary">{isFertileWindow ? 'High' : 'Low'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              {['tracker', 'insights', 'stats'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === tab 
                      ? 'bg-primary text-white shadow-md' 
                      : 'text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            
            {activeTab === 'insights' && (
              <button
                onClick={generateInsights}
                disabled={isAnalyzing || entries.length === 0}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isAnalyzing || entries.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Insights with AI
                  </>
                )}
              </button>
            )}
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        {activeTab === 'tracker' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar and Stats */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    {format(selectedDate, 'MMMM yyyy')}
                  </h2>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => navigateDay(-1)}
                      className="p-1 rounded-md hover:bg-gray-100"
                    >
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setSelectedDate(new Date())}
                      className={`px-3 py-1 text-sm rounded-md ${isToday(selectedDate) ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      Today
                    </button>
                    <button 
                      onClick={() => navigateDay(1)}
                      className="p-1 rounded-md hover:bg-gray-100"
                    >
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="py-2">{day}</div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const date = subDays(selectedDate, selectedDate.getDay() - i);
                    const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center text-sm
                          ${isSelected ? 'bg-indigo-600 text-white' : 
                            isCurrentMonth ? 'text-gray-900 hover:bg-gray-100' : 
                            'text-gray-400 hover:bg-gray-50'}`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              {stats && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Cycle Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard 
                      title="Cycle Day" 
                      value={stats.cycleLength - Math.ceil((new Date(stats.nextPeriod).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} 
                      description={`of ${stats.cycleLength}`} 
                    />
                    <StatCard 
                      title="Next Period" 
                      value={new Date(stats.nextPeriod).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                      description="Expected" 
                    />
                    <StatCard 
                      title="Ovulation" 
                      value={new Date(stats.nextOvulation).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                      description="Estimated" 
                    />
                    <StatCard 
                      title="Fertile Window" 
                      value={`${new Date(stats.nextOvulation).getDate() - 5}-${new Date(stats.nextOvulation).getDate() + 1}`} 
                      description="Best days to conceive" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tracker Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-text-primary">
                    {format(selectedDate, 'MMMM yyyy')}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-tertiary">
                      {format(selectedDate, 'EEEE, MMM d')}
                    </span>
                  </div>
                </div>
                
                <form onSubmit={handleSave} className="space-y-6">
                  {/* Basal Body Temperature */}
                  <div className="space-y-6">
                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
                      <label htmlFor="basalBodyTemp" className="block text-sm font-medium text-text-primary mb-2">
                        Basal Body Temperature (°F)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          id="basalBodyTemp"
                          name="basalBodyTemp"
                          value={entry.basalBodyTemp || ''}
                          onChange={handleInputChange}
                          className="block w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                          placeholder="e.g., 97.8"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-400">°F</span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-text-tertiary">
                        Take your temperature first thing in the morning before getting out of bed
                      </p>
                    </div>

                  {/* Cervical Mucus */}
                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
                      <label className="block text-sm font-medium text-text-primary mb-3">
                        Cervical Mucus
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { value: 'dry', label: 'Dry', color: 'bg-amber-100 text-amber-800' },
                          { value: 'sticky', label: 'Sticky', color: 'bg-yellow-100 text-yellow-800' },
                          { value: 'creamy', label: 'Creamy', color: 'bg-blue-100 text-blue-800' },
                          { value: 'watery', label: 'Watery', color: 'bg-sky-100 text-sky-800' },
                          { value: 'egg-white', label: 'Egg White', color: 'bg-green-100 text-green-800' }
                        ].map((mucus) => (
                          <label 
                            key={mucus.value}
                            className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              entry.cervicalMucus === mucus.value
                                ? `${mucus.color.replace('bg-', 'border-')} border-2`
                                : 'border-gray-200 hover:border-gray-300 bg-white/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="cervicalMucus"
                              value={mucus.value}
                              checked={entry.cervicalMucus === mucus.value}
                              onChange={handleInputChange}
                              className="sr-only"
                            />
                            <span className="text-sm font-medium">{mucus.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                  {/* Symptoms */}
                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
                      <label className="block text-sm font-medium text-text-primary mb-3">
                        Symptoms
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { id: 'lhSurge', label: 'LH Surge', icon: '⚡' },
                          { id: 'ovulationPain', label: 'Ovulation Pain', icon: '🔄' },
                          { id: 'breastTenderness', label: 'Breast Tenderness', icon: '💖' },
                          { id: 'headache', label: 'Headache', icon: '🤕' },
                          { id: 'bloating', label: 'Bloating', icon: '🎈' },
                          { id: 'cramps', label: 'Cramps', icon: '🔄' }
                        ].map((symptom) => (
                          <label 
                            key={symptom.id}
                            className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              entry[symptom.id as keyof typeof entry]
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300 bg-white/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              id={symptom.id}
                              name={symptom.id}
                              checked={!!entry[symptom.id as keyof typeof entry]}
                              onChange={handleInputChange}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/50"
                            />
                            <span className="ml-3 text-sm font-medium text-text-primary flex items-center gap-2">
                              <span className="text-lg">{symptom.icon}</span>
                              {symptom.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                  {/* Libido */}
                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="libido" className="block text-sm font-medium text-text-primary">
                          Libido Level
                        </label>
                        <span className="text-sm font-medium text-primary">
                          {entry.libido || 5}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        id="libido"
                        name="libido"
                        min="1"
                        max="10"
                        value={entry.libido || 5}
                        onChange={handleInputChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-xs text-text-tertiary mt-1">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                      </div>
                    </div>

                  {/* Notes */}
                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
                      <label htmlFor="notes" className="block text-sm font-medium text-text-primary mb-2">
                        Notes & Observations
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={entry.notes || ''}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                        placeholder="Record any additional observations, mood, or symptoms..."
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEntry({})}
                      className="px-6 py-3 text-sm font-medium text-text-secondary bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 transition-all"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Entry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Fertility Insights</h2>
                  <p className="text-text-secondary">AI-powered analysis of your fertility data</p>
                </div>
                <button
                  onClick={generateInsights}
                  disabled={isAnalyzing || entries.length === 0}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isAnalyzing || entries.length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Insights with AI
                    </>
                  )}
                </button>
              </div>
              
              {isAnalyzing ? (
                <div className="space-y-4 py-8">
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                    <h3 className="text-lg font-medium text-text-primary">Analyzing Your Data</h3>
                    <p className="text-text-secondary max-w-md mt-2">Our AI is analyzing your fertility patterns to provide personalized insights.</p>
                  </div>
                </div>
              ) : (
                <div 
                  className="prose max-w-none prose-p:text-text-secondary prose-headings:text-text-primary prose-strong:text-primary prose-ul:list-disc prose-ul:pl-5 prose-li:marker:text-primary/50"
                  dangerouslySetInnerHTML={{ 
                    __html: insights
                      .replace(/\n\n/g, '</p><p>')
                      .replace(/\n/g, '<br>')
                      .replace(/##\s*(.*?)\n/g, '</p><h2 class="text-xl font-semibold mt-6 mb-3">$1</h2><p>')
                      .replace(/###\s*(.*?)\n/g, '</p><h3 class="text-lg font-medium mt-5 mb-2">$1</h3><p>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
                  }} 
                />
              )}
              
              {entries.length === 0 && !isAnalyzing && (
                <div className="text-center py-12 bg-gray-50/50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5.25 15.5h13.5l-3.841-5.1a2.25 2.25 0 01-.659-1.59V3.104M9.75 3.104c-.251.323-.349.745-.235 1.14.201.7.668 1.29 1.27 1.646.602.356 1.308.55 2.03.55h.69c.722 0 1.428-.194 2.03-.55.602-.356 1.069-.946 1.27-1.646.114-.395.016-.817-.235-1.14M9.75 3.104l-4.5 12.25m0 0h13.5m-13.5 0l1.5-4.5m12 4.5l-1.5-4.5m-9 0l1.5 4.5m0 0l4.5-4.5m-6 0l4.5 4.5" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-text-primary">No data to analyze</h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    Start tracking your fertility data to get personalized insights.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('tracker')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Entry
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {!isAnalyzing && entries.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-medium text-text-primary mb-4">Cycle Summary</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-text-secondary">Current Cycle Day</p>
                      <p className="text-2xl font-bold text-text-primary">
                        {currentCycleDay} <span className="text-base font-normal text-text-tertiary">/ {stats?.cycleLength}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Next Period</p>
                      <p className="text-lg font-medium text-text-primary">
                        {stats ? format(new Date(stats.nextPeriod), 'MMMM d, yyyy') : '--'}
                      </p>
                      <p className="text-sm text-text-tertiary">
                        {stats ? `in ${differenceInDays(new Date(stats.nextPeriod), new Date())} days` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Fertility Status</p>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isFertileWindow 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isFertileWindow ? 'Fertile Window' : 'Low Fertility'}
                        </span>
                        {isFertileWindow && (
                          <span className="ml-2 text-xs text-text-tertiary">
                            {stats ? `Day ${currentCycleDay - (stats.ovulationDay - 5)} of 7` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-medium text-text-primary mb-4">Key Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                      <p className="text-xs font-medium text-blue-800 mb-1">Avg. Cycle</p>
                      <p className="text-xl font-bold text-blue-600">{stats?.cycleLength || '--'} <span className="text-sm font-normal">days</span></p>
                    </div>
                    <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                      <p className="text-xs font-medium text-purple-800 mb-1">Ovulation</p>
                      <p className="text-xl font-bold text-purple-600">
                        {stats ? `Day ${stats.ovulationDay}` : '--'}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50/50 rounded-lg border border-green-100">
                      <p className="text-xs font-medium text-green-800 mb-1">Fertile Days</p>
                      <p className="text-xl font-bold text-green-600">
                        {stats ? `${stats.ovulationDay - 5}-${stats.ovulationDay + 1}` : '--'}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                      <p className="text-xs font-medium text-amber-800 mb-1">Next Period</p>
                      <p className="text-xl font-bold text-amber-600">
                        {stats ? format(new Date(stats.nextPeriod), 'MMM d') : '--'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {stats ? (
              <>
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-text-primary">Cycle Statistics</h2>
                      <p className="text-text-secondary">Overview of your fertility metrics and predictions</p>
                    </div>
                    <div className="mt-3 sm:mt-0">
                      <select className="text-sm rounded-lg border border-gray-200 bg-white/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent">
                        <option>Last 6 months</option>
                        <option>Last 3 months</option>
                        <option>This year</option>
                        <option>All time</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                      title="Average Cycle" 
                      value={`${stats.cycleLength} days`} 
                      description="Based on ${entries.length} cycles"
                      trend={stats.cycleLength > 28 ? 'up' : stats.cycleLength < 28 ? 'down' : 'neutral'}
                    />
                    <StatCard 
                      title="Fertile Window" 
                      value={`Day ${stats.ovulationDay - 5}-${stats.ovulationDay + 1}`}
                      description="Best days to conceive"
                    />
                    <StatCard 
                      title="Next Period" 
                      value={format(new Date(stats.nextPeriod), 'MMM d')}
                      description={`in ${differenceInDays(new Date(stats.nextPeriod), new Date())} days`}
                    />
                    <StatCard 
                      title="Ovulation Day" 
                      value={`Day ${stats.ovulationDay}`}
                      description={format(new Date(stats.nextOvulation), 'MMM d, yyyy')}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-medium text-text-primary mb-4">Cycle History</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                      <p className="text-text-tertiary">Cycle length chart will appear here</p>
                    </div>
                    <div className="mt-4 text-sm text-text-secondary">
                      <p>Your average cycle is <span className="font-medium text-text-primary">{stats.cycleLength} days</span> long.</p>
                      <p className="mt-1">
                        {stats.cycleLength > 28 
                          ? 'Your cycle is longer than average (28 days).' 
                          : stats.cycleLength < 28 
                            ? 'Your cycle is shorter than average (28 days).' 
                            : 'Your cycle is average length (28 days).'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-medium text-text-primary mb-4">Symptom Tracker</h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Cramps', count: 12, percentage: 75 },
                        { name: 'Headache', count: 8, percentage: 50 },
                        { name: 'Fatigue', count: 15, percentage: 90 },
                        { name: 'Bloating', count: 10, percentage: 60 },
                        { name: 'Breast Tenderness', count: 9, percentage: 55 },
                      ].map((symptom) => (
                        <div key={symptom.name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-text-primary">{symptom.name}</span>
                            <span className="text-text-tertiary">{symptom.count} times</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${symptom.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-text-primary">No statistics available</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Start tracking your cycle to see detailed statistics.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setActiveTab('tracker')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Entry
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-medium text-text-primary">Recent Entries</h3>
                <p className="text-sm text-text-secondary mt-1">Your most recent fertility tracking data</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        BBT
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Mucus
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Symptoms
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {entries.length > 0 ? (
                      entries.slice(0, 7).map((entry) => {
                        const entryDate = new Date(entry.date);
                        const isTodayEntry = isToday(entryDate);
                        
                        return (
                          <tr key={entry.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-text-primary">
                                {format(entryDate, 'MMM d')}
                              </div>
                              <div className="text-xs text-text-tertiary">
                                {format(entryDate, 'EEE')}
                                {isTodayEntry && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Today
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {entry.basalBodyTemp ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {entry.basalBodyTemp}°F
                                </span>
                              ) : (
                                <span className="text-text-tertiary text-sm">--</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {entry.cervicalMucus ? (
                                <span className={`px-2 inline-flex text-xs leading-5 font-medium rounded-full capitalize ${
                                  entry.cervicalMucus === 'egg-white' ? 'bg-green-100 text-green-800' :
                                  entry.cervicalMucus === 'watery' ? 'bg-sky-100 text-sky-800' :
                                  entry.cervicalMucus === 'creamy' ? 'bg-blue-100 text-blue-800' :
                                  entry.cervicalMucus === 'sticky' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {entry.cervicalMucus.replace('-', ' ')}
                                </span>
                              ) : (
                                <span className="text-text-tertiary text-sm">--</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {[
                                  entry.lhSurge && { label: 'LH Surge', color: 'bg-purple-100 text-purple-800' },
                                  entry.ovulationPain && { label: 'Ovulation Pain', color: 'bg-pink-100 text-pink-800' },
                                  entry.breastTenderness && { label: 'Breast Tenderness', color: 'bg-rose-100 text-rose-800' }
                                ].filter(Boolean).map((symptom, i) => (
                                  <span 
                                    key={i}
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${symptom?.color}`}
                                  >
                                    {symptom?.label}
                                  </span>
                                ))}
                                {!entry.lhSurge && !entry.ovulationPain && !entry.breastTenderness && (
                                  <span className="text-text-tertiary text-sm">--</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate">
                              {entry.notes || '--'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="text-text-tertiary">No entries yet. Start tracking to see your data here.</div>
                          <button
                            onClick={() => setActiveTab('tracker')}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
                          >
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Entry
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {entries.length > 7 && (
                <div className="px-6 py-3 bg-gray-50/50 text-right border-t border-gray-100">
                  <button className="text-sm font-medium text-primary hover:text-primary/80">
                    View all entries →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
