import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CycleEntry, CyclePrediction, CycleStats } from '../types';

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

/**
 * Get cycle predictions using Gemini AI with enhanced error handling and Firebase integration
 */
export const getCyclePredictions = async (
  entries: CycleEntry[],
  userId?: string
): Promise<{ prediction: CyclePrediction; analysis: string; healthTips: string[] }> => {
  try {
    // Using gemini-2.5-flash model as requested
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Prepare the prompt with cycle history
    // Sort entries by date (newest first)
    const sortedEntries = [...entries]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 12); // Take the 12 most recent entries

    const prompt = `
      You are a women's health assistant. Analyze the following menstrual cycle data and provide:
      1. Predictions for the next period, fertile window, and ovulation
      2. Analysis of patterns and anomalies
      3. Personalized health insights
      
      User's Cycle History (most recent first):
      ${JSON.stringify(sortedEntries.map(entry => ({
        startDate: entry.startDate,
        endDate: entry.endDate || entry.startDate, // Ensure we always have an end date
        flowLevel: entry.flowLevel,
        symptoms: entry.symptoms,
        notes: entry.notes
      })), null, 2)}
      
      Respond with a JSON object in this exact format:
      {
        "prediction": {
          "nextPeriodStart": "YYYY-MM-DD",
          "nextPeriodEnd": "YYYY-MM-DD",
          "fertileWindow": {
            "start": "YYYY-MM-DD",
            "end": "YYYY-MM-DD"
          },
          "ovulationDate": "YYYY-MM-DD",
          "confidence": "high/medium/low"
        },
        "analysis": "Detailed analysis text with markdown formatting",
        "healthTips": ["Tip 1", "Tip 2", "Tip 3"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response text to make it valid JSON
    let cleanText = text
      .replace(/```json|```/g, '') // Remove markdown code block markers
      .replace(/\n/g, ' ')        // Replace newlines with spaces
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();

    // Try to find JSON object in the response
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON object found in response. Full response:', text);
      throw new Error('Failed to extract JSON from AI response');
    }

    let data;
    try {
      data = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Response text:', text);
      throw new Error('Invalid JSON response from AI');
    }
    
    // Save analysis to Firestore if user is authenticated
    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          lastAnalysis: data.analysis,
          lastPrediction: data.prediction,
          lastAnalysisDate: serverTimestamp()
        });
      } catch (dbError) {
        console.error('Error saving analysis to Firestore:', dbError);
        // Continue even if save fails
      }
    }
    
    return {
      prediction: data.prediction,
      analysis: data.analysis,
      healthTips: data.healthTips || []
    };
  } catch (error) {
    console.error('Error in getCyclePredictions:', error);
    
    // Fallback to basic calculation if AI fails
    if (entries.length > 0) {
      const stats = calculateCycleStats(entries);
      const fallbackPrediction = {
        nextPeriodStart: stats.nextPeriodStart || new Date().toISOString(),
        nextPeriodEnd: stats.nextPeriodEnd || new Date().toISOString(),
        fertileWindow: stats.fertileWindow || {
          start: new Date().toISOString(),
          end: new Date().toISOString()
        },
        ovulationDate: stats.ovulationDate || new Date().toISOString(),
        confidence: 'low' as const
      };
      
      return {
        prediction: fallbackPrediction,
        analysis: 'Using basic prediction model. AI analysis is currently unavailable.',
        healthTips: [
          'Track your cycle regularly for more accurate predictions.',
          'Note any symptoms or changes in your cycle.',
          'Consult a healthcare provider for personalized advice.'
        ]
      };
    }
    
    throw new Error('Failed to generate predictions. Please try again later.');
  }
};

/**
 * Calculate comprehensive cycle statistics
 */
export const calculateCycleStats = (entries: CycleEntry[]): CycleStats => {
  if (entries.length === 0) {
    return {
      averageCycleLength: 28,
      averagePeriodLength: 5,
      cycleVariability: 0,
      lastPeriodStart: null,
      nextPeriodStart: null,
      nextPeriodEnd: null,
      fertileWindow: null,
      ovulationDate: null,
      confidence: 'low',
      cycleHistory: []
    };
  }

  // Sort entries by start date (oldest first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Calculate cycle lengths and period lengths
  const cycleLengths: number[] = [];
  const periodLengths: number[] = [];
  const cycleHistory: Array<{
    startDate: string;
    endDate?: string;
    length: number;
    periodLength?: number;
  }> = [];

  for (let i = 1; i < sortedEntries.length; i++) {
    const prevEntry = sortedEntries[i - 1];
    const currEntry = sortedEntries[i];
    
    // Calculate cycle length (days between period starts)
    const startDiff = Math.round(
      (new Date(currEntry.startDate).getTime() - new Date(prevEntry.startDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    
    // Calculate period length (if end date is available)
    let periodLength: number | undefined;
    if (prevEntry.endDate) {
      periodLength = Math.round(
        (new Date(prevEntry.endDate).getTime() - new Date(prevEntry.startDate).getTime()) / 
        (1000 * 60 * 60 * 24)
      ) + 1; // +1 because both start and end days count
      periodLengths.push(periodLength);
    }
    
    cycleLengths.push(startDiff);
    cycleHistory.push({
      startDate: prevEntry.startDate,
      endDate: prevEntry.endDate,
      length: startDiff,
      periodLength
    });
  }

  // Add the last cycle to history
  const lastEntry = sortedEntries[sortedEntries.length - 1];
  cycleHistory.push({
    startDate: lastEntry.startDate,
    endDate: lastEntry.endDate,
    length: 0, // Will be updated with next period
    periodLength: lastEntry.endDate ? 
      Math.round((new Date(lastEntry.endDate).getTime() - new Date(lastEntry.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 
      undefined
  });

  // Calculate averages
  const averageCycleLength = cycleLengths.length > 0 ? 
    Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : 28;
    
  const averagePeriodLength = periodLengths.length > 0 ?
    Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length) : 5;

  // Calculate cycle variability (standard deviation)
  const cycleVariance = cycleLengths.length > 1 ?
    cycleLengths.reduce(
      (sum, length) => sum + Math.pow(length - averageCycleLength, 2),
      0
    ) / cycleLengths.length : 0;
    
  const cycleVariability = Math.round(Math.sqrt(cycleVariance) * 10) / 10;

  // Predict next period (if we have at least one cycle)
  let nextPeriodStart: string | null = null;
  let nextPeriodEnd: string | null = null;
  let fertileWindow: { start: string; end: string } | null = null;
  let ovulationDate: string | null = null;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (cycleLengths.length > 0) {
    const lastStartDate = new Date(lastEntry.startDate);
    const predictedNextStart = new Date(lastStartDate);
    predictedNextStart.setDate(lastStartDate.getDate() + averageCycleLength);
    nextPeriodStart = predictedNextStart.toISOString().split('T')[0];
    
    const nextEnd = new Date(predictedNextStart);
    nextEnd.setDate(predictedNextStart.getDate() + (lastEntry.endDate ? 
      Math.round((new Date(lastEntry.endDate).getTime() - lastStartDate.getTime()) / (1000 * 60 * 60 * 24)) : 4));
    nextPeriodEnd = nextEnd.toISOString().split('T')[0];
    
    // Estimate fertile window (5 days before to 1 day after ovulation)
    const ovulationDay = new Date(predictedNextStart);
    ovulationDay.setDate(predictedNextStart.getDate() - 14);
    ovulationDate = ovulationDay.toISOString().split('T')[0];
    
    const fertileStart = new Date(ovulationDay);
    fertileStart.setDate(ovulationDay.getDate() - 5);
    const fertileEnd = new Date(ovulationDay);
    fertileEnd.setDate(ovulationDay.getDate() + 1);
    
    fertileWindow = {
      start: fertileStart.toISOString().split('T')[0],
      end: fertileEnd.toISOString().split('T')[0]
    };
    
    // Set confidence based on data quality
    if (cycleLengths.length >= 3 && cycleVariability < 3) {
      confidence = 'high';
    } else if (cycleLengths.length >= 2 && cycleVariability < 7) {
      confidence = 'medium';
    }
  }

  return {
    averageCycleLength,
    averagePeriodLength,
    cycleVariability,
    lastPeriodStart: lastEntry.startDate,
    nextPeriodStart: nextPeriodStart ? new Date(nextPeriodStart).toISOString() : null,
    nextPeriodEnd,
    fertileWindow,
    ovulationDate,
    confidence,
    cycleHistory
  };
};
