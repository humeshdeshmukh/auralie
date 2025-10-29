import { CycleEntry } from '../../cycle-tracking/types';

export interface FertilityEntry extends Omit<CycleEntry, 'predictedData'> {
  basalBodyTemp?: number;
  cervicalMucus?: 'dry' | 'sticky' | 'creamy' | 'watery' | 'egg-white';
  cervicalPosition?: 'low' | 'medium' | 'high';
  lhSurge?: boolean;
  ovulationPain?: boolean;
  breastTenderness?: boolean;
  libido?: number;
  notes?: string;
  loggedAt: string;
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
}
