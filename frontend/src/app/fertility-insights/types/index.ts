import { Timestamp } from 'firebase/firestore';

export type CyclePhase = 'menstruation' | 'follicular' | 'ovulation' | 'luteal' | 'pms';

export interface FertilityEntry {
  id?: string;
  userId: string;
  date: string | Timestamp;
  basalBodyTemp?: number;
  cervicalMucus?: 'dry' | 'sticky' | 'creamy' | 'watery' | 'egg-white';
  lhSurge?: boolean;
  ovulationPain?: boolean;
  breastTenderness?: boolean;
  libido?: number; // 1-5 scale
  mood?: number; // 1-5 scale
  notes?: string;
  flowLevel?: 'spotting' | 'light' | 'medium' | 'heavy';
  symptoms?: string[];
  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export interface FertilityStats {
  cycleLength: number;
  periodLength: number;
  ovulationDay: number;
  fertileWindow: {
    start: number;
    end: number;
  };
  nextPeriod: string;
  nextOvulation: string;
  pregnancyTestDay: string;
  currentCycleDay: number;
  isFertileWindow: boolean;
  phase: CyclePhase;
}

export interface FertilityInsight {
  fertilityWindow: {
    start: string;
    end: string;
    confidence: 'low' | 'medium' | 'high';
  };
  ovulationPrediction: {
    date: string;
    confidence: 'low' | 'medium' | 'high';
  };
  analysis: string;
  recommendations: string[];
  symptomsAnalysis: {
    [key: string]: {
      pattern: string;
      correlation: string;
    };
  };
  moodAnalysis?: {
    averageMood: number;
    moodPattern: string;
    moodTriggers: string[];
  };
  healthInsights?: {
    exerciseImpact: string;
    nutritionTips: string[];
    stressImpact: string;
  };
}

export type SymptomType = {
  id: string;
  name: string;
  icon: string;
  category: 'physical' | 'emotional' | 'fertility' | 'other';
  intensity?: boolean;
};

export type CycleDay = {
  date: string;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
  isPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
  symptoms: string[];
  mood?: number;
  temperature?: number;
  notes?: string;
};
