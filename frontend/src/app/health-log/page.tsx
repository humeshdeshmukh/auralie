'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { PlusCircleIcon, ChartBarIcon, CalendarIcon, FireIcon, HeartIcon, BellIcon } from '@heroicons/react/24/outline';

// Components
import HealthEntryForm from './components/HealthEntryForm';
import HealthEntryList from './components/HealthEntryList';
import HealthMetrics from './components/HealthMetrics';
import { HealthEntry } from './types';
import { 
  createHealthEntry, 
  getHealthEntriesByDateRange, 
  getUserHealthEntries 
} from './services/firebase';

export default function HealthLogPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HealthEntry | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'entries' | 'trends'>('overview');

  // Fetch health entries based on the selected time range
  const fetchEntries = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      let entries: HealthEntry[] = [];
      
      const now = new Date();
      
      switch (timeRange) {
        case 'day':
          const today = format(now, 'yyyy-MM-dd');
          entries = await getHealthEntriesByDateRange(user.uid, new Date(today), now);
          break;
        case 'week':
          const weekAgo = subDays(now, 7);
          entries = await getHealthEntriesByDateRange(user.uid, weekAgo, now);
          break;
        case 'month':
          const monthAgo = subDays(now, 30);
          entries = await getHealthEntriesByDateRange(user.uid, monthAgo, now);
          break;
        case 'all':
        default:
          entries = await getUserHealthEntries(user.uid, 100);
          break;
      }
      
      setEntries(entries);
    } catch (error) {
      console.error('Error fetching health entries:', error);
      // Handle error (e.g., show toast notification)
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, timeRange]);

  // Initial data fetch
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Handle form submission
  const handleSubmit = async (data: any) => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      
      if (editingEntry) {
        // Update existing entry
        // await updateHealthEntry(editingEntry.id, data);
      } else {
        // Create new entry
        await createHealthEntry(user.uid, data);
      }
      
      // Refresh the entries
      await fetchEntries();
      setShowForm(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Error saving health entry:', error);
      // Handle error (e.g., show toast notification)
    } finally {
      setIsLoading(false);
    }
  };

  // Handle entry edit
  const handleEdit = (entry: HealthEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  // Handle entry delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      setIsLoading(true);
      // await deleteHealthEntry(id);
      await fetchEntries();
    } catch (error) {
      console.error('Error deleting health entry:', error);
      // Handle error (e.g., show toast notification)
    } finally {
      setIsLoading(false);
    }
  };

  // Get stats for the dashboard
  const getStats = () => {
    const todayEntries = entries.filter(entry => isToday(new Date(entry.date)));
    const weekEntries = entries.filter(entry => isThisWeek(new Date(entry.date)));
    const monthEntries = entries.filter(entry => isThisMonth(new Date(entry.date)));

    return {
      today: todayEntries.length,
      thisWeek: weekEntries.length,
      thisMonth: monthEntries.length,
      total: entries.length,
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-pink-600">Health Log</h1>
          <div className="flex space-x-4
          ">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" />
              New Entry
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Time Range Selector */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange('day')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === 'day'
                  ? 'bg-pink-100 text-pink-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === 'week'
                  ? 'bg-pink-100 text-pink-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === 'month'
                  ? 'bg-pink-100 text-pink-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === 'all'
                  ? 'bg-pink-100 text-pink-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Time
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} found
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <div className="flex items-center">
                <ChartBarIcon className="mr-2 h-5 w-5" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('entries')}
              className={`${
                activeTab === 'entries'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                Entries
              </div>
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`${
                activeTab === 'trends'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <div className="flex items-center">
                <FireIcon className="mr-2 h-5 w-5" />
                Trends
              </div>
            </button>
          </nav>
        </div>

        {/* Stats Cards */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-pink-500 rounded-md p-3">
                    <CalendarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Entries</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats.today}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <CalendarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">This Week</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats.thisWeek}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <HeartIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats.thisMonth}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <BellIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Entries</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats.total}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <HealthMetrics entries={entries} />
                  </div>
                  <div>
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Entries</h3>
                      </div>
                      <div className="border-t border-gray-200">
                        <HealthEntryList 
                          entries={entries.slice(0, 5)} 
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          isLoading={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'entries' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <HealthEntryList 
                    entries={entries} 
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {activeTab === 'trends' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Health Trends</h2>
                  <HealthMetrics entries={entries} />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Health Entry Form Modal */}
      {showForm && (
        <div className="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowForm(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                      {editingEntry ? 'Edit Health Entry' : 'Add New Health Entry'}
                    </h3>
                    <HealthEntryForm 
                      initialData={editingEntry || undefined}
                      onSubmit={handleSubmit}
                      onCancel={() => {
                        setShowForm(false);
                        setEditingEntry(null);
                      }}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
