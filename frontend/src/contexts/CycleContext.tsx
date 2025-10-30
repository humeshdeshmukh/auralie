'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  getCurrentCycle,
  getHealthLogs,
  getCycleStats,
  createCycle as createCycleService,
  endCurrentCycle as endCurrentCycleService,
  createHealthLog as createHealthLogService,
  updateHealthLog as updateHealthLogService,
  Cycle,
  HealthLog,
  CycleStats,
} from '@/services/cycleService';
import { useAuth } from './AuthContext';
import { analyzeCycleWithGemini } from '@/services/predictionService';

/* --------------------------
   Types
   -------------------------- */
interface Prediction {
  next_period_date: string;
  cycle_length: number;
  fertile_window: {
    start: string;
    end: string;
    ovulation_day: string;
  };
  confidence: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface CycleContextType {
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

const CycleContext = createContext<CycleContextType | undefined>(undefined);

/* --------------------------
   Provider
   -------------------------- */
export const CycleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [predictions, setPredictions] = useState<Prediction | null>(null);
  const [stats, setStats] = useState<CycleStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [predictionLoading, setPredictionLoading] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // refs to avoid state updates on unmounted component and to coordinate fetch aborts
  const isMountedRef = useRef<boolean>(false);
  const fetchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // abort any inflight fetch
      fetchAbortRef.current?.abort();
    };
  }, []);

  /**
   * fetchData - defensive fetch that cancels on unmount and only updates state when mounted.
   * Note: This does NOT run prediction automatically to avoid heavy calls on mount.
   */
  const fetchData = useCallback(async () => {
    if (!user) return;
    // abort any prior fetch to avoid races
    try {
      fetchAbortRef.current?.abort();
    } catch {
      // ignore
    }
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      // Parallel fetch basic data
      const [cycleResp, logsResp, statsResp] = await Promise.all([
        getCurrentCycle({ signal: controller.signal }),
        getHealthLogs({ signal: controller.signal }),
        getCycleStats({ signal: controller.signal }),
      ]);

      if (!isMountedRef.current) return;

      setCurrentCycle(cycleResp ?? null);
      setHealthLogs(Array.isArray(logsResp) ? logsResp : []);
      setStats(statsResp ?? null);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // aborted, do nothing
        return;
      }
      console.error('Error fetching cycle data:', err);
      if (isMountedRef.current) {
        setError('Failed to load cycle data. Please try again.');
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [user]);

  // Initial load when user becomes available
  useEffect(() => {
    if (user) {
      // kick off initial fetch once
      fetchData();
    } else {
      // clear state if user logged out
      setCurrentCycle(null);
      setHealthLogs([]);
      setPredictions(null);
      setStats(null);
    }
    // we intentionally don't add fetchData to deps beyond user because fetchData is stable due to useCallback
  }, [user, fetchData]);

  /* --------------------------
     Prediction (manual)
     -------------------------- */
  const predictNextCycle = useCallback(async (): Promise<void> => {
    if (!user) return;
    // require at least 2 logs to make a reasonable prediction
    if (!healthLogs || healthLogs.length < 2) {
      setPredictionError('Not enough data to predict. Please add more health logs.');
      return;
    }

    setPredictionLoading(true);
    setPredictionError(null);

    try {
      // Build cycles data for the prediction call
      const cycleData = healthLogs.map((log) => {
        const date = log.date ? new Date(log.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        return {
          startDate: date,
          endDate: date,
          symptoms: log.symptoms ?? [],
          mood: log.mood ?? null,
          notes: log.notes ?? '',
          periodLength: log.periodLength ?? null,
          flow: log.flow ?? null,
        };
      });

      // Use analyzeCycleWithGemini (defensive) — this may take time; UI can call refreshData afterwards if desired
      const geminiResponse = await analyzeCycleWithGemini(cycleData);

      // Map prediction into our local shape and set state only if mounted
      if (!isMountedRef.current) return;

      const p = geminiResponse.prediction;
      setPredictions({
        next_period_date: p.next_period_date,
        cycle_length: p.cycle_length,
        fertile_window: p.fertile_window,
        confidence: p.confidence,
        notes: p.message ?? undefined,
      });

      // Optionally update stats minimally (without full refetch)
      setStats((prev) => {
        const base = prev ?? {
          averageCycleLength: p.cycle_length ?? 28,
          averagePeriodLength: prev?.averagePeriodLength ?? 5,
          lastPeriodStart: currentCycle?.startDate ?? new Date().toISOString().split('T')[0],
          lastPeriodEnd: currentCycle?.endDate ?? new Date().toISOString().split('T')[0],
          cycleVariability: prev?.cycleVariability ?? 0,
          periodHistory: prev?.periodHistory ?? [],
        } as CycleStats;

        // annotate predicted next period minimally
        return {
          ...base,
          // keep previous fields, just attach prediction marker
          ...(base as any),
          nextPeriodPrediction: p.next_period_date,
        } as CycleStats;
      });
    } catch (err) {
      console.error('Error predicting next cycle:', err);
      if (isMountedRef.current) {
        setPredictionError('Failed to predict next cycle. Please try again.');
      }
    } finally {
      if (isMountedRef.current) setPredictionLoading(false);
    }
  }, [user, healthLogs, currentCycle]);

  /* --------------------------
     Actions: create / update handlers (optimistic / local updates)
     -------------------------- */

  const startNewCycle = useCallback(async (startDate: string) => {
    if (!user) throw new Error('User not authenticated');
    try {
      const created = await createCycleService({
        startDate,
        flowLevel: 'medium',
        symptoms: [],
        isPredicted: false,
      });

      // If service returns created cycle, optimistically update state without full refetch
      if (created) {
        if (isMountedRef.current) {
          setCurrentCycle(created as Cycle);
          // optionally bump stats.periodHistory if available
          setStats((prev) => {
            if (!prev) return prev;
            const history = Array.isArray(prev.periodHistory) ? prev.periodHistory.slice() : [];
            history.unshift({ startDate, periodLength: created.periodLength ?? prev.averagePeriodLength ?? 5 });
            return { ...prev, periodHistory: history };
          });
        }
      } else {
        // fallback to full refresh if we didn't get the created item back
        await fetchData();
      }
    } catch (err) {
      console.error('Error starting new cycle:', err);
      throw new Error('Failed to start new cycle');
    }
  }, [user, fetchData]);

  const endCurrentCycle = useCallback(async (endDate: string) => {
    if (!currentCycle) throw new Error('No active cycle to end');
    try {
      const result = await endCurrentCycleService(endDate);
      if (result) {
        // optimistic: clear currentCycle locally
        if (isMountedRef.current) {
          setCurrentCycle(null);
          // optionally append to history in stats
          setStats((prev) => {
            if (!prev) return prev;
            const history = Array.isArray(prev.periodHistory) ? prev.periodHistory.slice() : [];
            history.unshift({ startDate: currentCycle.startDate, periodLength: currentCycle.periodLength ?? prev.averagePeriodLength ?? 5 });
            return { ...prev, periodHistory: history };
          });
        }
      } else {
        // fallback to full refresh
        await fetchData();
      }
    } catch (err) {
      console.error('Error ending current cycle:', err);
      throw new Error('Failed to end current cycle');
    }
  }, [currentCycle, fetchData]);

  const logHealthData = useCallback(async (data: Omit<HealthLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');
    try {
      const payload = { ...data, date: data.date ?? new Date().toISOString().split('T')[0] };
      const createdLog = await createHealthLogService(payload);
      if (createdLog) {
        // optimistic update to healthLogs list
        if (isMountedRef.current) {
          setHealthLogs((prev) => {
            const arr = prev ? prev.slice() : [];
            // insert at front (most recent) or keep sort logic consistent
            arr.unshift(createdLog as HealthLog);
            // keep reasonable cap if you want
            return arr;
          });
        }
      } else {
        // fallback to full refetch
        await fetchData();
      }
    } catch (err) {
      console.error('Error logging health data:', err);
      throw new Error('Failed to log health data');
    }
  }, [user, fetchData]);

  const updateHealthLog = useCallback(async (id: string, updates: Partial<HealthLog>) => {
    if (!user) throw new Error('User not authenticated');
    try {
      const updated = await updateHealthLogService(id, updates);
      if (updated) {
        if (isMountedRef.current) {
          setHealthLogs((prev) => {
            if (!prev) return prev;
            const idx = prev.findIndex((h) => h.id === id);
            if (idx === -1) return prev;
            const copy = prev.slice();
            copy[idx] = { ...copy[idx], ...updated } as HealthLog;
            return copy;
          });
        }
      } else {
        // fallback
        await fetchData();
      }
    } catch (err) {
      console.error('Error updating health log:', err);
      throw new Error('Failed to update health log');
    }
  }, [user, fetchData]);

  /* --------------------------
     Expose memoized context value
     -------------------------- */
  const contextValue = useMemo<CycleContextType>(() => ({
    currentCycle,
    healthLogs,
    predictions,
    stats,
    loading,
    error,
    refreshData: fetchData,
    startNewCycle,
    endCurrentCycle,
    logHealthData,
    updateHealthLog,
    predictNextCycle,
    predictionLoading,
    predictionError,
  }), [
    currentCycle,
    healthLogs,
    predictions,
    stats,
    loading,
    error,
    fetchData,
    startNewCycle,
    endCurrentCycle,
    logHealthData,
    updateHealthLog,
    predictNextCycle,
    predictionLoading,
    predictionError,
  ]);

  return (
    <CycleContext.Provider value={contextValue}>
      {children}
    </CycleContext.Provider>
  );
};

/* --------------------------
   Hook
   -------------------------- */
export const useCycle = (): CycleContextType => {
  const context = useContext(CycleContext);
  if (context === undefined) {
    throw new Error('useCycle must be used within a CycleProvider');
  }
  return context;
};
