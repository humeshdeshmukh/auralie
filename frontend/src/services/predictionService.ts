// src/services/predictionService.ts
import { CycleData } from '@/app/cycle-tracking/page';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
// Set default Gemini model endpoint for gemini-2.5-flash (adjust if you prefer a different model)
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL =
  process.env.NEXT_PUBLIC_GEMINI_API_URL ||
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface PredictionResponse {
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

export interface TrainingResponse {
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

/* ----------------------------
   Helpers
   ---------------------------- */

// Try to parse a JSON blob from text output (the LM might include explanation + JSON)
function extractJsonFromText(text: string): any | null {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  const jsonCandidate = text.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonCandidate);
  } catch {
    // sanitize attempt: quote keys, remove trailing commas
    const sanitized = jsonCandidate
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
      .replace(/,(\s*})/g, '$1')
      .replace(/,(\s*])/g, '$1');
    try {
      return JSON.parse(sanitized);
    } catch {
      return null;
    }
  }
}

/* ----------------------------
   Gemini integration (correct request shape)
   ---------------------------- */

export const analyzeCycleWithGemini = async (cycles: CycleData[]): Promise<PredictionResponse> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured (NEXT_PUBLIC_GEMINI_API_KEY).');
  }

  // Build concise cycle history to include in prompt
  const cycleHistory = cycles
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .map((c, i) => ({
      cycleNumber: i + 1,
      startDate: c.startDate,
      endDate: c.endDate ?? null,
      periodLength: c.periodLength ?? null,
      symptoms: c.symptoms ?? [],
      mood: c.mood ?? null,
      flow: c.flow ?? null,
      notes: c.notes ?? '',
    }));

  // Instruct the model to return JSON only. Keep the JSON schema in the prompt so model outputs clean JSON.
  const prompt = `Return JSON only (no extra commentary). Analyze the cycle history and predict the next cycle.
Cycle History:
${JSON.stringify(cycleHistory, null, 2)}

Return JSON with fields:
{
  "next_period_date": "YYYY-MM-DD",
  "cycle_length": number,
  "fertile_window": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD",
    "ovulation_day": "YYYY-MM-DD"
  },
  "confidence": "low|medium|high",
  "notes": "any additional insights or recommendations"
}`;

  try {
    // Use the documented generateContent REST shape:
    // { contents: [ { parts: [ { text: "..." } ] } ] }
    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      // keep generation options minimal — avoid unknown top-level keys
      // generationConfig: { thinkingConfig: { thinkingBudget: 0 } } // optional if you want to disable thinking
    };

    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Google examples use x-goog-api-key header for API keys
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    });

    // Read raw text for both error messages and candidate parsing
    const rawText = await res.text();

    if (!res.ok) {
      // include status and body for debugging (statusText sometimes empty)
      const msg = `Gemini API error: HTTP ${res.status} ${res.statusText || ''} - ${rawText.slice(0, 1000)}`;
      throw new Error(msg);
    }

    // Try to parse as JSON envelope first
    let parsedEnvelope: any = null;
    try {
      parsedEnvelope = JSON.parse(rawText);
    } catch {
      parsedEnvelope = null;
    }

    // Extract candidate text where the model's textual output typically lives
    let candidateText: string | null = null;
    if (parsedEnvelope) {
      candidateText =
        parsedEnvelope?.candidates?.[0]?.content?.parts?.[0]?.text ??
        parsedEnvelope?.candidates?.[0]?.output ??
        parsedEnvelope?.outputs?.[0]?.content ??
        parsedEnvelope?.result?.output ??
        null;
      // If candidateText isn't a string, but response itself looks like the JSON we want, keep that
      if (!candidateText && typeof parsedEnvelope === 'object' && (parsedEnvelope.next_period_date || parsedEnvelope.nextPeriod)) {
        // parsedEnvelope looks already like our prediction JSON
        const fertile = parsedEnvelope.fertile_window || parsedEnvelope.fertileWindow || {};
        return {
          status: 'success',
          prediction: {
            next_period_date: parsedEnvelope.next_period_date || parsedEnvelope.nextPeriod,
            cycle_length: Number(parsedEnvelope.cycle_length || parsedEnvelope.cycleLength),
            fertile_window: {
              start: fertile.start || fertile.start_date || fertile.startDate,
              end: fertile.end || fertile.end_date || fertile.endDate,
              ovulation_day: fertile.ovulation_day || fertile.ovulation || fertile.ovulationDate,
            },
            confidence: (parsedEnvelope.confidence || 'medium') as 'low' | 'medium' | 'high',
            model_used: 'gemini-2.5-flash',
            last_cycle_date: cycles[cycles.length - 1]?.startDate ?? '',
            message: parsedEnvelope.notes || parsedEnvelope.message || '',
          },
          metadata: {
            model_version: parsedEnvelope?.metadata?.model_version || 'gemini-2.5-flash',
            last_trained: new Date().toISOString(),
          },
        } as PredictionResponse;
      }
    }

    // If parsedEnvelope had candidate text, use it; otherwise rawText may itself be the text
    const textToParse = candidateText ?? rawText;

    // Try to parse JSON directly
    let parsedJson: any = null;
    try {
      parsedJson = JSON.parse(textToParse);
    } catch {
      parsedJson = extractJsonFromText(String(textToParse));
    }

    if (!parsedJson) {
      throw new Error('Unable to parse JSON from Gemini response. Raw response (truncated): ' + String(rawText).slice(0, 2000));
    }

    // Normalize fields
    const fertile = parsedJson.fertile_window || parsedJson.fertileWindow || {};
    const nextPeriod = parsedJson.next_period_date || parsedJson.nextPeriod || parsedJson.nextPeriodDate;
    const cycleLength = parsedJson.cycle_length ?? parsedJson.cycleLength ?? parsedJson.cycle_days;

    if (!nextPeriod || !cycleLength) {
      throw new Error('Gemini response missing required fields: next_period_date or cycle_length. Parsed JSON: ' + JSON.stringify(parsedJson).slice(0, 1000));
    }

    return {
      status: 'success',
      prediction: {
        next_period_date: nextPeriod,
        cycle_length: Number(cycleLength),
        fertile_window: {
          start: fertile.start || fertile.start_date || fertile.startDate || '',
          end: fertile.end || fertile.end_date || fertile.endDate || '',
          ovulation_day: fertile.ovulation_day || fertile.ovulation || fertile.ovulationDate || '',
        },
        confidence: (parsedJson.confidence || 'medium') as 'low' | 'medium' | 'high',
        model_used: 'gemini-2.5-flash',
        last_cycle_date: cycles[cycles.length - 1]?.startDate || '',
        message: parsedJson.notes || parsedJson.message || '',
      },
      metadata: {
        model_version: 'gemini-2.5-flash',
        last_trained: new Date().toISOString(),
      },
    } as PredictionResponse;
  } catch (err: any) {
    console.error('Error in analyzeCycleWithGemini:', err);
    throw new Error(`analyzeCycleWithGemini failed: ${err?.message || err}`);
  }
};

/* ----------------------------
   predictNextCycle: try backend, fallback to Gemini (defensive)
   ---------------------------- */

export const predictNextCycle = async (cycles: CycleData[], token?: string): Promise<PredictionResponse> => {
  if (!Array.isArray(cycles)) throw new Error('predictNextCycle: cycles must be an array');

  let backendError: Error | null = null;

  // Try backend (if token present)
  if (token) {
    try {
      const res = await fetch(`${API_BASE_URL}/predict/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          cycles.map((cycle) => ({
            start_date: cycle.startDate,
            period_length: cycle.periodLength ?? 5,
            symptoms: cycle.symptoms ?? [],
            mood: cycle.mood ?? null,
            flow: cycle.flow ?? null,
            notes: cycle.notes ?? '',
          }))
        ),
      });

      const text = await res.text();
      let jsonResponse: any = null;
      try {
        jsonResponse = text ? JSON.parse(text) : null;
      } catch {
        jsonResponse = null;
      }

      if (!res.ok) {
        const detail = (jsonResponse && (jsonResponse.detail || jsonResponse.message)) || text;
        throw new Error(`Backend prediction failed: HTTP ${res.status} ${res.statusText || ''} - ${String(detail).slice(0, 1000)}`);
      }

      // If backend returned a compatible envelope, normalize and return
      if (jsonResponse && jsonResponse.prediction && jsonResponse.status) {
        return jsonResponse as PredictionResponse;
      }

      // If backend returned a lean object, try to normalize
      if (jsonResponse && (jsonResponse.next_period_date || jsonResponse.nextPeriod)) {
        const fertile = jsonResponse.fertile_window || jsonResponse.fertileWindow || {};
        return {
          status: 'success',
          prediction: {
            next_period_date: jsonResponse.next_period_date || jsonResponse.nextPeriod,
            cycle_length: Number(jsonResponse.cycle_length || jsonResponse.cycleLength),
            fertile_window: {
              start: fertile.start || fertile.start_date || fertile.startDate,
              end: fertile.end || fertile.end_date || fertile.endDate,
              ovulation_day: fertile.ovulation_day || fertile.ovulation || fertile.ovulationDate,
            },
            confidence: (jsonResponse.confidence || 'medium') as 'low' | 'medium' | 'high',
            model_used: jsonResponse.model_used || 'server-model',
            last_cycle_date: cycles[cycles.length - 1]?.startDate || '',
            message: jsonResponse.notes || jsonResponse.message || '',
          },
          metadata: {
            model_version: jsonResponse?.metadata?.model_version || 'server-v1',
            last_trained: jsonResponse?.metadata?.last_trained || new Date().toISOString(),
          },
        } as PredictionResponse;
      }

      backendError = new Error('Backend returned unexpected response: ' + (text?.slice(0, 1000) ?? '[empty]'));
    } catch (err: any) {
      backendError = err;
      console.warn('Backend prediction failed; will attempt Gemini fallback if available. Error:', err);
    }
  } else {
    backendError = new Error('No token provided for backend prediction');
  }

  // Gemini fallback if backend failed and key is available
  if (GEMINI_API_KEY && cycles.length >= 1) {
    try {
      const geminiResult = await analyzeCycleWithGemini(cycles);
      return geminiResult;
    } catch (gemErr: any) {
      const msg = `Both backend and Gemini failed. backendError: ${backendError?.message || 'n/a'}; geminiError: ${String(
        gemErr?.message || gemErr
      )}`;
      console.error(msg);
      throw new Error(msg);
    }
  }

  throw backendError ?? new Error('No prediction method available (no token and no Gemini key)');
};

/* ----------------------------
   Training endpoint
   ---------------------------- */

export const trainPredictionModel = async (cycles: CycleData[], token?: string): Promise<TrainingResponse> => {
  if (!token) throw new Error('trainPredictionModel requires an authentication token');
  try {
    const res = await fetch(`${API_BASE_URL}/predict/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(
        cycles.map((cycle) => ({
          start_date: cycle.startDate,
          period_length: cycle.periodLength ?? 5,
          symptoms: cycle.symptoms ?? [],
          mood: cycle.mood ?? null,
          flow: cycle.flow ?? null,
        }))
      ),
    });

    const text = await res.text();
    let jsonResponse: any = null;
    try {
      jsonResponse = text ? JSON.parse(text) : null;
    } catch {
      jsonResponse = null;
    }

    if (!res.ok) {
      const detail = (jsonResponse && (jsonResponse.detail || jsonResponse.message)) || text;
      throw new Error(`Training API error: HTTP ${res.status} - ${String(detail).slice(0, 1000)}`);
    }

    return (jsonResponse as TrainingResponse) ?? {
      status: 'ok',
      message: 'Training completed (no body)',
      metrics: { train_score: 0, test_score: 0, n_samples: cycles.length, feature_importances: {} },
      user_id: 'unknown',
    };
  } catch (err: any) {
    console.error('Training error:', err);
    throw err;
  }
};

/* ----------------------------
   Schedule training in browser (idle)
   ---------------------------- */

export const scheduleModelTraining = (cycles: CycleData[], token?: string, onComplete?: () => void) => {
  if (typeof window === 'undefined') return;
  if (!token) return; // cannot train without token

  const lastTrained = localStorage.getItem('lastModelTraining');
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  if (!lastTrained || new Date(lastTrained) < oneWeekAgo) {
    if (cycles.length >= 3) {
      console.log('Scheduling model training (browser idle)...');

      const doTrain = async () => {
        try {
          await trainPredictionModel(cycles, token);
          localStorage.setItem('lastModelTraining', new Date().toISOString());
          console.log('Model training completed successfully');
          onComplete?.();
        } catch (err) {
          console.error('Background training failed:', err);
        }
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(
          (deadline: IdleDeadline) => {
            if (deadline.timeRemaining() > 0 || (deadline as any).didTimeout) {
              doTrain();
            } else {
              setTimeout(doTrain, 2000);
            }
          },
          { timeout: 5000 }
        );
      } else {
        setTimeout(doTrain, 5000);
      }
    }
  }
};
