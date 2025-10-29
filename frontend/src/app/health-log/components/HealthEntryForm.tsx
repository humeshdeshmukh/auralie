'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
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
    control,
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

  // Helper functions for progress tracking
  const calculateProgress = () => {
    const fields = [
      watch('date'),
      watch('mood'),
      watch('energyLevel'),
      watch('metrics.weight'),
      watch('metrics.height')
    ];
    
    const completedFields = fields.filter(field => !!field).length;
    return Math.min(100, Math.round((completedFields / fields.length) * 100));
  };

  const getCompletedSections = () => {
    let completed = 0;
    if (watch('date') && watch('mood') && watch('energyLevel')) completed++;
    if (watch('metrics.weight') && watch('metrics.height')) completed++;
    if (watch('symptoms')?.length > 0) completed++;
    if (watch('medications')?.length > 0) completed++;
    return completed;
  };

  // Auto-calculate BMI when weight or height changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if ((name === 'metrics.weight' || name === 'metrics.height') && value.metrics?.weight && value.metrics?.height) {
        const weight = parseFloat(value.metrics.weight);
        const height = parseFloat(value.metrics.height) / 100; // convert cm to m
        const bmi = (weight / (height * height)).toFixed(1);
        setValue('metrics.bmi', bmi);
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

    // Update form value
    const currentSymptoms = getValues('symptoms') || [];
    setValue('symptoms', [...currentSymptoms, newSymptom]);
    
    // Reset inputs
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

    // Update form value
    const currentMeds = getValues('medications') || [];
    setValue('medications', [...currentMeds, newMedication]);
    
    // Reset inputs
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {initialData ? '✏️ Edit Health Entry' : '➕ New Health Entry'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Track your health metrics, symptoms, and medications in one place.
        </p>
      </div>

      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Progress Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-pink-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
              style={{ 
                width: `${calculateProgress()}%`,
                background: 'linear-gradient(90deg, #EC4899 0%, #8B5CF6 100%)'
              }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-right">
            {getCompletedSections()} of 4 sections completed
          </p>
        </div>

        {/* Basic Information Card */}
        <div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md"
          id="basic-info-card"
        >
          <div className="md:grid md:grid-cols-4 md:gap-8">
            <div className="md:col-span-1">
              <h3 className="text-base font-medium text-gray-900">Basic Information</h3>
              <p className="mt-1 text-sm text-gray-500">
                When and how you're feeling today.
              </p>
            </div>
            <div className="mt-5 md:col-span-3 md:mt-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-10">
                {/* Date */}
                <div className="sm:col-span-3">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    {...register('date', { required: 'Date is required' })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-sm h-10 px-3 text-gray-900 bg-white placeholder-gray-400"
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>

                {/* Mood */}
                <div className="sm:col-span-3">
                  <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-1">
                    Mood
                  </label>
                  <select
                    id="mood"
                    {...register('mood')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-sm h-10 px-3 text-gray-900 bg-white placeholder-gray-400"
                  >
                    <option value="1">😢 Very Poor</option>
                    <option value="2">🙁 Poor</option>
                    <option value="3">😐 Neutral</option>
                    <option value="4">🙂 Good</option>
                    <option value="5">😊 Excellent</option>
                  </select>
                </div>

                {/* Energy Level */}
                <div className="sm:col-span-3">
                  <label htmlFor="energyLevel" className="block text-sm font-medium text-gray-700 mb-1">
                    Energy Level
                  </label>
                  <select
                    id="energyLevel"
                    {...register('energyLevel')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-sm h-10 px-3 text-gray-900 bg-white placeholder-gray-400"
                  >
                    <option value="1">😴 Very Low</option>
                    <option value="2">😪 Low</option>
                    <option value="3">😐 Moderate</option>
                    <option value="4">😊 High</option>
                    <option value="5">🚀 Very High</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-base font-medium text-gray-900">Health Metrics</h3>
            <p className="mt-1 text-sm text-gray-500">
              Record your vital signs and measurements.
            </p>
          </div>
          <div className="mt-5 md:col-span-2 md:mt-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              {/* Weight */}
              <div className="sm:col-span-2">
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg) <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="weight"
                    step="0.1"
                    min="0"
                    required
                    {...register('metrics.weight', { required: 'Weight is required' })}
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm h-10 px-3 text-gray-900 bg-white placeholder-gray-400 transition duration-150 ease-in-out"
                    placeholder="e.g. 68.5"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">kg</span>
                  </div>
                </div>
                {errors.metrics?.weight && (
                  <p className="mt-1 text-sm text-red-600">{errors.metrics.weight.message}</p>
                )}
              </div>

              {/* Height */}
              <div className="sm:col-span-2">
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm) <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="height"
                    step="0.1"
                    min="0"
                    required
                    {...register('metrics.height', { 
                      required: 'Height is required',
                      min: { value: 50, message: 'Height must be at least 50cm' },
                      max: { value: 250, message: 'Height cannot exceed 250cm' }
                    })}
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm h-10 px-3 text-gray-900 bg-white placeholder-gray-400 transition duration-150 ease-in-out"
                    placeholder="e.g. 170"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">cm</span>
                  </div>
                </div>
                {errors.metrics?.height && (
                  <p className="mt-1 text-sm text-red-600">{errors.metrics.height.message}</p>
                )}
              </div>

              {/* Blood Pressure */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Pressure
                </label>
                <div className="flex rounded-md shadow-sm">
                  <input
                    type="number"
                    {...register('metrics.bloodPressureSystolic')}
                    className="block w-1/2 rounded-l-md border border-r-0 border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm h-10 px-3 text-gray-900 bg-white placeholder-gray-400 transition duration-150 ease-in-out"
                    placeholder="120"
                  />
                  <span className="inline-flex items-center px-2 border-t border-b border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    /
                  </span>
                  <input
                    type="number"
                    {...register('metrics.bloodPressureDiastolic')}
                    className="block w-1/2 rounded-r-md border border-l-0 border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm h-10 px-3 text-gray-900 bg-white placeholder-gray-400 transition duration-150 ease-in-out"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">mmHg</span>
                  </div>
                </div>
              </div>

              {/* Heart Rate */}
              <div className="sm:col-span-2">
                <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Heart Rate
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="heartRate"
                    {...register('metrics.heartRate')}
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm h-10 px-3 text-gray-900 bg-white placeholder-gray-400 transition duration-150 ease-in-out"
                    placeholder="72"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">bpm</span>
                  </div>
                </div>
              </div>

              {/* BMI */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BMI (kg/m²)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.1"
                    {...register('metrics.bmi')}
                    className={`block w-full rounded-md border ${!watch('metrics.weight') || !watch('metrics.height') ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300 bg-gray-50'} shadow-sm text-sm h-10 px-3 text-gray-900 transition duration-150 ease-in-out`}
                    placeholder="Auto-calculated"
                    readOnly
                  />
                </div>
                <p className={`mt-1 text-xs ${!watch('metrics.weight') || !watch('metrics.height') ? 'text-yellow-600' : 'text-gray-500'}`}>
                  {watch('metrics.weight') && watch('metrics.height') 
                    ? `BMI: ${(Number(watch('metrics.weight')) / Math.pow(Number(watch('metrics.height'))/100, 2)).toFixed(1)} - ${getBmiCategory(Number(watch('metrics.weight')) / Math.pow(Number(watch('metrics.height'))/100, 2))}`
                    : 'Enter weight and height to calculate BMI'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Symptoms Card */}
      <div 
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md"
        id="symptoms-card"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Symptoms</h3>
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-800">
            {watch('symptoms')?.length > 0 ? `${watch('symptoms').length} added` : 'Optional'}
          </span>
        </div>
        
        {/* List of added symptoms */}
        <div className="mb-4 space-y-2">
          {watch('symptoms')?.map((symptom, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <div>
                <span className="font-medium">{symptom.name}</span>
                {symptom.severity && (
                  <span className="ml-2 text-sm text-gray-500">
                    Severity: {symptom.severity}/5
                  </span>
                )}
                {symptom.notes && (
                  <p className="text-sm text-gray-500 mt-1">{symptom.notes}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeSymptom(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add symptom form */}
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="symptom" className="block text-sm font-medium text-gray-700">
                Symptom
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="symptom"
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                  placeholder="e.g. Headache"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="symptomSeverity" className="block text-sm font-medium text-gray-700">
                Severity (1-5)
              </label>
              <div className="mt-1">
                <select
                  id="symptomSeverity"
                  value={symptomSeverity}
                  onChange={(e) => setSymptomSeverity(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                >
                  <option value="1">1 - Very Mild</option>
                  <option value="2">2 - Mild</option>
                  <option value="3">3 - Moderate</option>
                  <option value="4">4 - Severe</option>
                  <option value="5">5 - Very Severe</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="symptomNotes" className="block text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="symptomNotes"
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                  placeholder="e.g. Started in the morning"
                />
                <button
                  type="button"
                  onClick={addSymptom}
                  className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medications Card */}
      <div 
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md"
        id="medications-card"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Medications</h3>
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-800">
            {watch('medications')?.length > 0 ? `${watch('medications').length} added` : 'Optional'}
          </span>
        </div>
        
        {/* List of added medications */}
        <div className="mb-4 space-y-2">
          {watch('medications')?.map((med, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <div>
                <span className="font-medium">{med.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  {med.dosage} at {med.time}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeMedication(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add medication form */}
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-8">
            <div className="sm:col-span-2">
              <label htmlFor="medName" className="block text-sm font-medium text-gray-700">
                Medication
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="medName"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                  placeholder="e.g. Ibuprofen"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="medDosage" className="block text-sm font-medium text-gray-700">
                Dosage
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="medDosage"
                  value={medDosage}
                  onChange={(e) => setMedDosage(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                  placeholder="e.g. 200mg"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="medTime" className="block text-sm font-medium text-gray-700">
                Time
              </label>
              <div className="mt-1">
                <input
                  type="time"
                  id="medTime"
                  value={medTime}
                  onChange={(e) => setMedTime(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="button"
                onClick={addMedication}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Med
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="border-t border-gray-200 pt-6">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Additional Notes
        </label>
        <div className="mt-1">
          <textarea
            id="notes"
            rows={3}
            {...register('notes')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            placeholder="Any additional notes about your health today..."
            defaultValue={''}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : initialData ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      </div>
    </form>
  );
}
