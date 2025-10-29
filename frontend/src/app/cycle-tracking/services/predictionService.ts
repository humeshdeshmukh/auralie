import { GoogleGenerativeAI } from '@google/generative-ai';
import { CycleEntry, CyclePrediction } from '../types';

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

/**
 * Get cycle predictions using Gemini AI
 * @param entries Array of past cycle entries
 * @returns Promise with cycle predictions
 */
export const getCyclePredictions = async (
  entries: CycleEntry[]
): Promise<CyclePrediction> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Prepare the prompt with cycle history
    const prompt = `
      You are a women's health assistant. Based on the following menstrual cycle data, 
      predict the next period start date, fertile window, and ovulation date.
      
      Past Cycles (most recent first):
      ${JSON.stringify(entries.slice(0, 6).reverse(), null, 2)}
      
      Return the response as a JSON object with the following structure:
      {
        "nextPeriodStart": "2023-11-15T00:00:00.000Z",
        "nextPeriodEnd": "2023-11-20T00:00:00.000Z",
        "fertileWindow": {
          "start": "2023-10-30T00:00:00.000Z",
          "end": "2023-11-05T00:00:00.000Z"
        },
        "ovulationDate": "2023-11-03T00:00:00.000Z",
        "confidence": "high"
      }
      
      Today's date is: ${new Date().toISOString()}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error getting cycle predictions:', error);
    throw error;
  }
};

/**
 * Calculate basic cycle statistics
 * @param entries Array of cycle entries
 * @returns Object with cycle statistics
 */
export const calculateCycleStats = (entries: CycleEntry[]) => {
  if (entries.length < 2) {
    return {
      averageCycleLength: 28,
      averagePeriodLength: 5,
      cycleVariability: 0,
      lastPeriodStart: entries[0]?.startDate || null,
      nextPeriodStart: null,
    };
  }

  // Sort entries by start date
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Calculate cycle lengths
  const cycleLengths: number[] = [];
  for (let i = 1; i < sortedEntries.length; i++) {
    const prevDate = new Date(sortedEntries[i - 1].startDate);
    const currDate = new Date(sortedEntries[i].startDate);
    const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    cycleLengths.push(diffDays);
  }

  // Calculate average cycle length
  const averageCycleLength = Math.round(
    cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
  );

  // Calculate cycle variability (standard deviation)
  const cycleVariance =
    cycleLengths.reduce(
      (sum, length) => sum + Math.pow(length - averageCycleLength, 2),
      0
    ) / cycleLengths.length;
  const cycleVariability = Math.round(Math.sqrt(cycleVariance) * 10) / 10;

  // Calculate average period length
  const periodLengths = entries.map((entry) => {
    if (!entry.endDate) return 1;
    const start = new Date(entry.startDate);
    const end = new Date(entry.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  });
  
  const averagePeriodLength = Math.round(
    periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length
  );

  // Predict next period start
  const lastEntry = sortedEntries[sortedEntries.length - 1];
  const lastPeriodStart = new Date(lastEntry.startDate);
  const nextPeriodStart = new Date(lastPeriodStart);
  nextPeriodStart.setDate(nextPeriodStart.getDate() + averageCycleLength);

  return {
    averageCycleLength,
    averagePeriodLength,
    cycleVariability,
    lastPeriodStart: lastEntry.startDate,
    nextPeriodStart: nextPeriodStart.toISOString(),
  };
};
