import { GoogleGenerativeAI } from '@google/generative-ai';
import { FertilityEntry, FertilityInsight } from '../types/fertility';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// System prompt for fertility insights
const FERTILITY_PROMPT = `You are a fertility specialist AI. Analyze the provided fertility tracking data and provide detailed insights with the following structure:

## Fertility Status
- Current cycle day and phase
- Fertility window status (if applicable)
- Key observations from the data

## Cycle Analysis
- Pattern recognition in cycle length
- Temperature patterns (if available)
- Cervical mucus observations
- Other symptom correlations

## Predictions
- Next period date (with confidence level)
- Next ovulation window
- Fertile days forecast

## Recommendations
- Best days for conception
- Health and lifestyle tips
- When to take a pregnancy test
- When to consult a healthcare provider

Format your response in markdown. Be concise but thorough in your analysis.`;

export const generateFertilityInsights = async (entries: FertilityEntry[]): Promise<FertilityInsight> => {
  if (entries.length === 0) {
    return getDefaultInsights();
  }

  try {
    // Prepare data for the AI
    const entriesData = entries.map(entry => ({
      date: entry.loggedAt.split('T')[0],
      basalBodyTemp: entry.basalBodyTemp,
      cervicalMucus: entry.cervicalMucus,
      lhSurge: entry.lhSurge,
      ovulationPain: entry.ovulationPain,
      breastTenderness: entry.breastTenderness,
      libido: entry.libido,
      notes: entry.notes
    }));

    const prompt = `${FERTILITY_PROMPT}\n\nData:\n${JSON.stringify(entriesData, null, 2)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response into structured data
    return parseAIResponse(text);
  } catch (error) {
    console.error('Error generating fertility insights:', error);
    return getDefaultInsights();
  }
};

// Helper function to parse AI response into structured data
function parseAIResponse(text: string): FertilityInsight {
  // This is a simplified parser - in a real app, you'd want more robust parsing
  const defaultInsights = getDefaultInsights();
  
  return {
    ...defaultInsights,
    analysis: text || 'No analysis available. Please check back later.',
  };
}

// Default fallback insights
function getDefaultInsights(): FertilityInsight {
  const today = new Date();
  const nextPeriod = new Date(today);
  nextPeriod.setDate(today.getDate() + 28);
  
  return {
    fertilityWindow: {
      start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      confidence: 'medium'
    },
    ovulationPrediction: {
      date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      confidence: 'medium'
    },
    analysis: 'Start tracking your fertility data to receive personalized insights and predictions.',
    recommendations: [
      'Track your basal body temperature daily',
      'Monitor cervical mucus changes',
      'Record any symptoms you experience',
      'Have regular intercourse during your fertile window',
      'Maintain a healthy lifestyle with balanced nutrition'
    ],
    symptomsAnalysis: {}
  };
}
