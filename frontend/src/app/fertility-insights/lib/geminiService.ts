import { GoogleGenerativeAI } from '@google/generative-ai';
import { FertilityEntry, FertilityInsight, FertilityStats } from '../types';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. AI features will be disabled.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export const generateFertilityInsights = async (
  entries: FertilityEntry[],
  stats: FertilityStats
): Promise<FertilityInsight> => {
  try {
    const prompt = `
      You are a fertility and women's health specialist AI. Analyze the following fertility data and provide detailed insights:
      
      User's Cycle Statistics:
      - Average Cycle Length: ${stats.cycleLength} days
      - Period Length: ${stats.periodLength} days
      - Current Cycle Day: ${stats.currentCycleDay}
      - Current Phase: ${stats.phase}
      - Next Period: ${stats.nextPeriod}
      - Next Ovulation: ${stats.nextOvulation}
      - Fertile Window: Day ${stats.fertileWindow.start} to Day ${stats.fertileWindow.end}
      
      Recent Entries (last 3 months):
      ${JSON.stringify(entries.slice(0, 10), null, 2)}
      
      Provide a detailed analysis including:
      1. Fertility window prediction with confidence level
      2. Ovulation prediction with confidence level
      3. Analysis of symptoms and patterns
      4. Personalized recommendations based on the data
      5. Mood and health correlations if data is available
      
      Format the response as a valid JSON object matching this interface:
      {
        fertilityWindow: { start: string, end: string, confidence: 'low'|'medium'|'high' },
        ovulationPrediction: { date: string, confidence: 'low'|'medium'|'high' },
        analysis: string,
        recommendations: string[],
        symptomsAnalysis: Record<string, { pattern: string, correlation: string }>,
        moodAnalysis?: {
          averageMood: number,
          moodPattern: string,
          moodTriggers: string[]
        },
        healthInsights?: {
          exerciseImpact: string,
          nutritionTips: string[],
          stressImpact: string
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from markdown code block if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    
    return JSON.parse(jsonString) as FertilityInsight;
  } catch (error) {
    console.error('Error generating fertility insights:', error);
    throw new Error('Failed to generate insights. Please try again later.');
  }
};

export const analyzeSymptomPatterns = async (entries: FertilityEntry[]) => {
  try {
    const prompt = `
      Analyze these fertility entries and identify patterns in symptoms, mood, and other metrics.
      Focus on:
      1. Recurring symptoms during specific cycle phases
      2. Mood patterns throughout the cycle
      3. Temperature variations
      4. Any correlations between different symptoms
      
      Entries:
      ${JSON.stringify(entries, null, 2)}
      
      Provide a concise analysis in markdown format.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error analyzing symptom patterns:', error);
    return 'Unable to analyze symptom patterns at this time.';
  }
};

export const getPersonalizedTips = async (insights: FertilityInsight, phase: string) => {
  try {
    const prompt = `
      Based on the following fertility insights and current cycle phase (${phase}), 
      provide 3-5 personalized tips for the user.
      
      Insights:
      ${JSON.stringify(insights, null, 2)}
      
      Format the response as a markdown list with emojis.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating personalized tips:', error);
    return [
      '• Track your symptoms daily for better predictions',
      '• Maintain a regular sleep schedule',
      '• Stay hydrated throughout the day'
    ].join('\n');
  }
};
