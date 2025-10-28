import { CycleData } from '@/app/cycle-tracking/page';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface PredictionResponse {
  status: string;
  prediction: {
    next_period_date: string;
    cycle_length: number;
    fertile_window: {
      start: string;
      end: string;
      ovulation_day: string;
    };
    confidence: 'low' | 'medium' | 'high';
    model_used: string;
    last_cycle_date: string;
    message?: string;
  };
  metadata: {
    model_version: string;
    last_trained?: string;
  };
}

interface TrainingResponse {
  status: string;
  message: string;
  metrics: {
    train_score: number;
    test_score: number;
    n_samples: number;
    feature_importances: Record<string, number>;
  };
  user_id: string;
}

export const predictNextCycle = async (
  cycles: CycleData[], 
  token: string
): Promise<PredictionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/predict/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(cycles.map(cycle => ({
        start_date: cycle.startDate,
        period_length: cycle.periodLength || 5,
        symptoms: cycle.symptoms || [],
        mood: cycle.mood,
        flow: cycle.flow,
        notes: cycle.notes,
      }))),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to predict next cycle');
    }

    return await response.json();
  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
};

export const trainPredictionModel = async (
  cycles: CycleData[], 
  token: string
): Promise<TrainingResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/predict/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(cycles.map(cycle => ({
        start_date: cycle.startDate,
        period_length: cycle.periodLength || 5,
        symptoms: cycle.symptoms || [],
        mood: cycle.mood,
        flow: cycle.flow,
      }))),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to train model');
    }

    return await response.json();
  } catch (error) {
    console.error('Training error:', error);
    throw error;
  }
};

// Schedule model training (runs in the browser)
export const scheduleModelTraining = (
  cycles: CycleData[],
  token: string,
  onComplete?: () => void
) => {
  // Only run in browser
  if (typeof window === 'undefined') return;

  // Check if training is needed (e.g., once a week)
  const lastTrained = localStorage.getItem('lastModelTraining');
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  if (!lastTrained || new Date(lastTrained) < oneWeekAgo) {
    if (cycles.length >= 3) { // Minimum cycles required for training
      console.log('Scheduling model training...');
      
      // Use requestIdleCallback to train when browser is idle
      if ('requestIdleCallback' in window) {
        const idleCallback = window.requestIdleCallback || (window as any).requestIdleCallback;
        idleCallback(
          (deadline: IdleDeadline) => {
            if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
              trainPredictionModel(cycles, token)
                .then(() => {
                  localStorage.setItem('lastModelTraining', new Date().toISOString());
                  console.log('Model training completed successfully');
                  onComplete?.();
                })
                .catch(console.error);
            }
          },
          { timeout: 5000 } // Wait max 5 seconds
        );
      } else {
        // Fallback for browsers that don't support requestIdleCallback
        setTimeout(() => {
          trainPredictionModel(cycles, token)
            .then(() => {
              localStorage.setItem('lastModelTraining', new Date().toISOString());
              console.log('Model training completed successfully');
              onComplete?.();
            })
            .catch(console.error);
        }, 5000);
      }
    }
  }
};
