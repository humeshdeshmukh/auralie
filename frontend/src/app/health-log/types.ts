// Health Entry Types
export interface HealthEntry {
  id: string;
  userId: string;
  date: string; // ISO date string
  metrics: {
    weight?: number; // kg
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
    heartRate?: number; // bpm
    temperature?: number; // °C
  };
  symptoms: SymptomEntry[];
  medications: MedicationEntry[];
  mood: number; // 1-5 scale
  energyLevel: number; // 1-5 scale
  notes?: string;
  aiInsights?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface SymptomEntry {
  id: string;
  name: string;
  severity: number; // 1-5 scale
  notes?: string;
  createdAt: string;
}

export interface MedicationEntry {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
  createdAt: string;
}

// Form Data Types
export interface HealthEntryFormData {
  date: string;
  metrics: {
    weight?: string;
    bloodPressureSystolic?: string;
    bloodPressureDiastolic?: string;
    heartRate?: string;
    temperature?: string;
  };
  symptoms: Omit<SymptomEntry, 'id' | 'createdAt'>[];
  medications: Omit<MedicationEntry, 'id' | 'createdAt' | 'taken'>[];
  mood: string;
  energyLevel: string;
  notes?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// AI Insight Types
export interface HealthInsight {
  summary: string;
  trends: string[];
  recommendations: string[];
  moodAnalysis: string;
  symptomPatterns: string[];
  timestamp: string;
}

// Chart Data Types
export interface MetricDataPoint {
  date: string;
  value: number;
}

export interface ChartDataset {
  label: string;
  data: MetricDataPoint[];
  borderColor: string;
  backgroundColor: string;
}

// Enums
export enum MoodLevel {
  VeryPoor = 1,
  Poor = 2,
  Neutral = 3,
  Good = 4,
  Excellent = 5
}

export enum EnergyLevel {
  VeryLow = 1,
  Low = 2,
  Moderate = 3,
  High = 4,
  VeryHigh = 5
}

export const MOOD_LABELS: Record<MoodLevel, string> = {
  [MoodLevel.VeryPoor]: 'Very Poor',
  [MoodLevel.Poor]: 'Poor',
  [MoodLevel.Neutral]: 'Neutral',
  [MoodLevel.Good]: 'Good',
  [MoodLevel.Excellent]: 'Excellent'
};

export const ENERGY_LABELS: Record<EnergyLevel, string> = {
  [EnergyLevel.VeryLow]: 'Very Low',
  [EnergyLevel.Low]: 'Low',
  [EnergyLevel.Moderate]: 'Moderate',
  [EnergyLevel.High]: 'High',
  [EnergyLevel.VeryHigh]: 'Very High'
};

// Component Props
export interface HealthEntryListProps {
  entries: HealthEntry[];
  onEdit: (entry: HealthEntry) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

export interface HealthMetricsProps {
  entries: HealthEntry[];
  selectedMetric: keyof HealthEntry['metrics'];
  onMetricChange: (metric: keyof HealthEntry['metrics']) => void;
}
