'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Check, Plus, X } from 'lucide-react';
import { SymptomType, FertilityEntry } from '../types';

const SYMPTOMS: SymptomType[] = [
  { id: 'headache', name: 'Headache', icon: '🤕', category: 'physical' },
  { id: 'cramps', name: 'Cramps', icon: '🩹', category: 'physical' },
  { id: 'bloating', name: 'Bloating', icon: '🎈', category: 'physical' },
  { id: 'tender_breasts', name: 'Tender Breasts', icon: '👙', category: 'physical' },
  { id: 'acne', name: 'Acne', icon: '🌟', category: 'physical' },
  { id: 'backache', name: 'Backache', icon: '🦴', category: 'physical' },
  { id: 'fatigue', name: 'Fatigue', icon: '😴', category: 'physical' },
  { id: 'nausea', name: 'Nausea', icon: '🤢', category: 'physical' },
  { id: 'cervical_mucus', name: 'Egg White CM', icon: '💧', category: 'fertility' },
  { id: 'cervical_position', name: 'High Cervix', icon: '👆', category: 'fertility' },
  { id: 'libido_high', name: 'High Libido', icon: '💘', category: 'fertility' },
  { id: 'mood_swings', name: 'Mood Swings', icon: '🎭', category: 'emotional' },
  { id: 'anxiety', name: 'Anxiety', icon: '😰', category: 'emotional' },
  { id: 'irritability', name: 'Irritability', icon: '😠', category: 'emotional' },
  { id: 'insomnia', name: 'Insomnia', icon: '🌙', category: 'physical' },
  { id: 'food_craving', name: 'Food Cravings', icon: '🍫', category: 'physical' },
];

interface SymptomTrackerProps {
  selectedDate: Date;
  entry: FertilityEntry | null;
  onSave: (data: Partial<FertilityEntry>) => void;
}

export default function SymptomTracker({ selectedDate, entry, onSave }: SymptomTrackerProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(
    new Set(entry?.symptoms || [])
  );
  const [mood, setMood] = useState<number | undefined>(entry?.mood);
  const [temperature, setTemperature] = useState<number | undefined>(
    entry?.basalBodyTemp
  );
  const [notes, setNotes] = useState(entry?.notes || '');
  const [showCustomSymptom, setShowCustomSymptom] = useState(false);
  const [customSymptom, setCustomSymptom] = useState('');
  const [customSymptoms, setCustomSymptoms] = useState<SymptomType[]>([]);

  useEffect(() => {
    if (entry) {
      setSelectedSymptoms(new Set(entry.symptoms || []));
      setMood(entry.mood);
      setTemperature(entry.basalBodyTemp);
      setNotes(entry.notes || '');
    } else {
      setSelectedSymptoms(new Set());
      setMood(undefined);
      setTemperature(undefined);
      setNotes('');
    }
  }, [entry]);

  const toggleSymptom = (symptomId: string) => {
    const newSelected = new Set(selectedSymptoms);
    if (newSelected.has(symptomId)) {
      newSelected.delete(symptomId);
    } else {
      newSelected.add(symptomId);
    }
    setSelectedSymptoms(newSelected);
  };

  const handleSave = () => {
    onSave({
      date: selectedDate.toISOString(),
      symptoms: Array.from(selectedSymptoms),
      mood,
      basalBodyTemp: temperature,
      notes: notes.trim() || undefined,
    });
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim()) {
      const newSymptom: SymptomType = {
        id: customSymptom.toLowerCase().replace(/\s+/g, '_'),
        name: customSymptom.trim(),
        icon: '➕',
        category: 'other',
      };
      setCustomSymptoms([...customSymptoms, newSymptom]);
      setCustomSymptom('');
      setShowCustomSymptom(false);
    }
  };

  const allSymptoms = [...SYMPTOMS, ...customSymptoms];
  const symptomsByCategory = allSymptoms.reduce<Record<string, SymptomType[]>>(
    (acc, symptom) => {
      if (!acc[symptom.category]) {
        acc[symptom.category] = [];
      }
      acc[symptom.category].push(symptom);
      return acc;
    },
    {}
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center"
        >
          <Check className="w-4 h-4 mr-2" />
          Save
        </button>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Mood</h4>
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => setMood(level)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                mood === level ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              aria-label={`Mood level ${level}`}
            >
              {['😢', '🙁', '😐', '🙂', '😊'][level - 1]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Basal Body Temperature (°C)
        </label>
        <input
          type="number"
          step="0.1"
          min="35"
          max="40"
          value={temperature || ''}
          onChange={(e) => setTemperature(e.target.value ? parseFloat(e.target.value) : undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="e.g. 36.5"
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-700">Symptoms</h4>
          {!showCustomSymptom ? (
            <button
              onClick={() => setShowCustomSymptom(true)}
              className="text-sm text-primary hover:text-primary-dark flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Custom
            </button>
          ) : (
            <div className="flex space-x-2">
              <input
                type="text"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                placeholder="Enter symptom name"
                className="text-sm border-b border-gray-300 focus:outline-none focus:border-primary"
                autoFocus
              />
              <button
                onClick={addCustomSymptom}
                className="text-green-600 hover:text-green-800"
                aria-label="Add symptom"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setShowCustomSymptom(false);
                  setCustomSymptom('');
                }}
                className="text-red-600 hover:text-red-800"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {Object.entries(symptomsByCategory).map(([category, symptoms]) => (
            <div key={category}>
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {category}
              </h5>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom) => (
                  <button
                    key={symptom.id}
                    onClick={() => toggleSymptom(symptom.id)}
                    className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
                      selectedSymptoms.has(symptom.id)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1.5">{symptom.icon}</span>
                    {symptom.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent h-24"
          placeholder="Add any additional notes about your day..."
        />
      </div>
    </div>
  );
}
