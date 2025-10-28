'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { CalendarDaysIcon, ChartBarIcon, ClockIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { scheduleModelTraining } from '@/services/predictionService';

// Components
import CycleStatus from '@/components/cycle/CycleStatus';
import QuickLog from '@/components/cycle/QuickLog';
import RecentEntries from '@/components/cycle/RecentEntries';
import CycleInsights from '@/components/cycle/CycleInsights';

export type CycleData = {
  id: string;
  startDate: string;
  endDate?: string | null;
  flow: 'light' | 'medium' | 'heavy' | 'spotting' | 'none';
  symptoms: string[];
  mood: string;
  notes?: string;
  lastPeriod?: string;
  cycleLength?: number;
  periodLength?: number;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
};


export default function CycleTrackingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentCycle, setCurrentCycle] = useState<CycleData | null>(null);
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'insights' | 'predictions'>('overview');

  const fetchCycleData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch current cycle
      const currentDoc = await getDoc(doc(db, 'users', user.uid, 'cycles', 'current'));
      if (currentDoc.exists()) {
        const data = currentDoc.data();
        setCurrentCycle({ 
          id: currentDoc.id, 
          ...data,
          startDate: data.startDate?.toDate?.()?.toISOString() || data.startDate,
          endDate: data.endDate?.toDate?.()?.toISOString() || data.endDate,
          lastPeriod: data.lastPeriod?.toDate?.()?.toISOString() || data.lastPeriod
        } as CycleData);
      } else {
        setCurrentCycle(null);
      }
      
      // Fetch cycle history
      const historySnapshot = await getDocs(collection(db, 'users', user.uid, 'history'));
      const historyData = historySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate?.()?.toISOString() || data.startDate,
          endDate: data.endDate?.toDate?.()?.toISOString() || data.endDate,
          lastPeriod: data.lastPeriod?.toDate?.()?.toISOString() || data.lastPeriod
        } as CycleData;
      });
      
      setCycles(historyData);
      
      // Schedule model training if we have enough data
      if (historyData.length >= 2) {
        try {
          const token = await user.getIdToken();
          await scheduleModelTraining(historyData, token);
          console.log('Model training scheduled successfully');
        } catch (error) {
          console.error('Error scheduling model training:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching cycle data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    let isMounted = true;
    
    const fetchData = async () => {
      try {
        await fetchCycleData();
      } catch (error) {
        console.error('Error fetching cycle data:', error);
        if (isMounted) {
          // Handle error state if needed
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [user, router, fetchCycleData]);



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your cycle data...</p>
        </div>
      </div>
    );
  }

  // Memoize tab configuration to prevent unnecessary re-renders
  const tabs = [
    { 
      name: 'Overview', 
      id: 'overview' as const, 
      icon: <CalendarDaysIcon className="h-5 w-5 mr-2" />,
      disabled: false
    },
    { 
      name: 'History', 
      id: 'history' as const, 
      icon: <ListBulletIcon className="h-5 w-5 mr-2" />,
      disabled: false
    },
    { 
      name: 'Insights', 
      id: 'insights' as const, 
      icon: <ChartBarIcon className="h-5 w-5 mr-2" />,
      disabled: cycles.length < 3
    },
    { 
      name: 'Predictions', 
      id: 'predictions' as const, 
      icon: <ClockIcon className="h-5 w-5 mr-2" />,
      disabled: cycles.length < 2
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cycle Tracking</h1>
              <p className="mt-2 text-sm text-gray-500">
                {currentCycle
                  ? 'Track your current cycle and predictions'
                  : 'Start tracking your menstrual cycle'}
              </p>
            </div>
            <button
              onClick={fetchCycleData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
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
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`${
                activeTab === 'history'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <div className="flex items-center">
                <ListBulletIcon className="h-5 w-5 mr-2" />
                History
                {cycles.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {cycles.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              disabled={cycles.length < 3}
              className={`${
                activeTab === 'insights'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                cycles.length < 3 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={cycles.length < 3 ? 'At least 3 cycles needed for insights' : ''}
            >
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Insights
                {cycles.length < 3 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 py-0.5 rounded">
                    {cycles.length}/3
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              disabled={cycles.length < 2}
              className={`${
                activeTab === 'predictions'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                cycles.length < 2 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={cycles.length < 2 ? 'At least 2 cycles needed for predictions' : ''}
            >
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Predictions
                {cycles.length < 2 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 py-0.5 rounded">
                    {cycles.length}/2
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <CycleStatus cycle={currentCycle} cycles={cycles} />
                </div>
                <div>
                  <QuickLog onLogAdded={() => fetchCycleData()} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <RecentEntries />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Current Cycle Day</p>
                      <p className="text-2xl font-semibold">
                        {currentCycle?.startDate
                          ? Math.ceil((new Date().getTime() - new Date(currentCycle.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                          : '--'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Average Cycle Length</p>
                      <p className="text-2xl font-semibold">
                        {currentCycle?.cycleLength ? `${currentCycle.cycleLength} days` : '--'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Period</p>
                      <p className="text-lg font-medium">
                        {currentCycle?.lastPeriod
                          ? new Date(currentCycle.lastPeriod).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : '--'}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <Link
                        href="/cycle-tracking/settings"
                        className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                      >
                        Edit cycle settings →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Cycle History</h2>
                  <span className="text-sm text-gray-500">
                    {cycles.length} {cycles.length === 1 ? 'cycle' : 'cycles'} tracked
                  </span>
                </div>

                {cycles.length > 0 ? (
                  <div className="space-y-4">
                    {cycles.map((cycle, index) => {
                      const startDate = new Date(cycle.startDate);
                      const endDate = cycle.endDate ? new Date(cycle.endDate) : null;
                      const cycleLength = index < cycles.length - 1
                        ? Math.round((new Date(cycles[index + 1].startDate).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                        : null;

                      return (
                        <div
                          key={cycle.id}
                          className={`border rounded-lg p-4 ${
                            !cycle.endDate ? 'border-pink-200 bg-pink-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {endDate ? ` - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ' - Present'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {endDate
                                  ? `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
                                  : `${Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days so far`}
                              </p>
                              {cycle.notes && (
                                <p className="mt-2 text-sm text-gray-600">
                                  {cycle.notes.length > 100 ? `${cycle.notes.substring(0, 100)}...` : cycle.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {cycleLength && (
                                <p className="font-medium">{cycleLength} days</p>
                              )}
                              <p className="text-sm text-gray-500 capitalize">
                                {cycle.flow} flow
                              </p>
                              {cycle.symptoms && cycle.symptoms.length > 0 && (
                                <div className="mt-1 flex flex-wrap justify-end gap-1">
                                  {cycle.symptoms.slice(0, 3).map((symptom, i) => (
                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                                      {symptom.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                  {cycle.symptoms.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      +{cycle.symptoms.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {!cycle.endDate && (
                            <div className="mt-3 pt-3 border-t border-pink-200">
                              <button
                                onClick={() => {
                                  // TODO: Implement end cycle functionality
                                  if (confirm('Are you sure you want to end this cycle?')) {
                                    // End cycle logic here
                                    fetchCycleData();
                                  }
                                }}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                              >
                                End Cycle
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No cycle history</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by logging your first cycle.
                    </p>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                      >
                        <svg
                          className="-ml-1 mr-2 h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Log Cycle
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Cycle Insights</h2>
                {cycles.length >= 3 ? (
                  <CycleInsights cycles={cycles} />
                ) : (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Not enough data for insights</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Track at least 3 cycles to see detailed insights and trends.
                    </p>
                    <div className="mt-6">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className={`h-2 w-2 rounded-full mx-1 ${i <= cycles.length ? 'bg-pink-600' : 'bg-gray-200'}`}></div>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-500">
                          {cycles.length} of 3 cycles tracked
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Cycle Predictions</h2>

              {currentCycle ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-800">Next Period Prediction</h3>
                    <div className="mt-2 flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                        <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-blue-900">
                          {currentCycle.lastPeriod && currentCycle.cycleLength ? (
                            <>
                              {new Date(
                                new Date(currentCycle.lastPeriod).getTime() + 
                                (currentCycle.cycleLength * 24 * 60 * 60 * 1000)
                              ).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </>
                          ) : '--'}
                        </p>
                        <p className="text-sm text-blue-600">
                          {currentCycle.lastPeriod && currentCycle.cycleLength ? (
                            <>
                              In about {Math.ceil(
                                (new Date(currentCycle.lastPeriod).getTime() + 
                                (currentCycle.cycleLength * 24 * 60 * 60 * 1000) - 
                                new Date().getTime()) / (1000 * 60 * 60 * 24)
                              )} days
                            </>
                          ) : 'Not enough data to predict next period'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-purple-800">Fertility Window</h3>
                    <div className="mt-2">
                      {currentCycle.lastPeriod && currentCycle.cycleLength ? (
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-purple-100 p-3 rounded-full">
                              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-purple-900">Fertile Window</p>
                              <p className="text-sm text-purple-700">
                                {(() => {
                                  const nextPeriodDate = new Date(
                                    new Date(currentCycle.lastPeriod).getTime() + 
                                    (currentCycle.cycleLength * 24 * 60 * 60 * 1000)
                                  );
                                  const ovulationDate = new Date(
                                    nextPeriodDate.getTime() - (14 * 24 * 60 * 60 * 1000)
                                  );
                                  const fertileStart = new Date(ovulationDate);
                                  fertileStart.setDate(fertileStart.getDate() - 5);
                                  
                                  return `${fertileStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                                    ${ovulationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                                })()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-pink-100 p-3 rounded-full">
                              <svg className="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-pink-900">Ovulation Day</p>
                              <p className="text-sm text-pink-700">
                                {(() => {
                                  const nextPeriodDate = new Date(
                                    new Date(currentCycle.lastPeriod).getTime() + 
                                    (currentCycle.cycleLength * 24 * 60 * 60 * 1000)
                                  );
                                  const ovulationDate = new Date(
                                    nextPeriodDate.getTime() - (14 * 24 * 60 * 60 * 1000)
                                  );
                                  return ovulationDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-purple-600">
                          Track more cycles to see your fertility window predictions.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-green-800">Pregnancy Test</h3>
                    <div className="mt-2">
                      <p className="text-sm text-green-700">
                        The earliest you can take a pregnancy test is about 12-14 days after ovulation.
                      </p>
                      {currentCycle.lastPeriod && currentCycle.cycleLength && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-green-900">Earliest test date:</p>
                          <p className="text-sm text-green-700">
                            {(() => {
                              const nextPeriodDate = new Date(
                                new Date(currentCycle.lastPeriod).getTime() + 
                                (currentCycle.cycleLength * 24 * 60 * 60 * 1000)
                              );
                              const ovulationDate = new Date(
                                nextPeriodDate.getTime() - (14 * 24 * 60 * 60 * 1000)
                              );
                              const testDate = new Date(ovulationDate);
                              testDate.setDate(testDate.getDate() + 12);
                              
                              return testDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'long', 
                                day: 'numeric',
                                year: 'numeric'
                              });
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Start tracking your cycle to see predictions.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
