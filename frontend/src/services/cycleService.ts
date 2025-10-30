// src/services/cycleService.ts
import { Cycle as CycleType, FlowLevel } from '@/types/cycle'

export type Cycle = CycleType;

const API_BASE = '/api/cycles'

// Cycle Management
export const getCycles = async (): Promise<Cycle[]> => {
  const response = await fetch(API_BASE)
  if (!response.ok) throw new Error('Failed to fetch cycles')
  return response.json()
}

export const getCurrentCycle = async (): Promise<Cycle | null> => {
  const response = await fetch(`${API_BASE}/current`)
  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error('Failed to fetch current cycle')
  }
  return response.json()
}

export const getCycleById = async (id: string): Promise<Cycle> => {
  const response = await fetch(`${API_BASE}/${id}`)
  if (!response.ok) throw new Error('Failed to fetch cycle')
  return response.json()
}

export const createCycle = async (cycle: Omit<Cycle, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Cycle> => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cycle)
  })
  if (!response.ok) throw new Error('Failed to create cycle')
  return response.json()
}

export const updateCycle = async (id: string, updates: Partial<Cycle>): Promise<Cycle> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  })
  if (!response.ok) throw new Error('Failed to update cycle')
  return response.json()
}

export const endCurrentCycle = async (endDate: string): Promise<Cycle> => {
  const response = await fetch(`${API_BASE}/current/end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ endDate })
  })
  if (!response.ok) throw new Error('Failed to end current cycle')
  return response.json()
}

// Health Logs
export interface HealthLog {
  id: string
  userId: string
  date: string
  mood: string
  energy: number | string
  symptoms: string[]
  notes?: string
  flowLevel?: FlowLevel
  temperature?: number
  weight?: number
  createdAt?: string
  updatedAt?: string
}

// Generate mock health logs for development
const generateMockHealthLogs = (): HealthLog[] => {
  const logs: HealthLog[] = [];
  const now = new Date();
  
  // Generate logs for the last 30 days
  for (let i = 0; i < 30; i++) {
    const logDate = new Date(now);
    logDate.setDate(now.getDate() - (29 - i));
    const energyLevel = i % 5 === 0 ? 5 : 3; // 1-5 scale
    
    logs.push({
      id: `log-${i}`,
      userId: 'mock-user',
      date: logDate.toISOString().split('T')[0],
      symptoms: i % 3 === 0 ? ['Headache'] : [],
      mood: i % 4 === 0 ? 'Happy' : 'Normal',
      energy: energyLevel,
      notes: i % 7 === 0 ? 'Feeling good today' : '',
      flowLevel: i % 6 === 0 ? 'medium' : undefined,
      temperature: i % 2 === 0 ? 36.5 + (Math.random() * 0.5) : undefined,
      weight: i % 3 === 0 ? 60 + (Math.random() * 5) : undefined,
      createdAt: logDate.toISOString(),
      updatedAt: logDate.toISOString(),
    });
  }
  
  return logs;
};

export const getHealthLogs = async (startDate?: string, endDate?: string): Promise<HealthLog[]> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`${API_BASE}/logs?${params.toString()}`);
    
    if (!response.ok) {
      console.warn('Health logs endpoint not available, using mock data');
      return generateMockHealthLogs();
    }
    
    const logs = await response.json();
    return logs;
  } catch (error) {
    console.warn('Error fetching health logs, using mock data:', error);
    return generateMockHealthLogs();
  }
};

export const createHealthLog = async (log: Omit<HealthLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<HealthLog> => {
  const response = await fetch(`${API_BASE}/logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(log)
  })
  if (!response.ok) throw new Error('Failed to create health log')
  return response.json()
}

export const updateHealthLog = async (id: string, updates: Partial<HealthLog>): Promise<HealthLog> => {
  const response = await fetch(`${API_BASE}/logs/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  })
  if (!response.ok) throw new Error('Failed to update health log')
  return response.json()
}

// Predictions
export interface CyclePrediction {
  nextPeriod: string
  fertileWindow: {
    start: string
    end: string
  }
  ovulation: string
  predictedPeriodLength: number
  predictedCycleLength: number
}

// Mock prediction data generator
const generateMockPredictions = (): CyclePrediction => {
  const today = new Date();
  const nextPeriod = new Date(today);
  nextPeriod.setDate(today.getDate() + 28); // Default 28-day cycle
  
  const ovulationDate = new Date(nextPeriod);
  ovulationDate.setDate(nextPeriod.getDate() - 14); // Ovulation ~14 days before period
  
  const fertileStart = new Date(ovulationDate);
  fertileStart.setDate(ovulationDate.getDate() - 5); // Fertile window starts ~5 days before ovulation
  
  const fertileEnd = new Date(ovulationDate);
  fertileEnd.setDate(ovulationDate.getDate() + 1); // Fertile window ends ~1 day after ovulation
  
  return {
    nextPeriod: nextPeriod.toISOString().split('T')[0],
    fertileWindow: {
      start: fertileStart.toISOString().split('T')[0],
      end: fertileEnd.toISOString().split('T')[0],
    },
    ovulation: ovulationDate.toISOString().split('T')[0],
    predictedPeriodLength: 5, // Default 5-day period
    predictedCycleLength: 28, // Default 28-day cycle
  };
};

export const getPredictions = async (): Promise<CyclePrediction> => {
  // In a real app, you would make an API call here
  // For now, we'll return mock data
  console.log('Using mock prediction data');
  
  try {
    // Uncomment this to test with a real API when available
    /*
    const response = await fetch(`${API_BASE}/predictions`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch cycle predictions: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
    */
    
    // Return mock data for now
    return generateMockPredictions();
  } catch (error) {
    console.error('Error in getPredictions:', error);
    // Return mock data as fallback
    return generateMockPredictions();
  }
};

// Statistics
export interface CycleStats {
  averageCycleLength: number
  averagePeriodLength: number
  lastPeriodStart: string
  lastPeriodEnd: string
  nextPeriodPrediction?: string  // Make this optional to maintain backward compatibility
  cycleVariability?: number
  periodHistory?: Array<{
    startDate: string
    endDate: string
    length: number
    symptoms: string[]
  }>
}

export const getCycleStats = async (): Promise<CycleStats> => {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    
    if (!response.ok) {
      console.warn('Stats endpoint not available, using default values');
      // Return default stats when endpoint is not available
      return {
        averageCycleLength: 28,
        averagePeriodLength: 5,
        lastPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        lastPeriodEnd: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
        nextPeriodPrediction: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days from now
      };
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching cycle stats:', error);
    // Return default values on error
    return {
      averageCycleLength: 28,
      averagePeriodLength: 5,
      lastPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastPeriodEnd: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      nextPeriodPrediction: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    };
  }
}