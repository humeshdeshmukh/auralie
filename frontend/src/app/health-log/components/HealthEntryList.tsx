'use client';

import { HealthEntry } from '../types';
import { format, parseISO } from 'date-fns';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface HealthEntryListProps {
  entries: HealthEntry[];
  onEdit: (entry: HealthEntry) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

export default function HealthEntryList({ entries, onEdit, onDelete, isLoading }: HealthEntryListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No entries</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new health entry.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Metrics
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Symptoms
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Mood & Energy
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {format(parseISO(entry.date), 'MMM d, yyyy')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(parseISO(entry.date), 'h:mm a')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {entry.metrics.weight && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {entry.metrics.weight} kg
                      </span>
                    )}
                    {entry.metrics.bloodPressure && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {entry.metrics.bloodPressure.systolic}/{entry.metrics.bloodPressure.diastolic} BP
                      </span>
                    )}
                    {entry.metrics.heartRate && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {entry.metrics.heartRate} BPM
                      </span>
                    )}
                    {entry.metrics.temperature && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {entry.metrics.temperature}°C
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {entry.symptoms.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {entry.symptoms.slice(0, 3).map((symptom, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
                          title={`Severity: ${symptom.severity}/5${symptom.notes ? ` - ${symptom.notes}` : ''}`}
                        >
                          {symptom.name}
                        </span>
                      ))}
                      {entry.symptoms.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          +{entry.symptoms.length - 3} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No symptoms</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Mood</div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        entry.mood <= 2 ? 'bg-red-100 text-red-600' : 
                        entry.mood <= 3 ? 'bg-yellow-100 text-yellow-600' : 
                        'bg-green-100 text-green-600'
                      }`}>
                        {entry.mood}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Energy</div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        entry.energyLevel <= 2 ? 'bg-red-100 text-red-600' : 
                        entry.energyLevel <= 3 ? 'bg-yellow-100 text-yellow-600' : 
                        'bg-green-100 text-green-600'
                      }`}>
                        {entry.energyLevel}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(entry)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
