'use client';

import { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

type FlowType = 'light' | 'medium' | 'heavy' | 'spotting' | 'none';
type MoodType = 'happy' | 'sad' | 'stressed' | 'anxious' | 'tired' | 'energetic' | 'normal';

interface QuickLogProps {
  onLogAdded: () => void;
}

const QuickLog: React.FC<QuickLogProps> = ({ onLogAdded }) => {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  const [flow, setFlow] = useState<FlowType>('none');
  const [mood, setMood] = useState<MoodType>('normal');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const symptomOptions = [
    'Cramps', 'Headache', 'Backache', 'Bloating', 'Tender breasts',
    'Acne', 'Nausea', 'Dizziness', 'Fatigue', 'Insomnia'
  ];

  const toggleSymptom = (symptom: string) => {
    setSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Logging entry:', { date, flow, mood, symptoms, notes });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setFlow('none');
      setMood('normal');
      setSymptoms([]);
      setNotes('');
      setShowForm(false);
      
      // Refresh parent component
      onLogAdded();
    } catch (err) {
      console.error('Error saving log:', err);
      setError('Failed to save entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center p-6 border-2 border-dashed border-pink-200 rounded-xl hover:border-pink-400 transition-colors bg-pink-50 hover:bg-pink-100"
      >
        <PlusIcon className="h-6 w-6 text-pink-500 mr-2" />
        <span className="text-pink-700 font-medium text-lg">Quick Log</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Log Your Cycle</h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-400 hover:text-gray-600"
          disabled={isSubmitting}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-800"
              required
              disabled={isSubmitting}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Flow Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Flow</label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { value: 'none', label: 'None', bg: 'bg-gray-100', text: 'text-gray-800', selected: 'ring-2 ring-pink-500 ring-offset-1' },
              { value: 'spotting', label: 'Spot', bg: 'bg-pink-100', text: 'text-pink-800', selected: 'ring-2 ring-pink-500 ring-offset-1' },
              { value: 'light', label: 'Light', bg: 'bg-pink-200', text: 'text-pink-900', selected: 'ring-2 ring-pink-500 ring-offset-1' },
              { value: 'medium', label: 'Medium', bg: 'bg-pink-400', text: 'text-white', selected: 'ring-2 ring-pink-700 ring-offset-1' },
              { value: 'heavy', label: 'Heavy', bg: 'bg-pink-600', text: 'text-white', selected: 'ring-2 ring-pink-800 ring-offset-1' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFlow(option.value as FlowType)}
                disabled={isSubmitting}
                className={`py-2.5 px-1 text-sm font-medium rounded-lg transition-all ${
                  flow === option.value 
                    ? `${option.bg} ${option.text} ${option.selected} shadow-sm` 
                    : `${option.bg} ${option.text} hover:opacity-90`
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Mood Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mood</label>
          <div className="flex space-x-2 overflow-x-auto pb-2 -mx-1 px-1">
            {[
              { value: 'happy', emoji: '😊', label: 'Happy' },
              { value: 'sad', emoji: '😢', label: 'Sad' },
              { value: 'stressed', emoji: '😫', label: 'Stressed' },
              { value: 'anxious', emoji: '😰', label: 'Anxious' },
              { value: 'tired', emoji: '😴', label: 'Tired' },
              { value: 'energetic', emoji: '💪', label: 'Energetic' },
              { value: 'normal', emoji: '😐', label: 'Normal' },
            ].map((moodOption) => (
              <button
                key={moodOption.value}
                type="button"
                onClick={() => setMood(moodOption.value as MoodType)}
                disabled={isSubmitting}
                className={`flex flex-col items-center p-2 rounded-xl min-w-[70px] transition-all ${
                  mood === moodOption.value
                    ? 'bg-pink-100 text-pink-700 shadow-sm ring-1 ring-pink-300'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl mb-1">{moodOption.emoji}</span>
                <span className="text-xs font-medium">{moodOption.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Symptoms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
          <div className="flex flex-wrap gap-2">
            {symptomOptions.map((symptom) => (
              <button
                key={symptom}
                type="button"
                onClick={() => toggleSymptom(symptom)}
                disabled={isSubmitting}
                className={`px-4 py-1.5 text-sm rounded-full transition-all ${
                  symptoms.includes(symptom)
                    ? 'bg-pink-100 text-pink-800 border border-pink-300 font-medium'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>
        
        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-800"
            placeholder="How are you feeling today?"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => !isSubmitting && setShowForm(false)}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-70 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuickLog;