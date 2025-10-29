export interface CycleEntry {
  id: string;
  userId: string;
  startDate: string;
  endDate?: string;
  flowLevel: 'spotting' | 'light' | 'medium' | 'heavy';
  symptoms: string[];
  notes?: string;
  mood?: string;
  temperature?: number;
  weight?: number;
  isPredicted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CyclePrediction {
  nextPeriodStart: string;
  nextPeriodEnd: string;
  fertileWindow: {
    start: string;
    end: string;
  };
  ovulationDate: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface CycleStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  lastPeriodStart: string;  // ISO date string
  nextPeriodStart: string;  // ISO date string
  cycleVariability: number;
  periodLogs: CycleEntry[];
}
