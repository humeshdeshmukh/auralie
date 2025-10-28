import React, { useEffect, useState } from 'react';
import { CycleData } from '@/app/cycle-tracking/page';
import { predictNextCycle } from '@/services/predictionService';
import { useAuth } from '@/contexts/AuthContext';
import { format, isBefore, differenceInDays } from 'date-fns';

interface CycleStatusProps {
  cycle: CycleData | null;
  cycles: CycleData[]; // Add cycles prop for prediction
}

interface Prediction {
  next_period_date: string;
  cycle_length: number;
  fertile_window: {
    start: string;
    end: string;
    ovulation_day: string;
  };
  confidence: 'low' | 'medium' | 'high';
  model_used: string;
  last_cycle_date: string;
  message?: string;
}

const CycleStatus: React.FC<CycleStatusProps> = ({ cycle, cycles }) => {
  const { user } = useAuth();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch prediction when cycles change
  useEffect(() => {
    const fetchPrediction = async () => {
      if (!user || cycles.length === 0) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Only predict if we have at least one complete cycle
        const validCycles = cycles.filter(c => c.startDate && c.periodLength);
        if (validCycles.length >= 1) {
          const token = await user.getIdToken();
          const result = await predictNextCycle(validCycles, token);
          setPrediction(result.prediction);
        }
      } catch (err) {
        console.error('Error predicting next cycle:', err);
        setError('Could not load prediction');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [cycles, user]);

  const getCyclePhase = () => {
    if (!cycle) return 'Not tracking';
    
    const startDate = new Date(cycle.startDate);
    const today = new Date();
    
    // If we have an end date, we're between cycles
    if (cycle.endDate) {
      return 'In between cycles';
    }
    
    // Otherwise, calculate day of current cycle
    const day = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return `Day ${day} of cycle`;
  };

  const getNextPeriodDate = () => {
    if (prediction) {
      return format(new Date(prediction.next_period_date), 'MMM d, yyyy');
    }
    
    // Fallback to default calculation
    if (!cycle) return '--';
    const nextDate = new Date(cycle.startDate);
    nextDate.setDate(nextDate.getDate() + (cycle.cycleLength || 28));
    return format(nextDate, 'MMM d, yyyy');
  };

  const getFertileWindow = () => {
    if (prediction) {
      const start = new Date(prediction.fertile_window.start);
      const end = new Date(prediction.fertile_window.end);
      const today = new Date();
      
      if (isBefore(today, start)) {
        const daysUntil = differenceInDays(start, today);
        return `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
      } else if (isBefore(today, end) || isSameDay(today, end)) {
        return 'Now';
      } else {
        return 'Passed';
      }
    }
    
    return '--';
  };

  const getOvulationStatus = () => {
    if (!prediction) return '--';
    
    const ovulationDate = new Date(prediction.fertile_window.ovulation_day);
    const today = new Date();
    
    if (isSameDay(today, ovulationDate)) {
      return 'Today';
    } else if (isBefore(today, ovulationDate)) {
      const daysUntil = differenceInDays(ovulationDate, today);
      return `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
    } else {
      return 'Passed';
    }
  };

  // Helper function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Current Cycle</h2>
          <p className="text-gray-600 mt-1">{getCyclePhase()}</p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800">
          {cycle ? (cycle.endDate ? 'Inactive' : 'Active') : 'Not Started'}
        </span>
      </div>

      {loading && (
        <div className="mt-4 text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Updating predictions...</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Cycle Day</p>
          <p className="text-2xl font-semibold">
            {cycle ? Math.ceil((new Date().getTime() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24)) : '--'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Next Period</p>
          <p className="text-2xl font-semibold">{getNextPeriodDate()}</p>
          {prediction && (
            <p className="text-xs text-gray-500 mt-1">
              {prediction.confidence === 'high' ? '✓' : prediction.confidence === 'medium' ? '~' : '?'} 
              {prediction.confidence} confidence
            </p>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500">Fertile Window</p>
          <p className="text-2xl font-semibold">{getFertileWindow()}</p>
          {prediction && prediction.fertile_window && (
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(prediction.fertile_window.start), 'MMM d')} - 
              {format(new Date(prediction.fertile_window.end), 'MMM d')}
            </p>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500">Ovulation</p>
          <p className="text-2xl font-semibold">
            {getOvulationStatus()}
          </p>
          {prediction?.fertile_window?.ovulation_day && (
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(prediction.fertile_window.ovulation_day), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Cycle Progress</span>
          <span className="text-sm text-gray-500">3/28 days</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-pink-600 h-2.5 rounded-full" 
            style={{ width: '15%' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default CycleStatus;
