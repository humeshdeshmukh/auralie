// src/types/health.ts

export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy';

export interface Cycle {
  id?: string;
  userId: string;
  startDate: string;
  endDate?: string;
  flowLevel: FlowLevel;
  symptoms: string[];
  notes?: string;
  mood?: number;
  energy?: number;
  temperature?: number;
  weight?: number;
  isPredicted: boolean;
  cycleLength?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HealthLog {
  id?: string;
  userId: string;
  date: string;
  mood: number;
  energy: number;
  symptoms: string[];
  notes?: string;
  flowLevel?: FlowLevel;
  temperature?: number;
  weight?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CycleStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  lastPeriodStart: string;
  lastPeriodEnd: string;
  nextPeriodStart?: string;
  nextPeriodEnd?: string;
  nextPeriodPrediction?: {
    start: string;
    end: string;
  };
  fertileWindow?: {
    start: string;
    end: string;
    ovulationDay: string;
  };
  symptoms: Record<string, number>;
  moodAverage: number;
  energyAverage: number;
  cycleHistory: Array<{
    startDate: string;
    endDate: string;
    length: number;
  }>;
  cycleVariability?: number;
}
