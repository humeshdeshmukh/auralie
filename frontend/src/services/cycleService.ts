// src/services/cycleService.ts
import { Cycle as CycleType, FlowLevel } from '@/types/cycle'

export type Cycle = CycleType;

const API_BASE = '/api/cycles'

// Helper function to get auth token
const getAuthToken = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || ''
  }
  return ''
}

// Helper function to create headers with auth token
const getAuthHeaders = () => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

// Cycle Management
export const getCycles = async (): Promise<Cycle[]> => {
  const response = await fetch(API_BASE, {
    headers: getAuthHeaders()
  })
  if (!response.ok) throw new Error('Failed to fetch cycles')
  return response.json()
}

export const getCurrentCycle = async (): Promise<Cycle | null> => {
  const response = await fetch(`${API_BASE}/current`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error('Failed to fetch current cycle')
  }
  return response.json()
}

export const getCycleById = async (id: string): Promise<Cycle> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) throw new Error('Failed to fetch cycle')
  return response.json()
}

export const createCycle = async (cycle: Omit<Cycle, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Cycle> => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(cycle)
  })
  if (!response.ok) throw new Error('Failed to create cycle')
  return response.json()
}

export const updateCycle = async (id: string, updates: Partial<Cycle>): Promise<Cycle> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  })
  if (!response.ok) throw new Error('Failed to update cycle')
  return response.json()
}

export const endCurrentCycle = async (endDate: string): Promise<Cycle> => {
  const response = await fetch(`${API_BASE}/current/end`, {
    method: 'POST',
    headers: getAuthHeaders(),
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

export const getHealthLogs = async (startDate?: Date | string, endDate?: Date | string): Promise<HealthLog[]> => {
  let url = `${API_BASE}/logs`
  const params = new URLSearchParams()
  
  // Convert Date objects to ISO strings if needed
  const formatDate = (date: Date | string): string => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0] // YYYY-MM-DD format
    }
    return date
  }
  
  if (startDate) params.append('startDate', formatDate(startDate))
  if (endDate) params.append('endDate', formatDate(endDate))
  
  if (params.toString()) {
    url += `?${params.toString()}`
  }
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  })
  
  if (!response.ok) {
    // In development, return mock data if API fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using mock health logs data')
      return generateMockHealthLogs()
    }
    throw new Error('Failed to fetch health logs')
  }
  return response.json()
};

export const createHealthLog = async (log: Omit<HealthLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<HealthLog> => {
  const response = await fetch(`${API_BASE}/logs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(log)
  })
  if (!response.ok) throw new Error('Failed to create health log')
  return response.json()
}

export const updateHealthLog = async (id: string, updates: Partial<HealthLog>): Promise<HealthLog> => {
  const response = await fetch(`${API_BASE}/logs/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
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
  const response = await fetch(`${API_BASE}/stats`, {
    headers: getAuthHeaders()
  })
  
  if (!response.ok) {
    // In development, return mock data if API fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using mock stats data')
      return {
        averageCycleLength: 28,
        averagePeriodLength: 5,
        lastPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        lastPeriodEnd: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        nextPeriodPrediction: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
        cycleVariability: 2,
        periodHistory: [
          {
            startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() - 41 * 24 * 60 * 60 * 1000).toISOString(),
            length: 5,
            symptoms: ['cramps', 'headache']
          },
          {
            startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
            length: 5,
            symptoms: ['cramps']
          }
        ]
      }
    }
    throw new Error('Failed to fetch cycle stats')
  }
  return response.json()
}