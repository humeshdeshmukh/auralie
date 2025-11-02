'use client';

import React, { useEffect, useState } from 'react';
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
  { id: 'food_craving', name: 'Food Cravings', icon: '🍫', category: 'physical' }
];

interface SymptomTrackerProps {
  selectedDate: Date;
  entry: FertilityEntry | null;
  onSave: (data: Partial<FertilityEntry>) => Promise<void> | void;
}

export default function SymptomTracker({ selectedDate, entry, onSave }: SymptomTrackerProps) {
  // store values as arrays/primitive for stable renders
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(entry?.symptoms || []);
  const [mood, setMood] = useState<number | undefined>(entry?.mood);
  const [temperature, setTemperature] = useState<number | undefined>(entry?.basalBodyTemp);
  const [notes, setNotes] = useState(entry?.notes || '');
  const [showCustomSymptom, setShowCustomSymptom] = useState(false);
  const [customSymptom, setCustomSymptom] = useState('');
  const [customSymptoms, setCustomSymptoms] = useState<SymptomType[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setSelectedSymptoms(Array.isArray(entry.symptoms) ? [...entry.symptoms] : []);
      setMood(entry.mood);
      setTemperature(entry.basalBodyTemp);
      setNotes(entry.notes || '');
    } else {
      setSelectedSymptoms([]);
      setMood(undefined);
      setTemperature(undefined);
      setNotes('');
    }
    setSavedAt(null);
    setError(null);
  }, [entry, selectedDate]);

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => (prev.includes(symptomId) ? prev.filter(s => s !== symptomId) : [...prev, symptomId]));
  };

  const addCustomSymptom = () => {
    const trimmed = customSymptom.trim();
    if (!trimmed) return;
    const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if ([...SYMPTOMS, ...customSymptoms].some(s => s.id === id)) {
      setCustomSymptom('');
      setShowCustomSymptom(false);
      return;
    }
    const newSymptom: SymptomType = { id, name: trimmed, icon: '➕', category: 'other' };
    setCustomSymptoms(prev => [...prev, newSymptom]);
    setSelectedSymptoms(prev => [...prev, id]);
    setCustomSymptom('');
    setShowCustomSymptom(false);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload: Partial<FertilityEntry> = {
        date: selectedDate.toISOString(),
        symptoms: selectedSymptoms,
        mood,
        basalBodyTemp: temperature,
        notes: notes.trim() || undefined
      };
      await Promise.resolve(onSave(payload));
      setSavedAt(new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const allSymptoms = [...SYMPTOMS, ...customSymptoms];
  const symptomsByCategory = allSymptoms.reduce<Record<string, SymptomType[]>>((acc, s) => {
    acc[s.category] = acc[s.category] || [];
    acc[s.category].push(s);
    return acc;
  }, {});

  // helper: map symptom id -> display name
  const idToName = (id: string) => {
    const found = allSymptoms.find(s => s.id === id);
    return found ? found.name : id;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-3xl mx-auto border border-gray-100">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-black">{format(selectedDate, 'MMMM d, yyyy')}</h2>
          <p className="mt-1 text-sm text-gray-600 max-w-lg">Log symptoms, mood and temperature for the selected day.</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Save entry"
          >
            <Check className="w-4 h-4" />
            <span className="font-medium">{saving ? 'Saving...' : 'Save'}</span>
          </button>

          <div className="text-xs text-gray-500">{selectedSymptoms.length} symptoms</div>
          {savedAt && <div className="text-xs text-green-600">Saved at {format(new Date(savedAt), 'hh:mm a')}</div>}
          {error && <div className="text-xs text-red-600">Error: {error}</div>}
        </div>
      </div>

      {/* Mood */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Mood</h3>
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => setMood(level)}
              aria-pressed={mood === level}
              aria-label={`Mood level ${level}`}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-2xl shadow-sm transition-shadow focus:outline-none focus:ring-2 ${
                mood === level ? 'bg-primary text-white ring-primary/50' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {['😢', '🙁', '😐', '🙂', '😊'][level - 1]}
            </button>
          ))}

          <div className="ml-4 text-sm text-gray-600">
            <div className="font-medium text-black">Selected mood</div>
            <div className="text-xs text-black">{mood ? ['Very low','Low','Neutral','Good','Great'][mood - 1] : 'Not set'}</div>
          </div>
        </div>
      </section>

      {/* Temperature */}
      <section className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Basal Body Temperature (°C)</label>
        <input
          type="number"
          step="0.1"
          min="30"
          max="45"
          value={temperature ?? ''}
          onChange={(e) => setTemperature(e.target.value ? parseFloat(e.target.value) : undefined)}
          className="w-40 px-3 py-2 border border-gray-300 rounded-md text-black text-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="e.g. 36.5"
          aria-label="Basal body temperature"
        />
        <p className="mt-2 text-xs text-gray-500">Tip: measure first thing in the morning for consistency.</p>
      </section>

      {/* Symptoms */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Symptoms</h3>

          {!showCustomSymptom ? (
            <button
              onClick={() => setShowCustomSymptom(true)}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline focus:outline-none"
              aria-expanded={showCustomSymptom}
            >
              <Plus className="w-4 h-4" />
              Add custom
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                placeholder="New symptom"
                className="px-2 py-1 border-b border-gray-300 focus:outline-none text-black"
                aria-label="Custom symptom"
              />
              <button onClick={addCustomSymptom} className="text-green-600" aria-label="Add custom symptom"><Check /></button>
              <button onClick={() => { setShowCustomSymptom(false); setCustomSymptom(''); }} className="text-red-600" aria-label="Cancel custom symptom"><X /></button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {Object.entries(symptomsByCategory).map(([category, symptoms]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{category}</h4>
              <div className="flex flex-wrap gap-3">
                {symptoms.map((symptom) => {
                  const active = selectedSymptoms.includes(symptom.id);
                  return (
                    <button
                      key={symptom.id}
                      onClick={() => toggleSymptom(symptom.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition focus:outline-none focus:ring-2 ${
                        active ? 'bg-primary text-black shadow' : 'bg-gray-100 text-black hover:bg-gray-200'
                      }`}
                      aria-pressed={active}
                    >
                      <span className="text-lg">{symptom.icon}</span>
                      <span className="font-medium text-black">{symptom.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add any details about your symptoms or day..."
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-black text-sm"
          aria-label="Notes"
        />
      </section>

      {/* LIVE PREVIEW */}
      {/* <section className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500">Preview (local state)</div>
          <div className="text-xs text-gray-400">This shows what will be saved</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs md:text-sm text-black">
          <div>
            <div className="font-medium text-black">Mood</div>
            <div className="text-black">{mood ? ['Very low','Low','Neutral','Good','Great'][mood - 1] : '—'}</div>
          </div>
          <div>
            <div className="font-medium text-black">Temp</div>
            <div className="text-black">{typeof temperature === 'number' ? `${temperature.toFixed(1)}°C` : '—'}</div>
          </div>
          <div className="col-span-2">
            <div className="font-medium text-black">Symptoms</div>
            <div className="text-black">{selectedSymptoms.length ? selectedSymptoms.map(id => idToName(id)).join(', ') : '—'}</div>
          </div>
          <div className="col-span-2">
            <div className="font-medium text-black">Notes</div>
            <div className="whitespace-pre-wrap text-black">{notes || '—'}</div>
          </div>
        </div>
      </section> */}
    </div>
  );
}
