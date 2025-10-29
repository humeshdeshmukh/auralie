'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CycleEntry, CyclePrediction } from './types';
import { getCycleEntries, saveCycleEntry, updateCycleEntry, deleteCycleEntry } from './services/cycleService';
import { getCyclePredictions, calculateCycleStats } from './services/predictionService';

// Components
import CycleCalendar from './components/CycleCalendar';
import CycleForm from './components/CycleForm';
import CycleStats from './components/CycleStats';

export default function CycleTrackingPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [predictions, setPredictions] = useState<CyclePrediction | null>(null);
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
        
        // Only fetch predictions if we have enough data
        if (userEntries.length > 0) {
          try {
            const prediction = await getCyclePredictions(userEntries);
            setPredictions(prediction);
          } catch (predictionError) {
            console.error('Error getting predictions:', predictionError);
            // Fallback to basic stats if prediction fails
            const stats = calculateCycleStats(userEntries);
            setPredictions({
              nextPeriodStart: stats.nextPeriodStart || new Date().toISOString(),
              nextPeriodEnd: new Date(
                new Date(stats.nextPeriodStart || new Date()).getTime() + 
                (stats.averagePeriodLength * 24 * 60 * 60 * 1000)
              ).toISOString(),
              fertileWindow: {
                start: new Date(
                  new Date(stats.nextPeriodStart || new Date()).getTime() - 
                  (stats.averageCycleLength * 24 * 60 * 60 * 1000) + 
                  (stats.averageCycleLength * 24 * 60 * 60 * 1000 * 0.4)
                ).toISOString(),
                end: new Date(
                  new Date(stats.nextPeriodStart || new Date()).getTime() - 
                  (stats.averageCycleLength * 24 * 60 * 60 * 1000) + 
                  (stats.averageCycleLength * 24 * 60 * 60 * 1000 * 0.7)
                ).toISOString()
              },
              ovulationDate: new Date(
                new Date(stats.nextPeriodStart || new Date()).getTime() - 
                (stats.averageCycleLength * 24 * 60 * 60 * 1000 * 0.3)
              ).toISOString(),
              confidence: stats.cycleVariability < 3 ? 'high' : 
                         stats.cycleVariability < 7 ? 'medium' : 'low'
            });
          }
        }
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
                  predictions={predictions}
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
                <CycleStats 
                  stats={stats} 
                  predictions={predictions}
                  onAddEntry={() => setShowForm(true)}
                />
              </div>
            </div>

            {entries.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Entries</h2>
                <div className="space-y-4">
                  {entries.slice(0, 5).map(entry => (
                    <div key={entry.id} className="border-b border-gray-100 pb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">
                            {new Date(entry.startDate).toLocaleDateString()}
                            {entry.endDate && ` - ${new Date(entry.endDate).toLocaleDateString()}`}
                          </span>
                          {entry.notes && (
                            <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
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
