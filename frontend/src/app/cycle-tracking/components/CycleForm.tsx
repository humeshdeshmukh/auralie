'use client';

import { useState, useEffect, useRef } from 'react';
import { CycleEntry } from '../types';

interface CycleFormProps {
  initialData?: CycleEntry;
  onSubmit: (data: Omit<CycleEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const FLOW_LEVELS = [
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

const COMMON_SYMPTOMS = [
  'Cramps', 'Headache', 'Bloating', 'Fatigue', 'Mood swings',
  'Breast tenderness', 'Acne', 'Back pain', 'Nausea', 'Food cravings'
];

export default function CycleForm({ initialData, onSubmit, onCancel, isLoading }: CycleFormProps) {
  const [formData, setFormData] = useState<Omit<CycleEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>({
    startDate: '',
    endDate: '',
    flowLevel: 'medium',
    symptoms: [],
    notes: '',
    mood: '',
    temperature: undefined,
    weight: undefined,
    isPredicted: false,
  });

  const [symptomInput, setSymptomInput] = useState('');
  const [showSymptomSuggestions, setShowSymptomSuggestions] = useState(false);
  const [filteredSymptoms, setFilteredSymptoms] = useState<string[]>([]);

  // Use a ref to track initial data to prevent unnecessary effect re-runs
  const initialDataRef = useRef(initialData);
  
  // Initialize form with initialData if provided
  useEffect(() => {
    const initializeForm = () => {
      const data = initialDataRef.current;
      if (data) {
        const { id, userId, createdAt, updatedAt, ...formData } = data;
        return {
          ...formData,
          symptoms: formData.symptoms || [],
          isPredicted: formData.isPredicted || false
        };
      }
      return {
        startDate: new Date().toISOString().split('T')[0],
        endDate: undefined,
        flowLevel: 'medium' as const,
        symptoms: [],
        notes: '',
        mood: undefined,
        temperature: undefined,
        weight: undefined,
        isPredicted: false
      };
    };
    
    setFormData(initializeForm());
  }, []); // Empty dependency array since we're using ref

  // Filter symptoms based on input
  useEffect(() => {
    const filterSymptoms = () => {
      if (symptomInput.trim() === '') {
        return COMMON_SYMPTOMS.filter(s => !formData.symptoms.includes(s));
      }
      return COMMON_SYMPTOMS.filter(
        s => s.toLowerCase().includes(symptomInput.toLowerCase()) && 
             !formData.symptoms.includes(s)
      );
    };
    
    // Use requestAnimationFrame to defer state update
    const rafId = requestAnimationFrame(() => {
      setFilteredSymptoms(filterSymptoms());
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [symptomInput, formData.symptoms]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' && value ? parseFloat(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAddSymptom = (symptom: string) => {
    if (symptom.trim() && !formData.symptoms.includes(symptom)) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptom],
      }));
      setSymptomInput('');
      setShowSymptomSuggestions(false);
    }
  };

  const handleRemoveSymptom = (symptomToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter(s => s !== symptomToRemove),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If end date is not set, set it to start date
    const entryData = {
      ...formData,
      endDate: formData.endDate || formData.startDate,
    };
    
    onSubmit(entryData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm bg-white text-gray-900"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm bg-white text-gray-900"
            value={formData.endDate}
            onChange={handleChange}
            min={formData.startDate}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Flow Level <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {FLOW_LEVELS.map(level => (
            <label key={level.value} className="flex items-center space-x-2">
              <input
                type="radio"
                name="flowLevel"
                value={level.value}
                checked={formData.flowLevel === level.value}
                onChange={handleChange}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500"
                required
              />
              <span className="text-sm text-gray-700">{level.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">
          Symptoms
        </label>
        <div className="relative">
          <input
            type="text"
            value={symptomInput}
            onChange={(e) => {
              setSymptomInput(e.target.value);
              setShowSymptomSuggestions(true);
            }}
            onFocus={() => setShowSymptomSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSymptomSuggestions(false), 200)}
            placeholder="Add symptoms..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm bg-white text-gray-900"
          />
          
          {showSymptomSuggestions && filteredSymptoms.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
              {filteredSymptoms.map((symptom) => (
                <div
                  key={symptom}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleAddSymptom(symptom)}
                >
                  {symptom}
                </div>
              ))}
            </div>
          )}
          
          {symptomInput && !filteredSymptoms.some(s => s.toLowerCase() === symptomInput.toLowerCase()) && (
            <button
              type="button"
              onClick={() => handleAddSymptom(symptomInput)}
              className="absolute right-2 top-2 text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded"
            >
              Add
            </button>
          )}
        </div>
        
        {formData.symptoms.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.symptoms.map((symptom) => (
              <span 
                key={symptom} 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800"
              >
                {symptom}
                <button
                  type="button"
                  onClick={() => handleRemoveSymptom(symptom)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-pink-600 hover:bg-pink-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="mood" className="block text-sm font-medium text-gray-700">
            Mood
          </label>
          <select
            id="mood"
            name="mood"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm bg-white text-gray-900"
            value={formData.mood || ''}
            onChange={handleChange}
          >
            <option value="">Select mood</option>
            <option value="happy">😊 Happy</option>
            <option value="sad">😢 Sad</option>
            <option value="energetic">⚡ Energetic</option>
            <option value="tired">😴 Tired</option>
            <option value="stressed">😫 Stressed</option>
            <option value="calm">😌 Calm</option>
            <option value="anxious">😰 Anxious</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
            Temperature (°C)
          </label>
          <input
            type="number"
            id="temperature"
            name="temperature"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm bg-white text-gray-900"
            step="0.1"
            min="35"
            max="42"
            value={formData.temperature || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm bg-white text-gray-900"
          value={formData.notes || ''}
          onChange={handleChange}
          placeholder="Any additional notes about your cycle..."
        />
      </div>

      <div className="flex items-center">
        <input
          id="isPredicted"
          name="isPredicted"
          type="checkbox"
          checked={formData.isPredicted || false}
          onChange={handleCheckboxChange}
          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
        />
        <label htmlFor="isPredicted" className="ml-2 block text-sm text-gray-700">
          Mark as predicted period
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {initialData ? 'Updating...' : 'Saving...'}
            </>
          ) : initialData ? 'Update Entry' : 'Add Entry'}
        </button>
      </div>
    </form>
  );
}
