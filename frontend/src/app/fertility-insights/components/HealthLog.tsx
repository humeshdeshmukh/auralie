'use client';

import { FertilityEntry } from '../types';
import { format } from 'date-fns';

// Type for Firestore Timestamp
interface Timestamp {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
}

interface HealthLogProps {
  entries: FertilityEntry[];
  onEntrySelect: (entry: FertilityEntry) => void;
  selectedDate: Date;
}

export default function HealthLog({ entries, onEntrySelect, selectedDate }: HealthLogProps) {
  // Helper function to format symptom list
  const formatSymptoms = (symptoms: string[]) => {
    if (!symptoms || symptoms.length === 0) return 'No symptoms recorded';
    return symptoms.map(s => s.replace(/_/g, ' ')).join(', ');
  };

  // Helper to safely parse date
  const parseEntryDate = (date: string | Timestamp | Date) => {
    if (typeof date === 'string') return new Date(date);
    if (date instanceof Date) return date;
    return date.toDate(); // Handle Firestore Timestamp
  };

  // Filter entries for the selected date
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const dailyEntries = entries.filter(entry => {
    const entryDate = parseEntryDate(entry.date);
    return format(entryDate, 'yyyy-MM-dd') === selectedDateKey;
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-black">Health Log - {format(selectedDate, 'MMMM d, yyyy')}</h3>
      
      {dailyEntries.length > 0 ? (
        <div className="space-y-3">
          {dailyEntries.map((entry, index) => (
            <div 
              key={index}
              onClick={() => onEntrySelect(entry)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-black">
                    {entry.mood ? `Mood: ${['😞', '🙁', '😐', '🙂', '😊'][entry.mood - 1]}` : 'No mood recorded'}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {entry.basalBodyTemp ? `${entry.basalBodyTemp}°C` : 'No temperature recorded'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatSymptoms(entry.symptoms || [])}
                  </p>
                </div>
                {entry.notes && (
                  <span className="text-xs text-blue-600">View Notes</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No health data recorded for this day</p>
          <p className="text-sm text-gray-400 mt-1">Add your health information to track patterns</p>
        </div>
      )}
    </div>
  );
}
