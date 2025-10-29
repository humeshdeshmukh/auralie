import { GoogleGenerativeAI } from '@google/generative-ai';
import { HealthEntry } from '../types';

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Model configuration
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// System prompt for health insights
const SYSTEM_PROMPT = `You are a helpful and empathetic health assistant. 
Analyze the user's health data and provide personalized insights, trends, and recommendations. 
Be supportive, non-judgmental, and focus on positive reinforcement. 
Highlight any concerning patterns and suggest when to consult a healthcare professional.

Format your response in markdown with the following sections:
## Summary
- Brief overview of the user's health status

## Trends
- Key patterns and changes over time
- Notable improvements or concerns

## Recommendations
- Specific, actionable advice
- Lifestyle suggestions
- When to seek medical advice

## Mood & Energy Analysis
- Insights into mood and energy patterns
- Potential factors affecting well-being

## Symptom Patterns
- Analysis of reported symptoms
- Possible connections or triggers`;

export const generateHealthInsights = async (entries: HealthEntry[]): Promise<string> => {
  try {
    if (entries.length === 0) {
      return '## No health data available\nAdd more health entries to get personalized insights.';
    }

    // Format entries for the prompt
    const formattedEntries = entries.map(entry => {
      const date = new Date(entry.date).toLocaleDateString();
      const metrics = [];
      
      if (entry.metrics.weight) metrics.push(`Weight: ${entry.metrics.weight} kg`);
      if (entry.metrics.bloodPressure) {
        metrics.push(`BP: ${entry.metrics.bloodPressure.systolic}/${entry.metrics.bloodPressure.diastolic}`);
      }
      if (entry.metrics.heartRate) metrics.push(`HR: ${entry.metrics.heartRate} bpm`);
      if (entry.metrics.temperature) metrics.push(`Temp: ${entry.metrics.temperature}°C`);

      const symptoms = entry.symptoms.map(s => 
        `${s.name} (${s.severity}/5)${s.notes ? ` - ${s.notes}` : ''}`
      );

      const meds = entry.medications.map(m => 
        `${m.name} - ${m.dosage} at ${m.time}${m.taken ? ' (Taken)' : ' (Missed)'}`
      );

      return `
### ${date}
- **Mood**: ${entry.mood}/5
- **Energy**: ${entry.energyLevel}/5
${metrics.length ? `- **Metrics**: ${metrics.join(', ')}\n` : ''}${symptoms.length ? `- **Symptoms**:\n  ${symptoms.map(s => `• ${s}`).join('\n  ')}\n` : ''}${meds.length ? `- **Medications**:\n  ${meds.map(m => `• ${m}`).join('\n  ')}\n` : ''}${entry.notes ? `- **Notes**: ${entry.notes}\n` : ''}`;
    }).join('\n');

    const prompt = `${SYSTEM_PROMPT}\n\n## User's Health Data\nHere are the user's health entries, sorted from oldest to most recent. Look for patterns, trends, and provide personalized insights.\n\n${formattedEntries}\n\n## Analysis and Insights`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating health insights:', error);
    return '## Unable to generate insights\nThere was an error processing your health data. Please try again later.';
  }
};

// Function to get symptom explanations
export const getSymptomExplanation = async (symptom: string): Promise<string> => {
  try {
    const prompt = `Provide a brief (2-3 sentence) explanation of the symptom "${symptom}" in simple terms. Include common causes and when to seek medical attention.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting symptom explanation:', error);
    return 'Unable to retrieve information about this symptom at the moment.';
  }
};

// Function to suggest related symptoms
export const suggestRelatedSymptoms = async (symptoms: string[]): Promise<string[]> => {
  try {
    const prompt = `Given these symptoms: ${symptoms.join(', ')}. List 3-5 related symptoms that the user might want to track, formatted as a JSON array of strings.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Try to parse the response as JSON, fallback to splitting by newlines
    try {
      return JSON.parse(text);
    } catch (e) {
      return text.split('\n')
        .map(s => s.replace(/^[-•*]\s*/, '').trim())
        .filter(s => s.length > 0)
        .slice(0, 5);
    }
  } catch (error) {
    console.error('Error suggesting related symptoms:', error);
    return [];
  }
};
