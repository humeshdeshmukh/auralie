'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { CycleStats as CycleStatsType, CycleEntry } from '../types';

// Define the prediction interface
interface CyclePredictionData {
  nextPeriod: {
    startDate: string | null;
    endDate: string | null;
    daysUntil: number | null;
    confidence: 'low' | 'medium' | 'high';
  };
  currentCycle: {
    day: number | null;
    phase: string;
    description: string;
    daysRemaining: number | null;
  };
  healthTips: string[];
  lastUpdated: string;
  confidence: 'low' | 'medium' | 'high';
}

interface AIPredictionPanelProps {
  stats: CycleStatsType;
  entries: CycleEntry[];
  onPredictionUpdate?: (prediction: CyclePredictionData) => void;
}

export default function AIPredictionPanel({ stats, entries, onPredictionUpdate }: AIPredictionPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<CyclePredictionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Calculating...';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? '--' : format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '--';
    }
  };

  // Calculate days until next period
  const getDaysUntilNextPeriod = () => {
    if (!stats.nextPeriodStart) return null;
    const today = new Date();
    const nextPeriod = new Date(stats.nextPeriodStart);
    const diffTime = nextPeriod.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate current cycle day
  const getCurrentCycleDay = () => {
    if (!stats.lastPeriodStart) return null;
    const lastPeriod = new Date(stats.lastPeriodStart);
    const today = new Date();
    const diffTime = today.getTime() - lastPeriod.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because day 1 is first day of period
  };

  // Get current cycle phase based on cycle day
  const getCyclePhase = useCallback(() => {
    const currentDay = getCurrentCycleDay();
    if (!currentDay) return null;

    // These are simplified assumptions
    if (currentDay <= 5) {
      return { phase: 'Menstruation', description: 'Your period is active. Focus on rest and self-care.' };
    } else if (currentDay <= 11) {
      return { phase: 'Follicular', description: 'Follicular phase - energy levels are rising.' };
    } else if (currentDay <= 17) {
      return { phase: 'Ovulation', description: 'Ovulation phase - peak fertility window.' };
    } else {
      return { phase: 'Luteal', description: 'Luteal phase - premenstrual phase.' };
    }
  }, [getCurrentCycleDay]);

  // Generate health tips based on cycle phase
  const getHealthTips = useCallback(() => {
    const phase = getCyclePhase()?.phase.toLowerCase() || '';
    
    switch (phase) {
      case 'menstruation':
        return [
          'Increase iron-rich foods to replenish iron levels.',
          'Stay hydrated and get plenty of rest.',
          'Consider gentle exercises like yoga or walking.'
        ];
      case 'follicular':
        return [
          'Great time for high-intensity workouts.',
          'Focus on protein-rich foods for muscle recovery.',
          'Start new fitness routines during this high-energy phase.'
        ];
      case 'ovulation':
        return [
          'Stay hydrated and maintain a balanced diet.',
          'Practice stress-reduction techniques.',
          'Consider lower-impact exercises if experiencing discomfort.'
        ];
      case 'luteal':
        return [
          'Increase magnesium intake to help with PMS symptoms.',
          'Focus on complex carbs to stabilize mood and energy.',
          'Gentle exercise can help with bloating and mood swings.'
        ];
      default:
        return [
          'Maintain a balanced diet and regular exercise routine.',
          'Stay hydrated and manage stress levels.',
          'Listen to your body and rest when needed.'
        ];
    }
  }, [getCyclePhase]);

  // Memoize the AI prediction function
  const generateAIPrediction = useCallback(async () => {
    if (!stats || entries.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const cyclePhase = getCyclePhase();
      const daysUntilNextPeriod = getDaysUntilNextPeriod();
      const currentCycleDay = getCurrentCycleDay();
      
      const newPrediction: CyclePredictionData = {
        nextPeriod: {
          startDate: stats.nextPeriodStart,
          endDate: stats.nextPeriodEnd,
          daysUntil: daysUntilNextPeriod,
          confidence: stats.confidence
        },
        currentCycle: {
          day: currentCycleDay,
          phase: cyclePhase?.phase || 'Unknown',
          description: cyclePhase?.description || 'Unable to determine current cycle phase.',
          daysRemaining: currentCycleDay ? stats.averageCycleLength - currentCycleDay : null
        },
        healthTips: getHealthTips(),
        lastUpdated: new Date().toISOString(),
        confidence: stats.confidence
      };
      
      setPrediction(newPrediction);
      if (onPredictionUpdate) {
        onPredictionUpdate(newPrediction);
      }
    } catch (err) {
      console.error('Error generating prediction:', err);
      setError('Failed to generate prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [stats, entries, onPredictionUpdate, getCyclePhase, getDaysUntilNextPeriod, getCurrentCycleDay, getHealthTips]);

  // Memoize the prediction function
  const generatePrediction = useCallback(async () => {
    if (stats && entries.length > 0) {
      await generateAIPrediction();
    }
  }, [stats, entries, generateAIPrediction]);

  // Initial prediction on component mount
  useEffect(() => {
    // No longer automatically generate predictions
    // generatePrediction();
  }, []);

  // Function to manually trigger prediction
  const handleGeneratePrediction = async () => {
    if (isLoading) return;
    await generatePrediction();
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          <span className="ml-3 text-gray-600">Analyzing your cycle...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-red-100">
        <div className="text-red-600">
          <p className="font-medium">Error loading predictions</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={generateAIPrediction}
            className="mt-3 px-4 py-2 bg-pink-100 text-pink-700 rounded-md hover:bg-pink-200 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Get AI-powered cycle predictions</p>
          <button
            onClick={handleGeneratePrediction}
            disabled={isLoading}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-md flex items-center mx-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Prediction
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-pink-700">Cycle Predictions</h2>
        <button
          onClick={handleGeneratePrediction}
          disabled={isLoading}
          className="text-pink-600 hover:bg-pink-50 px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors"
        >
          <svg 
            className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          {isLoading ? 'Generating...' : 'Refresh'}
        </button>
      </div>
      {/* Current Cycle Status */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-5 rounded-lg border border-pink-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-pink-700">Current Phase</span>
              <span className="text-xs px-2 py-1 rounded-full bg-pink-200 text-pink-800 font-medium">
                Day {prediction.currentCycle.day}
              </span>
            </div>
            <div className="text-2xl font-bold text-pink-800 mb-2">{prediction.currentCycle.phase}</div>
            <p className="text-sm text-gray-600">{prediction.currentCycle.description}</p>
            
            {prediction.currentCycle.daysRemaining !== null && (
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">
                  {prediction.currentCycle.daysRemaining} days remaining in cycle
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-pink-500 h-1.5 rounded-full" 
                    style={{
                      width: `${Math.min(100, 100 - ((prediction.currentCycle.daysRemaining / stats.averageCycleLength) * 100))}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">
                {prediction.nextPeriod.daysUntil && prediction.nextPeriod.daysUntil > 0 
                  ? `Next Period in ${prediction.nextPeriod.daysUntil} ${prediction.nextPeriod.daysUntil === 1 ? 'day' : 'days'}` 
                  : prediction.nextPeriod.daysUntil === 0
                    ? 'Your period starts today!'
                    : 'Next Period'}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-200 text-blue-800 font-medium">
                {prediction.confidence === 'high' ? '✓ ' : ''}
                {prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)} confidence
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-800 mb-3">
              {formatDate(prediction.nextPeriod.startDate)}
            </div>
            
            {prediction.nextPeriod.daysUntil !== null && prediction.nextPeriod.daysUntil > 0 && (
              <div className="mt-auto">
                <div className="text-xs text-gray-500 mb-1">
                  {prediction.nextPeriod.daysUntil <= 5 
                    ? 'Your period is coming up soon!'
                    : 'Your next cycle is approaching'}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full" 
                    style={{
                      width: `${Math.min(100, 100 - (prediction.nextPeriod.daysUntil / 30) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cycle Day Counter */}
        {prediction.currentCycle.day && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Cycle Day {prediction.currentCycle.day}</span>
              {prediction.currentCycle.daysRemaining !== null && (
                <span className="text-xs text-gray-500">{prediction.currentCycle.daysRemaining} days remaining</span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-pink-500 h-2.5 rounded-full" 
                style={{
                  width: `${Math.min(100, (prediction.currentCycle.day / stats.averageCycleLength) * 100)}%`
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Health Tips */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 text-pink-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Personalized Health Tips
          </h3>
          <ul className="space-y-3">
            {prediction.healthTips.map((tip: string, index: number) => (
              <li key={index} className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium">{index + 1}</span>
                </div>
                <span className="text-sm text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-4 text-xs text-gray-400 text-right">
            Last updated: {formatDate(prediction.lastUpdated)}
          </div>
        </div>
      </div>

      {/* Fertility Window (if applicable) */}
      {prediction.currentCycle.phase.includes('Fertile') && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Fertility Window Active</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You&apos;re in your fertile window. This is the best time to try to conceive if you&apos;re planning a pregnancy.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Period Prediction Notice */}
      <div className="text-xs text-gray-500 text-center italic">
        Predictions are based on your cycle history and may not be accurate for everyone. 
        Always consult with a healthcare provider for medical advice.
      </div>
    </div>
  );
}
