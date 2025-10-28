'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { ArrowRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type CycleEntry = {
  id: string;
  date: string;
  flow: 'light' | 'medium' | 'heavy' | 'spotting' | 'none';
  mood: string;
  symptoms: string[];
  notes?: string;
};

const RecentEntries = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchEntries = async () => {
      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching entries for user:', user.uid);
        setLoading(true);
        setError(null);
        
        const entriesQuery = query(
          collection(db, 'users', user.uid, 'entries'),
          orderBy('date', 'desc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(entriesQuery);
        console.log('Query snapshot size:', querySnapshot.size);
        
        if (!isMounted) return;
        
        const fetchedEntries: CycleEntry[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Raw document data:', doc.id, data);
          
          let dateValue;
          if (data.date?.toDate) {
            dateValue = data.date.toDate();
          } else if (data.date) {
            dateValue = new Date(data.date);
          } else {
            console.warn('No date found in document:', doc.id);
            return;
          }
          
          if (!isValid(dateValue)) {
            console.warn('Invalid date in document:', doc.id, data.date);
            return;
          }
          
          const entry = {
            id: doc.id,
            date: dateValue.toISOString(),
            flow: data.flow || 'none',
            mood: data.mood || 'normal',
            symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
            notes: data.notes || ''
          };
          
          console.log('Processed entry:', entry);
          fetchedEntries.push(entry);
        });
        
        console.log('Fetched entries:', fetchedEntries);
        setEntries(fetchedEntries);
      } catch (err) {
        console.error('Error fetching entries:', err);
        if (isMounted) {
          setError('Failed to load recent entries. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEntries();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Entries</h3>
          <button 
            className="text-sm font-medium text-pink-600 hover:text-pink-700 focus:outline-none"
            disabled
          >
            View All
          </button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-full"></div>
              <div className="h-3 bg-gray-100 rounded w-2/3 mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Entries</h3>
        </div>
        <div className="text-center py-4 text-red-500">
          {error}
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-pink-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Entries</h3>
        <button 
          className="text-sm font-medium text-pink-600 hover:text-pink-700 focus:outline-none"
        >
          View All
        </button>
      </div>
      
      {entries.length === 0 ? (
        <div className="text-center py-8">
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No entries yet</h3>
          <p className="mt-1 text-sm text-gray-500">Start tracking your cycle to see your history.</p>
          <div className="mt-4">
            <button
              onClick={() => {
                // You can add a function to open the log entry form here
                console.log('Add new entry clicked');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Your First Entry
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div 
              key={entry.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {isValid(parseISO(entry.date)) 
                        ? format(parseISO(entry.date), 'MMMM d, yyyy')
                        : 'Invalid date'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entry.flow === 'heavy' ? 'bg-red-100 text-red-800' :
                          entry.flow === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          entry.flow === 'light' ? 'bg-green-100 text-green-800' :
                          entry.flow === 'spotting' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {entry.flow.charAt(0).toUpperCase() + entry.flow.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {entry.notes && (
                    <p className="text-sm text-gray-600 mt-2">{entry.notes}</p>
                  )}
                  
                  {entry.symptoms && entry.symptoms.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {entry.symptoms.map((symptom, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentEntries;