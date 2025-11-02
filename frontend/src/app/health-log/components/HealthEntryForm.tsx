'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { HealthEntry, HealthEntryFormData } from '../types';

interface HealthEntryFormProps {
  initialData?: HealthEntry;
  onSubmit: (data: HealthEntryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

// Helper function to get BMI category
const getBmiCategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

export default function HealthEntryForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading
}: HealthEntryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors }
  } = useForm<HealthEntryFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      metrics: {
        weight: '',
        height: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        temperature: '',
        bmi: ''
      },
      symptoms: [],
      medications: [],
      mood: '3',
      energyLevel: '3',
      notes: ''
    }
  });

  const [symptomInput, setSymptomInput] = useState('');
  const [symptomSeverity, setSymptomSeverity] = useState('3');
  const [symptomNotes, setSymptomNotes] = useState('');

  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medTime, setMedTime] = useState('');

  // Auto-calculate BMI when weight or height changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if ((name === 'metrics.weight' || name === 'metrics.height') && value.metrics?.weight && value.metrics?.height) {
        const weight = parseFloat(value.metrics.weight);
        const height = parseFloat(value.metrics.height) / 100; // convert cm to m
        if (height > 0) {
          const bmi = (weight / (height * height)).toFixed(1);
          setValue('metrics.bmi', bmi);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        date: format(new Date(initialData.date), 'yyyy-MM-dd')
      });
    }
  }, [initialData, reset]);

  const addSymptom = () => {
    if (!symptomInput.trim()) return;

    const newSymptom = {
      name: symptomInput.trim(),
      severity: symptomSeverity,
      notes: symptomNotes.trim()
    };

    const currentSymptoms = getValues('symptoms') || [];
    setValue('symptoms', [...currentSymptoms, newSymptom]);

    setSymptomInput('');
    setSymptomSeverity('3');
    setSymptomNotes('');
  };

  const removeSymptom = (index: number) => {
    const currentSymptoms = getValues('symptoms') || [];
    setValue('symptoms', currentSymptoms.filter((_, i) => i !== index));
  };

  const addMedication = () => {
    if (!medName.trim() || !medDosage.trim() || !medTime) return;

    const newMedication = {
      name: medName.trim(),
      dosage: medDosage.trim(),
      time: medTime
    };

    const currentMeds = getValues('medications') || [];
    setValue('medications', [...currentMeds, newMedication]);

    setMedName('');
    setMedDosage('');
    setMedTime('');
  };

  const removeMedication = (index: number) => {
    const currentMeds = getValues('medications') || [];
    setValue('medications', currentMeds.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (data: HealthEntryFormData) => {
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="w-full max-w-7xl mx-auto bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 space-y-8"
      aria-labelledby="health-form-heading"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b pb-4 border-gray-100">
        <div>
          <h2 id="health-form-heading" className="text-2xl md:text-3xl font-semibold text-gray-900">
            {initialData ? 'Edit Health Entry' : 'New Health Entry'}
          </h2>
          <p className="mt-1 text-sm md:text-base text-gray-600 max-w-2xl">
            Track your health metrics, symptoms and medications with a clean, high-contrast layout for better visibility.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 disabled:opacity-60"
          >
            {isLoading ? 'Saving...' : initialData ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Basic Info */}
        <section className="md:col-span-1 bg-white/50 p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">Basic</h3>
          <p className="mt-2 text-sm text-gray-500">When and how you're feeling today.</p>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
              <input
                id="date"
                type="date"
                {...register('date', { required: 'Date is required' })}
                className="mt-1 block w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
            </div>

            <div>
              <label htmlFor="mood" className="block text-sm font-medium text-gray-700">Mood</label>
              <select
                id="mood"
                {...register('mood', { required: 'Mood is required' })}
                className="mt-1 block w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-4 pr-8 text-lg text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="1">😢 Very Poor</option>
                <option value="2">🙁 Poor</option>
                <option value="3">😐 Neutral</option>
                <option value="4">🙂 Good</option>
                <option value="5">😊 Excellent</option>
              </select>
            </div>

            <div>
              <label htmlFor="energyLevel" className="block text-sm font-medium text-gray-700">Energy Level</label>
              <select
                id="energyLevel"
                {...register('energyLevel', { required: 'Energy Level is required' })}
                className="mt-1 block w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-4 pr-8 text-lg text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="1">😴 Very Low</option>
                <option value="2">😪 Low</option>
                <option value="3">😐 Moderate</option>
                <option value="4">😊 High</option>
                <option value="5">🚀 Very High</option>
              </select>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="md:col-span-2 bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Health Metrics</h3>
              <p className="mt-1 text-sm text-gray-500">Record your vitals with larger input areas for readability.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <div className="relative mt-1">
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  {...register('metrics.weight', {
                    required: 'Weight is required',
                    min: { value: 20, message: 'Weight must be at least 20kg' },
                    max: { value: 300, message: 'Weight must be less than 300kg' }
                  })}
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white py-4 px-4 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. 72.5"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="text-gray-500 font-medium">kg</span>
                </div>
              </div>
              {errors.metrics?.weight && (
                <p className="mt-1 text-sm text-red-600">{errors.metrics.weight.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (cm)</label>
              <div className="relative mt-1">
                <input
                  id="height"
                  type="number"
                  step="0.1"
                  min="0"
                  {...register('metrics.height', {
                    required: 'Height is required',
                    min: { value: 50, message: 'Height must be at least 50cm' },
                    max: { value: 250, message: 'Height cannot exceed 250cm' }
                  })}
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white py-4 px-4 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. 170"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="text-gray-500 font-medium">cm</span>
                </div>
              </div>
              {errors.metrics?.height && (
                <p className="mt-1 text-sm text-red-600">{errors.metrics.height.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">BMI (kg/m²)</label>
              <div className="mt-1">
                <input
                  type="text"
                  {...register('metrics.bmi')}
                  readOnly
                  className={`block w-full rounded-xl border-2 border-gray-200 bg-white py-4 px-4 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${!watch('metrics.weight') || !watch('metrics.height') ? 'bg-yellow-50' : ''}`}
                  placeholder="Auto-calculated"
                />
                <p className={`mt-2 text-sm ${!watch('metrics.weight') || !watch('metrics.height') ? 'text-yellow-700' : 'text-gray-500'}`}>
                  {watch('metrics.weight') && watch('metrics.height')
                    ? `BMI: ${(Number(watch('metrics.weight')) / Math.pow(Number(watch('metrics.height'))/100, 2)).toFixed(1)} - ${getBmiCategory(Number(watch('metrics.weight')) / Math.pow(Number(watch('metrics.height'))/100, 2))}`
                    : 'Enter weight and height to calculate BMI'}
                </p>
              </div>
            </div>

            {/* Additional metrics: Blood Pressure & Heart Rate */}
            <div className="sm:col-span-2 mt-2">
              <label className="block text-sm font-medium text-gray-700">Blood Pressure</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  {...register('metrics.bloodPressureSystolic')}
                  className="w-1/2 rounded-xl border-2 border-gray-200 bg-white py-3 px-4 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Systolic"
                />
                <input
                  type="number"
                  {...register('metrics.bloodPressureDiastolic')}
                  className="w-1/2 rounded-xl border-2 border-gray-200 bg-white py-3 px-4 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Diastolic"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">mmHg</p>
            </div>

            <div className="mt-2">
              <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700">Heart Rate</label>
              <div className="mt-1 relative">
                <input
                  id="heartRate"
                  type="number"
                  {...register('metrics.heartRate')}
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white py-4 px-4 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. 72"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="text-gray-500">bpm</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Symptoms */}
      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Symptoms</h3>
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-rose-50 text-rose-700">
            {watch('symptoms')?.length > 0 ? `${watch('symptoms').length} added` : 'Optional'}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {watch('symptoms')?.map((symptom, index) => (
            <div key={index} className="flex items-start justify-between bg-gray-50 p-3 rounded-lg">
              <div className="pr-4">
                <div className="font-medium text-gray-900">{symptom.name}</div>
                {symptom.severity && <div className="text-sm text-gray-600 mt-1">Severity: {symptom.severity}/5</div>}
                {symptom.notes && <div className="text-sm text-gray-600 mt-1">{symptom.notes}</div>}
              </div>
              <button onClick={() => removeSymptom(index)} className="text-gray-400 hover:text-red-500">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="symptom" className="block text-sm font-medium text-gray-700">Symptom</label>
                <input
                  id="symptom"
                  type="text"
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  placeholder="e.g. Headache"
                  className="mt-1 block w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="symptomSeverity" className="block text-sm font-medium text-gray-700">Severity</label>
                <select
                  id="symptomSeverity"
                  value={symptomSeverity}
                  onChange={(e) => setSymptomSeverity(e.target.value)}
                  className="mt-1 block w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-4 pr-8 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="1">1 - Very Mild</option>
                  <option value="2">2 - Mild</option>
                  <option value="3">3 - Moderate</option>
                  <option value="4">4 - Severe</option>
                  <option value="5">5 - Very Severe</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-end">
                <div className="w-full">
                  <label htmlFor="symptomNotes" className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                  <div className="mt-1 flex">
                    <input
                      id="symptomNotes"
                      type="text"
                      value={symptomNotes}
                      onChange={(e) => setSymptomNotes(e.target.value)}
                      placeholder="e.g. Started in the morning"
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={addSymptom}
                      className="ml-3 inline-flex items-center px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-rose-300"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Medications */}
      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Medications</h3>
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-rose-50 text-rose-700">
            {watch('medications')?.length > 0 ? `${watch('medications').length} added` : 'Optional'}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {watch('medications')?.map((med, index) => (
            <div key={index} className="flex items-start justify-between bg-gray-50 p-3 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{med.name}</div>
                <div className="text-sm text-gray-600">{med.dosage} at {med.time}</div>
              </div>
              <button onClick={() => removeMedication(index)} className="text-gray-400 hover:text-red-500">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-8 gap-3">
              <div className="sm:col-span-3">
                <label htmlFor="medName" className="block text-sm font-medium text-gray-700">Medication</label>
                <input
                  id="medName"
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="e.g. Ibuprofen"
                  className="mt-1 block w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="medDosage" className="block text-sm font-medium text-gray-700">Dosage</label>
                <input
                  id="medDosage"
                  type="text"
                  value={medDosage}
                  onChange={(e) => setMedDosage(e.target.value)}
                  placeholder="e.g. 200mg"
                  className="mt-1 block w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="medTime" className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  id="medTime"
                  type="time"
                  value={medTime}
                  onChange={(e) => setMedTime(e.target.value)}
                  className="mt-1 block w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="sm:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={addMedication}
                  className="w-full inline-flex justify-center items-center px-4 py-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-rose-300"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />Add Med
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Additional Notes</label>
        <textarea
          id="notes"
          rows={4}
          {...register('notes')}
          className="mt-2 block w-full rounded-xl border-2 border-gray-200 bg-white py-4 px-4 text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          placeholder="Any additional notes about your health today..."
        />
      </section>

      {/* Footer actions (also shown at top for convenience) */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 disabled:opacity-60"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Entry' : 'Save Entry'}
        </button>
      </div>
    </form>
  );
}
