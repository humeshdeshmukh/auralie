import { CycleData } from '@/app/cycle-tracking/page';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export const generateCycleInsights = async (cycles: CycleData[]): Promise<string> => {
  try {
    const prompt = `You are a women's health assistant. Analyze the following menstrual cycle data and provide personalized insights and predictions. Focus on patterns, potential health considerations, and recommendations. Be empathetic and professional in your response.

Cycle Data: ${JSON.stringify(cycles, null, 2)}

Provide insights including:
1. Cycle patterns and irregularities
2. Fertility window predictions
3. Symptom analysis
4. General health recommendations`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No insights available';
  } catch (error) {
    console.error('Error generating insights with Gemini:', error);
    return 'Unable to generate insights at this time. Please try again later.';
  }
};

export const predictNextCycle = async (cycles: CycleData[]): Promise<{
  nextPeriodDate: string;
  fertileWindow: { start: string; end: string; ovulationDay: string };
  confidence: 'low' | 'medium' | 'high';
  message: string;
}> => {
  try {
    if (cycles.length < 3) {
      // Not enough data, return default values
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 28); // Default 28-day cycle
      
      return {
        nextPeriodDate: nextDate.toISOString(),
        fertileWindow: {
          start: new Date(nextDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(nextDate.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          ovulationDay: new Date(nextDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
        confidence: 'low',
        message: 'Prediction based on average cycle length. More data will improve accuracy.'
      };
    }

    // For demo purposes, we'll use a simple prediction
    // In a real app, you might want to use a more sophisticated algorithm
    const lastCycle = cycles[0];
    const cycleLengths = cycles
      .slice(0, 6) // Consider last 6 cycles
      .map(c => c.cycleLength || 28)
      .filter(Boolean);
    
    const avgCycleLength = Math.round(
      cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length
    );

    const lastPeriodDate = new Date(lastCycle.startDate);
    const nextPeriodDate = new Date(lastPeriodDate);
    nextPeriodDate.setDate(lastPeriodDate.getDate() + avgCycleLength);

    // Calculate fertile window (5 days before to 1 day after ovulation)
    const ovulationDay = new Date(nextPeriodDate);
    ovulationDay.setDate(nextPeriodDate.getDate() - 14);
    
    const fertileWindowStart = new Date(ovulationDay);
    fertileWindowStart.setDate(ovulationDay.getDate() - 5);
    
    const fertileWindowEnd = new Date(ovulationDay);
    fertileWindowEnd.setDate(ovulationDay.getDate() + 1);

    return {
      nextPeriodDate: nextPeriodDate.toISOString(),
      fertileWindow: {
        start: fertileWindowStart.toISOString(),
        end: fertileWindowEnd.toISOString(),
        ovulationDay: ovulationDay.toISOString(),
      },
      confidence: cycleLengths.length > 5 ? 'high' : cycleLengths.length > 2 ? 'medium' : 'low',
      message: `Based on your ${cycleLengths.length} previous cycles with an average length of ${avgCycleLength} days.`
    };
    
  } catch (error) {
    console.error('Error predicting next cycle:', error);
    // Fallback to default values
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 28);
    
    return {
      nextPeriodDate: nextDate.toISOString(),
      fertileWindow: {
        start: new Date(nextDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(nextDate.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        ovulationDay: new Date(nextDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      confidence: 'low',
      message: 'Error generating prediction. Using default values.'
    };
  }
};
