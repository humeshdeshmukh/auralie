'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  getCurrentCycle,
  getHealthLogs,
  getCycleStats,
  createCycle as createCycleService,
  endCurrentCycle as endCurrentCycleService,
  createHealthLog as createHealthLogService,
  updateHealthLog as updateHealthLogService,
} from '@/services/firebaseCycleService';
import { Cycle, HealthLog, CycleStats } from '@/types/health';
import { useAuth } from './AuthContext';
import { analyzeCycleWithGemini } from '@/services/predictionService';

interface Prediction {
  nextPeriodDate: string;
  cycleLength: number;
  fertileWindow: {
    start: string;
    end: string;
    ovulationDay: string;
  };
  confidence: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface FirebaseCycleContextType {
  currentCycle: Cycle | null;
  healthLogs: HealthLog[];
  predictions: Prediction | null;
  stats: CycleStats | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  startNewCycle: (startDate: string) => Promise<void>;
  endCurrentCycle: (endDate: string) => Promise<void>;
  logHealthData: (data: Omit<HealthLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateHealthLog: (id: string, updates: Partial<HealthLog>) => Promise<void>;
  predictNextCycle: () => Promise<void>;
  predictionLoading: boolean;
  predictionError: string | null;
}

const FirebaseCycleContext = createContext<FirebaseCycleContextType | undefined>(undefined);

export const FirebaseCycleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [stats, setStats] = useState<CycleStats | null>(null);
  const [predictions, setPredictions] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [predictionLoading, setPredictionLoading] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch current cycle
      const cycle = await getCurrentCycle(user.uid);
      setCurrentCycle(cycle);
      
      // Fetch health logs (last 30 days by default)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const logs = await getHealthLogs(user.uid, thirtyDaysAgo, new Date());
      setHealthLogs(logs);
      
      // Fetch stats
      const cycleStats = await getCycleStats(user.uid);
      setStats(cycleStats);
      
    } catch (err) {
      console.error('Error fetching cycle data:', err);
      setError('Failed to load cycle data');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startNewCycle = useCallback(async (startDate: string) => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const newCycle = await createCycleService({
        userId: user.uid,
        startDate,
        flowLevel: 'medium', // Default flow level
        symptoms: [],
        notes: '',
        isPredicted: false,
        mood: 0, // Default mood
        energy: 0 // Default energy
      });
      
      setCurrentCycle(newCycle);
      await fetchData(); // Refresh all data
    } catch (err) {
      console.error('Error starting new cycle:', err);
      throw new Error('Failed to start new cycle');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, fetchData]);

  const endCycle = useCallback(async (endDate: string) => {
    if (!currentCycle?.id || !user?.uid) return;
    
    try {
      setLoading(true);
      const updatedCycle = await endCurrentCycleService(user.uid, endDate);
      setCurrentCycle(updatedCycle);
      await fetchData(); // Refresh all data
    } catch (err) {
      console.error('Error ending cycle:', err);
      throw new Error('Failed to end current cycle');
    } finally {
      setLoading(false);
    }
  }, [currentCycle?.id, user?.uid, fetchData]);

  const logHealthData = useCallback(async (data: Omit<HealthLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const newLog = await createHealthLogService({
        ...data,
        userId: user.uid
      });
      
      setHealthLogs(prev => [newLog, ...prev]);
      await fetchData(); // Refresh all data
    } catch (err) {
      console.error('Error logging health data:', err);
      throw new Error('Failed to log health data');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, fetchData]);

  const updateHealthLog = useCallback(async (id: string, updates: Partial<HealthLog>) => {
    try {
      setLoading(true);
      const updatedLog = await updateHealthLogService(id, updates);
      
      setHealthLogs(prev => 
        prev.map(log => log.id === id ? { ...log, ...updatedLog } : log)
      );
      
      await fetchData(); // Refresh all data
    } catch (err) {
      console.error('Error updating health log:', err);
      throw new Error('Failed to update health log');
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const predictNextCycle = useCallback(async () => {
    if (!user?.uid || !currentCycle) return;
    
    try {
      setPredictionLoading(true);
      setPredictionError(null);
      
      // Get more historical data for better predictions
      const allLogs = await getHealthLogs(user.uid);
      const prediction = await analyzeCycleWithGemini(allLogs, currentCycle);
      
      setPredictions({
        next_period_date: prediction.nextPeriod,
        cycle_length: prediction.predictedCycleLength,
        fertile_window: {
          start: prediction.fertileWindow.start,
          end: prediction.fertileWindow.end,
          ovulation_day: prediction.ovulation
        },
        confidence: 'medium', // You might want to calculate this based on data quality
        notes: 'Prediction based on your cycle history and current data.'
      });
      
    } catch (err) {
      console.error('Error predicting next cycle:', err);
      setPredictionError('Failed to predict next cycle');
    } finally {
      setPredictionLoading(false);
    }
  }, [user?.uid, currentCycle]);

  const value = useMemo(() => ({
    currentCycle,
    healthLogs,
    predictions,
    stats,
    loading,
    error,
    refreshData: fetchData,
    startNewCycle,
    endCurrentCycle: endCycle,
    logHealthData,
    updateHealthLog,
    predictNextCycle,
    predictionLoading,
    predictionError
  }), [
    currentCycle,
    healthLogs,
    predictions,
    stats,
    loading,
    error,
    fetchData,
    startNewCycle,
    endCycle,
    logHealthData,
    updateHealthLog,
    predictNextCycle,
    predictionLoading,
    predictionError
  ]);

  return (
    <FirebaseCycleContext.Provider value={value}>
      {children}
    </FirebaseCycleContext.Provider>
  );
};

export const useFirebaseCycle = (): FirebaseCycleContextType => {
  const context = useContext(FirebaseCycleContext);
  if (context === undefined) {
    throw new Error('useFirebaseCycle must be used within a FirebaseCycleProvider');
  }
  return context;
};
