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
  imageUrl?: string;
  predictedData?: {
    analysis: string;
    healthTips: string[];
  };
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
  analysis?: string;
  healthTips?: string[];
}

export interface CycleStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  cycleVariability: number;
  lastPeriodStart: string | null;
  nextPeriodStart: string | null;
  nextPeriodEnd: string | null;
  fertileWindow: { start: string; end: string } | null;
  ovulationDate: string | null;
  confidence: 'low' | 'medium' | 'high';
  cycleHistory: Array<{
    startDate: string;
    endDate?: string;
    length: number;
    periodLength?: number;
  }>;
  periodLogs?: CycleEntry[]; // Keeping for backward compatibility
}
