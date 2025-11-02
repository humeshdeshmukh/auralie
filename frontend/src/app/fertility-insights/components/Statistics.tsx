'use client';

import { FertilityEntry, FertilityStats } from '../types';
import { format } from 'date-fns';

interface StatisticsProps {
  entries: FertilityEntry[];
  stats: FertilityStats;
}

const CYCLE_PHASES = {
  menstruation: { name: 'Menstruation', emoji: '🩸', color: 'bg-red-50 text-red-700' },
  follicular: { name: 'Follicular', emoji: '🌱', color: 'bg-blue-50 text-blue-700' },
  ovulation: { name: 'Ovulation', emoji: '🥚', color: 'bg-purple-50 text-purple-700' },
  luteal: { name: 'Luteal', emoji: '🌕', color: 'bg-yellow-50 text-yellow-700' },
  pms: { name: 'PMS', emoji: '😣', color: 'bg-pink-50 text-pink-700' },
  unknown: { name: 'Unknown', emoji: '❓', color: 'bg-gray-100 text-gray-700' }
};

export default function Statistics({ entries, stats }: StatisticsProps) {
  // Count symptom occurrences
  const symptomCounts = entries.flatMap(e => e.symptoms || []).reduce((acc, symptom) => {
    acc[symptom] = (acc[symptom] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort symptoms by frequency (descending)
  const sortedSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]);
  
  // Get current phase info
  const currentPhase = stats.phase ? CYCLE_PHASES[stats.phase as keyof typeof CYCLE_PHASES] || CYCLE_PHASES.unknown : CYCLE_PHASES.unknown;
  
  // Calculate cycle day percentage
  const cycleDayPercentage = (stats.currentCycleDay / stats.cycleLength) * 100;

  return (
    <div className="space-y-6">
      {/* Current Cycle Overview */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Cycle Overview</h2>
        
        {/* Cycle Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Day {stats.currentCycleDay} of {stats.cycleLength}</span>
            <span>{Math.round(cycleDayPercentage)}% of cycle</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(100, Math.max(0, cycleDayPercentage))}%` }}
            />
          </div>
        </div>

        {/* Current Phase Card */}
        <div className={`p-4 rounded-lg ${currentPhase.color} mb-6`}>
          <div className="flex items-center">
            <span className="text-2xl mr-3">{currentPhase.emoji}</span>
            <div>
              <h3 className="font-semibold">Current Phase: {currentPhase.name}</h3>
              <p className="text-sm">
                {stats.isFertileWindow 
                  ? 'You\'re in your fertile window! Best time to conceive.'
                  : 'Not currently in fertile window.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Cycle Length" 
            value={`${stats.cycleLength} days`} 
            icon="🔄" 
            trend={stats.cycleLength > 28 ? 'up' : stats.cycleLength < 28 ? 'down' : 'stable'}
            description="Average length of your cycle"
          />
          <StatCard 
            title="Period Length" 
            value={`${stats.periodLength} days`} 
            icon="🩸" 
            trend="stable"
            description="Typical duration of your period"
          />
          <StatCard 
            title="Fertile Window" 
            value={`Day ${stats.fertileWindow.start}-${stats.fertileWindow.end}`} 
            icon="📆" 
            trend="up"
            description="Best days for conception"
          />
          <StatCard 
            title="Ovulation Day" 
            value={`Day ${stats.ovulationDay}`} 
            icon="🥚" 
            trend="down"
            description="Expected ovulation day"
          />
        </div>
      </div>

      {/* Cycle Timeline */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cycle Timeline</h3>
        <div className="relative pt-2">
          <div className="flex overflow-x-auto pb-4 hide-scrollbar">
            {Array.from({ length: stats.cycleLength }, (_, i) => {
              const day = i + 1;
              const isToday = day === stats.currentCycleDay;
              const isPeriod = day <= stats.periodLength;
              const isFertile = day >= stats.fertileWindow.start && day <= stats.fertileWindow.end;
              const isOvulation = day === stats.ovulationDay;
              
              return (
                <div key={day} className="flex flex-col items-center mx-1 w-12">
                  <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary font-bold' : 'text-gray-500'}`}>
                    {day}
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isToday 
                      ? 'bg-primary text-white' 
                      : isOvulation 
                        ? 'bg-purple-100 text-purple-700' 
                        : isFertile 
                          ? 'bg-pink-50 text-pink-600' 
                          : isPeriod 
                            ? 'bg-red-50 text-red-600' 
                            : 'bg-gray-50 text-gray-500'
                  }`}>
                    {isOvulation ? '🥚' : isPeriod ? '🩸' : isFertile ? '🌸' : day}
                  </div>
                  {isToday && <div className="h-1 w-1 rounded-full bg-primary mt-1"></div>}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Day 1</span>
            <span>Day {stats.cycleLength}</span>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Events */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
          <div className="space-y-4">
            <EventItem 
              title="Next Period" 
              date={stats.nextPeriod} 
              icon="🩹"
              description={`Expected in ${Math.max(0, stats.cycleLength - stats.currentCycleDay)} days`}
            />
            <EventItem 
              title="Next Ovulation" 
              date={stats.nextOvulation} 
              icon="🥚"
              description={`Day ${stats.ovulationDay} of cycle`}
            />
            <EventItem 
              title="Pregnancy Test Day" 
              date={stats.pregnancyTestDay} 
              icon="🔍"
              description="Earliest test date"
            />
          </div>
        </div>

        {/* Symptom Tracker */}
        <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Symptom Frequency</h3>
          <div className="space-y-3">
            {sortedSymptoms.length > 0 ? (
              sortedSymptoms.map(([symptom, count]) => (
                <div key={symptom} className="flex items-center">
                  <span className="w-40 text-sm text-gray-600 capitalize">
                    {symptom.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4">
                    <div 
                      className="bg-pink-500 h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${(count / Math.max(...Object.values(symptomCounts))) * 100}%` 
                      }} 
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700 w-8 text-right">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No symptom data recorded yet. Track your symptoms to see insights here.
              </p>
            )}
          </div>
          
          {/* Recent Symptoms */}
          {entries.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Symptoms</h4>
              <div className="flex flex-wrap gap-2">
                {entries.slice(0, 5).flatMap(entry => 
                  (entry.symptoms || []).map((symptom, idx) => (
                    <span 
                      key={`${entry.id}-${idx}`}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {symptom.replace(/_/g, ' ')}
                      <span className="ml-1 text-blue-600">
                        ({format(new Date(entry.date), 'MMM d')})
                      </span>
                    </span>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// StatCard Component
function StatCard({ 
  title, 
  value, 
  icon, 
  trend,
  description 
}: { 
  title: string; 
  value: string; 
  icon: string; 
  trend: 'up' | 'down' | 'stable';
  description?: string;
}) {
  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→'
  };
  
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    stable: 'text-blue-500'
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 flex items-center">
            <span className="mr-2">{icon}</span>
            {title}
          </p>
          <p className="text-2xl font-semibold mt-1 text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <span className={`text-lg font-medium ${trendColors[trend]}`}>
          {trendIcons[trend]}
        </span>
      </div>
    </div>
  );
}

// EventItem Component
function EventItem({ 
  title, 
  date, 
  icon, 
  description 
}: { 
  title: string; 
  date: string; 
  icon: string;
  description?: string;
}) {
  return (
    <div className="flex items-start p-3 bg-gray-50 rounded-lg">
      <span className="text-xl mr-3">{icon}</span>
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">
          {date ? format(new Date(date), 'MMMM d, yyyy') : '—'}
        </p>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
