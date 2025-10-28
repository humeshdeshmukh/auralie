'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

type CycleSettings = {
  averageCycleLength: number;
  averagePeriodLength: number;
  lastPeriodDate: string;
  periodPredictions: boolean;
  symptomTracking: boolean;
  moodTracking: boolean;
  notifications: boolean;
  notificationTime: string;
};

export default function CycleSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<CycleSettings>({
    averageCycleLength: 28,
    averagePeriodLength: 5,
    lastPeriodDate: new Date().toISOString().split('T')[0],
    periodPredictions: true,
    symptomTracking: true,
    moodTracking: true,
    notifications: true,
    notificationTime: '09:00',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      try {
        const docRef = doc(db, 'users', user.uid, 'settings', 'cycle');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSettings(prev => ({
            ...prev,
            ...docSnap.data(),
            lastPeriodDate: docSnap.data().lastPeriodDate?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
          }));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'cycle');
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm font-medium text-pink-600 hover:text-pink-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Cycle Tracking
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Cycle Settings</h1>
          <p className="mt-2 text-sm text-gray-500">
            Customize your cycle tracking preferences
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Cycle Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Your personal cycle details help improve predictions
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Average Cycle Length
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="max-w-xs">
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="number"
                          name="averageCycleLength"
                          min="21"
                          max="45"
                          value={settings.averageCycleLength}
                          onChange={handleChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">days</span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Typically between 21-35 days
                      </p>
                    </div>
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Average Period Length
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="max-w-xs">
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="number"
                          name="averagePeriodLength"
                          min="1"
                          max="14"
                          value={settings.averagePeriodLength}
                          onChange={handleChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">days</span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Typically between 3-7 days
                      </p>
                    </div>
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Last Period Start
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="max-w-xs">
                      <input
                        type="date"
                        name="lastPeriodDate"
                        value={settings.lastPeriodDate}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Tracking Preferences</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Customize what you want to track
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Track Symptoms</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        id="symptom-tracking"
                        name="symptomTracking"
                        type="checkbox"
                        checked={settings.symptomTracking}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <label htmlFor="symptom-tracking" className="ml-2 block text-sm text-gray-700">
                        Record symptoms like cramps, headaches, etc.
                      </label>
                    </div>
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Track Mood</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        id="mood-tracking"
                        name="moodTracking"
                        type="checkbox"
                        checked={settings.moodTracking}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <label htmlFor="mood-tracking" className="ml-2 block text-sm text-gray-700">
                        Track daily mood changes
                      </label>
                    </div>
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Period Predictions</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        id="period-predictions"
                        name="periodPredictions"
                        type="checkbox"
                        checked={settings.periodPredictions}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <label htmlFor="period-predictions" className="ml-2 block text-sm text-gray-700">
                        Show period predictions
                      </label>
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                When and how you want to be notified
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Enable Notifications</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        id="notifications"
                        name="notifications"
                        type="checkbox"
                        checked={settings.notifications}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700">
                        Receive notifications about your cycle
                      </label>
                    </div>
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Daily Reminder</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="max-w-xs">
                      <input
                        type="time"
                        name="notificationTime"
                        value={settings.notificationTime}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                        disabled={!settings.notifications}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Time to receive daily reminders
                      </p>
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  {saveSuccess ? (
                    <>
                      <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                      Saved!
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
