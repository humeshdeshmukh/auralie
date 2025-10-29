'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CycleEntry, CycleStats as CycleStatsType } from './types';
import { getCycleEntries, saveCycleEntry, updateCycleEntry, deleteCycleEntry } from './services/cycleService';

// Simple function to calculate basic cycle stats
const calculateCycleStats = (entries: CycleEntry[]): CycleStatsType => {
  if (entries.length === 0) {
    return {
      averageCycleLength: 28,
      averagePeriodLength: 5,
      cycleVariability: 0,
      lastPeriodStart: null,
      nextPeriodStart: null,
      nextPeriodEnd: null,
      fertileWindow: null,
      ovulationDate: null,
      confidence: 'low',
      cycleHistory: []
    };
  }

  // Sort entries by start date
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Calculate average cycle length
  let totalCycleDays = 0;
  let cycleCount = 0;
  
  for (let i = 1; i < sortedEntries.length; i++) {
    const prevDate = new Date(sortedEntries[i - 1].startDate);
    const currDate = new Date(sortedEntries[i].startDate);
    const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    totalCycleDays += diffDays;
    cycleCount++;
  }

  const averageCycleLength = cycleCount > 0 ? Math.round(totalCycleDays / cycleCount) : 28;

  // Calculate average period length
  let totalPeriodDays = 0;
  let periodCount = 0;

  for (const entry of sortedEntries) {
    if (entry.endDate) {
      const startDate = new Date(entry.startDate);
      const endDate = new Date(entry.endDate);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      totalPeriodDays += diffDays;
      periodCount++;
    }
  }

  const averagePeriodLength = periodCount > 0 ? Math.round(totalPeriodDays / periodCount) : 5;

  // Simple cycle variability (standard deviation of cycle lengths)
  let variance = 0;
  if (cycleCount > 1) {
    const mean = totalCycleDays / cycleCount;
    let sumSquaredDiffs = 0;
    
    for (let i = 1; i < sortedEntries.length; i++) {
      const prevDate = new Date(sortedEntries[i - 1].startDate);
      const currDate = new Date(sortedEntries[i].startDate);
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      sumSquaredDiffs += Math.pow(diffDays - mean, 2);
    }
    
    variance = Math.sqrt(sumSquaredDiffs / cycleCount);
  }

  const cycleVariability = Math.round(variance * 10) / 10;
  const lastEntry = sortedEntries[sortedEntries.length - 1];
  const lastStartDate = new Date(lastEntry.startDate);
  
  // Estimate next period start (simple estimation)
  const nextStartDate = new Date(lastStartDate);
  nextStartDate.setDate(lastStartDate.getDate() + averageCycleLength);
  
  // Estimate next period end (simple estimation)
  const nextEndDate = new Date(nextStartDate);
  nextEndDate.setDate(nextStartDate.getDate() + (averagePeriodLength - 1));

  return {
    averageCycleLength,
    averagePeriodLength,
    cycleVariability,
    lastPeriodStart: lastEntry.startDate,
    nextPeriodStart: nextStartDate.toISOString(),
    nextPeriodEnd: nextEndDate.toISOString(),
    fertileWindow: null,
    ovulationDate: null,
    confidence: cycleVariability < 3 ? 'high' : cycleVariability < 7 ? 'medium' : 'low',
    cycleHistory: []
  };
};

// Components
import CycleCalendar from './components/CycleCalendar';
import CycleForm from './components/CycleForm';
import CycleStats from './components/CycleStats';

export default function CycleTrackingPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CycleEntry | null>(null);

  // Fetch cycle data on component mount
  useEffect(() => {
    const fetchCycleData = async () => {
      if (!user?.uid) return;
      
      try {
        setIsLoading(true);
        const userEntries = await getCycleEntries(user.uid);
        setEntries(userEntries);
        
      } catch (err) {
        console.error('Error fetching cycle data:', err);
        setError('Failed to load cycle data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCycleData();
  }, [user?.uid]);

  const handleSaveEntry = async (entryData: Omit<CycleEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      
      if (editingEntry) {
        await updateCycleEntry(editingEntry.id, entryData);
      } else {
        await saveCycleEntry(user.uid, entryData);
      }
      
      // Refresh the data
      const updatedEntries = await getCycleEntries(user.uid);
      setEntries(updatedEntries);
      setShowForm(false);
      setEditingEntry(null);
    } catch (err) {
      console.error('Error saving cycle entry:', err);
      setError('Failed to save entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      setIsLoading(true);
      await deleteCycleEntry(entryId);
      
      // Refresh the data
      if (user?.uid) {
        const updatedEntries = await getCycleEntries(user.uid);
        setEntries(updatedEntries);
      }
    } catch (err) {
      console.error('Error deleting cycle entry:', err);
      setError('Failed to delete entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEntry = (entry: CycleEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const stats = calculateCycleStats(entries);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-pink-600">Cycle Tracking</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Entry
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-2">
                <CycleCalendar 
                  entries={entries} 
                  onSelectDate={(date) => {
                    const entry = entries.find(e => e.startDate.startsWith(date));
                    if (entry) {
                      handleEditEntry(entry);
                    } else {
                      // Create a new entry for the selected date
                      setEditingEntry(null);
                      setShowForm(true);
                    }
                  }}
                />
              </div>
              <div>
                <CycleStats stats={stats} />
              </div>
            </div>

            {entries.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Recent Entries</h2>
                  {entries.length > 3 && (
                    <button 
                      onClick={() => {/* Add navigation to full entries list */}}
                      className="text-sm text-pink-600 hover:text-pink-800 font-medium"
                    >
                      See All Entries
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {entries.slice(0, 3).map(entry => (
                    <div key={entry.id} className="border-b border-gray-100 pb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-800">
                              {new Date(entry.startDate).getDate()}
                            </span>
                            <div className="text-sm text-gray-600">
                              <div>{new Date(entry.startDate).toLocaleString('default', { month: 'short' })}</div>
                              {entry.endDate && new Date(entry.startDate).getMonth() !== new Date(entry.endDate).getMonth() && (
                                <div className="text-gray-400">
                                  {new Date(entry.endDate).toLocaleString('default', { month: 'short' })}
                                </div>
                              )}
                            </div>
                            {entry.endDate && (
                              <>
                                <span className="text-gray-400">-</span>
                                <span className="font-bold text-gray-800">
                                  {new Date(entry.endDate).getDate()}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {entry.flowLevel && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">
                                {entry.flowLevel.charAt(0).toUpperCase() + entry.flowLevel.slice(1)}
                              </span>
                            )}
                            {entry.symptoms?.slice(0, 2).map((symptom, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                {symptom}
                              </span>
                            ))}
                            {entry.symptoms?.length > 2 && (
                              <span className="text-xs text-gray-500 self-center">
                                +{entry.symptoms.length - 2} more
                              </span>
                            )}
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{entry.notes}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => entry.id && handleDeleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Entry Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingEntry ? 'Edit Entry' : 'Add New Entry'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingEntry(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CycleForm 
                initialData={editingEntry || undefined}
                onSubmit={handleSaveEntry}
                onCancel={() => {
                  setShowForm(false);
                  setEditingEntry(null);
                }}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
