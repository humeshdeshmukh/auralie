'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

type UserProfile = {
  displayName: string;
  photoURL?: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  lastPeriod?: string;
  cycleLength?: number;
  periodLength?: number;
  createdAt: string;
  updatedAt: string;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    displayName: '',
    birthDate: '',
    height: 0,
    weight: 0,
    bloodType: '',
    lastPeriod: '',
    cycleLength: 28,
    periodLength: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Memoize the fetch function to prevent unnecessary recreations
  const fetchUserProfile = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // Add a small delay to show loading state (remove in production if not needed)
      const [userDoc] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        new Promise(resolve => setTimeout(resolve, 300)) // Simulate loading
      ]);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile(prev => ({
          ...prev,
          displayName: userData.displayName || user.displayName || user.email?.split('@')[0] || 'User',
          ...userData.profile
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  // Fetch data on component mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: name === 'height' || name === 'weight' || name === 'cycleLength' || name === 'periodLength'
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      // Show loading state
      setLoading(true);
      
      const updatedProfile = {
        ...profile,
        updatedAt: new Date().toISOString()
      };

      // Create a clean profile object without the fields that should be top-level
      const { displayName, ...profileData } = updatedProfile;

      // Save to Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName,
        profile: profileData,
        updatedAt: updatedProfile.updatedAt
      });

      // Update local state
      setProfile(prev => ({
        ...prev,
        ...updatedProfile
      }));
      
      // Show success message and return to view mode
      setEditing(false);
      
      // Optional: Show a toast notification instead of alert
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out';
      toast.textContent = 'Profile updated successfully!';
      document.body.appendChild(toast);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => toast.remove(), 500);
      }, 3000);
      
      // Log feature usage (you can replace this with your analytics service)
      console.log('Profile updated:', updatedProfile);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Show error message
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out';
      errorToast.textContent = 'Failed to update profile. Please try again.';
      document.body.appendChild(errorToast);
      
      // Remove error toast after 5 seconds
      setTimeout(() => {
        errorToast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => errorToast.remove(), 500);
      }, 5000);
      
    } finally {
      setLoading(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Profile Header Skeleton */}
        <div className="bg-gradient-to-r from-primary/5 to-background-secondary/20 px-6 py-8 rounded-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-24 h-24 rounded-full bg-gray-200"></div>
            <div className="space-y-2 flex-1">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>

        {/* Profile Details Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j}>
                    <div className="h-4 bg-gray-100 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary/5 to-background-secondary/20 px-6 py-8 rounded-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {profile.photoURL ? (
                <Image 
                  src={profile.photoURL} 
                  alt={profile.displayName} 
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {profile.displayName?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {editing && (
              <button className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white text-primary text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-gray-200">
                Change
              </button>
            )}
          </div>
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                name="displayName"
                value={profile.displayName}
                onChange={handleInputChange}
                className="text-2xl font-bold bg-transparent border-b border-primary/30 focus:outline-none focus:border-primary w-full max-w-md"
              />
            ) : (
              <h1 className="text-2xl font-bold text-text-primary">{profile.displayName}</h1>
            )}
            <p className="text-text-secondary mt-1">{user?.email}</p>
            <p className="text-sm text-text-secondary mt-2">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-3">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-text-primary border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-text-primary mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Birth Date
              </label>
              {editing ? (
                <input
                  type="date"
                  name="birthDate"
                  value={profile.birthDate || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-text-primary focus:ring-primary focus:border-primary"
                />
              ) : (
                <p className="text-text-primary">
                  {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString() : 'Not set'}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Height (cm)
                </label>
                {editing ? (
                  <input
                    type="number"
                    name="height"
                    value={profile.height || ''}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-text-primary focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-text-primary">{profile.height || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Weight (kg)
                </label>
                {editing ? (
                  <input
                    type="number"
                    name="weight"
                    value={profile.weight || ''}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-text-primary focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-text-primary">{profile.weight || 'Not set'}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Blood Type
              </label>
              {editing ? (
                <select
                  name="bloodType"
                  value={profile.bloodType || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-text-primary focus:ring-primary focus:border-primary"
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              ) : (
                <p className="text-text-primary">{profile.bloodType || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Cycle Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-text-primary mb-4">Cycle Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Last Period Start Date
              </label>
              {editing ? (
                <input
                  type="date"
                  name="lastPeriod"
                  value={profile.lastPeriod || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-text-primary focus:ring-primary focus:border-primary"
                />
              ) : (
                <p className="text-text-primary">
                  {profile.lastPeriod ? new Date(profile.lastPeriod).toLocaleDateString() : 'Not set'}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Cycle Length (days)
                </label>
                {editing ? (
                  <input
                    type="number"
                    name="cycleLength"
                    min="21"
                    max="45"
                    value={profile.cycleLength || 28}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-text-primary focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-text-primary">{profile.cycleLength || 28} days</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Period Length (days)
                </label>
                {editing ? (
                  <input
                    type="number"
                    name="periodLength"
                    min="1"
                    max="14"
                    value={profile.periodLength || 5}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-text-primary focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-text-primary">{profile.periodLength || 5} days</p>
                )}
              </div>
            </div>
            {!editing && profile.lastPeriod && profile.cycleLength && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="text-sm text-text-secondary">
                  Next period: {new Date(new Date(profile.lastPeriod).getTime() + (profile.cycleLength * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  Fertile window: {
                    // Show fertile window (ovulation day ± 3 days)
                    (() => {
                      const nextPeriod = new Date(profile.lastPeriod);
                      nextPeriod.setDate(nextPeriod.getDate() + (profile.cycleLength || 28));
                      const ovulationDay = new Date(nextPeriod);
                      ovulationDay.setDate(ovulationDay.getDate() - 14);
                      const fertileStart = new Date(ovulationDay);
                      fertileStart.setDate(fertileStart.getDate() - 3);
                      const fertileEnd = new Date(ovulationDay);
                      fertileEnd.setDate(fertileEnd.getDate() + 3);
                      
                      return `${fertileStart.toLocaleDateString()} - ${fertileEnd.toLocaleDateString()}`;
                    })()
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
