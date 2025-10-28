'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    darkMode: false,
    cycleLength: 28,
    periodLength: 5,
    healthMetrics: {
      weight: false,
      temperature: true,
      mood: true,
      symptoms: true,
    },
  });

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().settings) {
          setSettings(prev => ({
            ...prev,
            ...userDoc.data().settings
          }));
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, [user, router]);

  const handleSettingChange = async (field: string, value: any) => {
    if (!user) return;

    const updatedSettings = {
      ...settings,
      [field]: value
    };

    setSettings(updatedSettings);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        settings: updatedSettings,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleHealthMetricChange = async (metric: string, value: boolean) => {
    if (!user) return;

    const updatedMetrics = {
      ...settings.healthMetrics,
      [metric]: value
    };

    const updatedSettings = {
      ...settings,
      healthMetrics: updatedMetrics
    };

    setSettings(updatedSettings);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.healthMetrics': updatedMetrics,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating health metrics:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-bold text-text-primary">Settings</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-8">
        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-text-primary mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Email Notifications</p>
                <p className="text-sm text-text-secondary">Receive email updates and notifications</p>
              </div>
              <button
                onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  settings.emailNotifications ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Health Tracking Preferences */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-text-primary mb-4">Health Tracking</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Average Cycle Length (days)
                </label>
                <input
                  type="number"
                  min="21"
                  max="45"
                  value={settings.cycleLength}
                  onChange={(e) => handleSettingChange('cycleLength', parseInt(e.target.value) || 28)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-text-primary focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Average Period Length (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={settings.periodLength}
                  onChange={(e) => handleSettingChange('periodLength', parseInt(e.target.value) || 5)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-text-primary focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Health Metrics */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-text-primary mb-4">Tracked Health Metrics</h3>
          <p className="text-sm text-text-secondary mb-4">
            Select which health metrics you want to track in your daily logs
          </p>
          <div className="space-y-3">
            {Object.entries(settings.healthMetrics).map(([metric, isEnabled]) => (
              <div key={metric} className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary capitalize">
                  {metric}
                </span>
                <button
                  onClick={() => handleHealthMetricChange(metric, !isEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    isEnabled ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
