import { GoogleGenerativeAI } from '@google/generative-ai';
import { HealthEntry } from '../types';

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Model configuration
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// System prompt for health insights
const SYSTEM_PROMPT = `You are a highly skilled health analyst with expertise in preventive medicine and lifestyle interventions. 
Analyze the user's health data comprehensively and provide detailed, personalized insights with a focus on:
1. Identifying meaningful patterns and correlations in the data
2. Explaining potential causes and implications of observed trends
3. Offering specific, evidence-based recommendations
4. Highlighting when professional medical advice is recommended

Structure your response in markdown with these sections:

## Health Overview
- Comprehensive summary of current health status
- Key metrics and their significance
- Notable changes from previous entries

## Detailed Trend Analysis
- Time-series analysis of all metrics
- Correlations between different health parameters
- Identification of patterns (daily, weekly, etc.)
- Statistical significance of observed changes

## In-Depth Recommendations
### Nutrition
- Specific dietary adjustments
- Hydration analysis
- Meal timing suggestions

### Physical Activity
- Exercise recommendations based on trends
- Activity modifications
- Recovery advice

### Sleep & Recovery
- Sleep pattern analysis
- Sleep quality assessment
- Rest and recovery suggestions

### Stress & Mental Wellbeing
- Stress pattern recognition
- Mood-energy correlation analysis
- Mindfulness and relaxation techniques

## Medical Considerations
- Parameters requiring medical attention
- Suggested tests or check-ups
- When to consult specific specialists

## Action Plan
- 3-5 prioritized action items
- Short-term and long-term goals
- Tracking suggestions for improvement`;

// Function to generate a fallback response when the AI service is unavailable
const generateFallbackInsights = (entries: HealthEntry[]): string => {
  if (entries.length === 0) {
    return '## No health data available\nAdd more health entries to get personalized insights.';
  }

  // Simple trend analysis based on available data
  const latest = entries[entries.length - 1];
  const previous = entries.length > 1 ? entries[entries.length - 2] : null;
  const trends = [];
  
  // Mood analysis
  if (latest.mood) {
    const moodStr = String(latest.mood);
    let moodAnalysis = `## Mood & Wellbeing\n- Current mood: ${moodStr.toLowerCase()}/10`;
    
    if (previous?.mood) {
      const moodChange = Number(moodStr) - Number(previous.mood);
      if (moodChange !== 0) {
        moodAnalysis += `\n- Mood ${moodChange > 0 ? 'improved' : 'decreased'} by ${Math.abs(moodChange)} points from previous entry`;
      }
    }
    trends.push(moodAnalysis);
  }
  
  // Energy level analysis
  if (latest.energyLevel) {
    let energyAnalysis = `## Energy Levels\n- Current energy: ${latest.energyLevel}/10`;
    
    if (previous?.energyLevel) {
      const energyChange = latest.energyLevel - previous.energyLevel;
      if (energyChange !== 0) {
        energyAnalysis += `\n- Energy level ${energyChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(energyChange)} points`;
      }
    }
    trends.push(energyAnalysis);
  }
  
  // Weight analysis
  if (latest.metrics?.weight !== undefined) {
    let weightAnalysis = '## Weight Analysis\n';
    weightAnalysis += `- Current weight: ${latest.metrics.weight} kg`;
    
    if (previous?.metrics?.weight !== undefined) {
      const weightDiff = latest.metrics.weight - previous.metrics.weight;
      if (Math.abs(weightDiff) > 0.1) {
        weightAnalysis += `\n- ${weightDiff > 0 ? 'Gained' : 'Lost'} ${Math.abs(weightDiff).toFixed(1)} kg since last entry`;
      }
    }
    trends.push(weightAnalysis);
  }
  
  // Blood pressure analysis
  if (latest.metrics?.bloodPressure) {
    const { systolic, diastolic } = latest.metrics.bloodPressure;
    let bpAnalysis = '## Blood Pressure\n';
    bpAnalysis += `- Current reading: ${systolic}/${diastolic} mmHg\n`;
    
    // Categorize blood pressure
    if (systolic >= 140 || diastolic >= 90) {
      bpAnalysis += '- ⚠️ High blood pressure (Hypertension). Please consult a healthcare professional.';
    } else if (systolic >= 120 || diastolic >= 80) {
      bpAnalysis += '- ⚠️ Elevated blood pressure. Consider lifestyle changes and monitor regularly.';
    } else {
      bpAnalysis += '- ✅ Blood pressure is within normal range.';
    }
    
    trends.push(bpAnalysis);
  }
  
  // Heart rate analysis
  if (latest.metrics?.heartRate) {
    let hrAnalysis = '## Heart Rate\n';
    hrAnalysis += `- Current heart rate: ${latest.metrics.heartRate} bpm\n`;
    
    // Categorize heart rate (resting)
    if (latest.metrics.heartRate < 60) {
      hrAnalysis += '- Heart rate is on the lower side (bradycardia).';
    } else if (latest.metrics.heartRate > 100) {
      hrAnalysis += '- Heart rate is elevated (tachycardia).';
    } else {
      hrAnalysis += '- Heart rate is within normal resting range.';
    }
    
    trends.push(hrAnalysis);
  }
  
  // Add recommendations based on the data
  const recommendations = [
    '## Recommendations',
    '1. Track your metrics consistently for better insights',
    '2. Maintain a balanced diet and stay hydrated',
    '3. Get regular physical activity',
    '4. Ensure adequate sleep (7-9 hours for most adults)',
    '5. Manage stress through relaxation techniques',
    '\n*Note: This is a basic analysis. For more detailed insights, try generating AI analysis when the service is available.*'
  ];
  
  return [...trends, ...recommendations].join('\n\n');
};

// Function to calculate basic statistics
const calculateStats = (values: (number | null)[]) => {
  const validValues = values.filter((v): v is number => v !== null);
  if (validValues.length === 0) return null;
  
  const sum = validValues.reduce((a, b) => a + b, 0);
  const avg = sum / validValues.length;
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  
  // Calculate standard deviation
  const squareDiffs = validValues.map(v => Math.pow(v - avg, 2));
  const variance = squareDiffs.reduce((a, b) => a + b, 0) / validValues.length;
  const stdDev = Math.sqrt(variance);
  
  return { avg, min, max, stdDev };
};

export const generateHealthInsights = async (entries: HealthEntry[]): Promise<string> => {
  try {
    if (entries.length === 0) {
      return '## No health data available\nAdd more health entries to get personalized insights.';
    }

    // Sort entries by date (oldest first)
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Extract and analyze metrics
    const metrics = {
      mood: sortedEntries.map(e => e.mood ? Number(e.mood) : null),
      energy: sortedEntries.map(e => e.energyLevel ? Number(e.energyLevel) : null),
      weight: sortedEntries.map(e => e.metrics?.weight || null),
      heartRate: sortedEntries.map(e => e.metrics?.heartRate || null),
      bloodPressure: sortedEntries.map(e => e.metrics?.bloodPressure ? 
        { systolic: e.metrics.bloodPressure.systolic, diastolic: e.metrics.bloodPressure.diastolic } : null)
    };
    
    // Calculate statistics
    const stats = {
      mood: calculateStats(metrics.mood),
      energy: calculateStats(metrics.energy),
      weight: calculateStats(metrics.weight),
      heartRate: calculateStats(metrics.heartRate),
      bloodPressure: {
        systolic: calculateStats(metrics.bloodPressure.map(bp => bp?.systolic || null)),
        diastolic: calculateStats(metrics.bloodPressure.map(bp => bp?.diastolic || null))
      }
    };
    
    // Calculate trends (simple linear regression)
    const calculateTrend = (values: (number | null)[]) => {
      const validData = values
        .map((v, i) => v !== null ? { x: i, y: v } : null)
        .filter((v): v is { x: number; y: number } => v !== null);
      
      if (validData.length < 2) return null;
      
      const n = validData.length;
      const sumX = validData.reduce((sum, p) => sum + p.x, 0);
      const sumY = validData.reduce((sum, p) => sum + p.y, 0);
      const sumXY = validData.reduce((sum, p) => sum + p.x * p.y, 0);
      const sumX2 = validData.reduce((sum, p) => sum + p.x * p.x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      return slope;
    };
    
    const trends = {
      mood: calculateTrend(metrics.mood),
      energy: calculateTrend(metrics.energy),
      weight: calculateTrend(metrics.weight),
      heartRate: calculateTrend(metrics.heartRate)
    };

    // Format entries for the prompt with additional analysis
    const formattedEntries = sortedEntries.map(entry => {
      const entryDate = new Date(entry.date);
      const weight = entry.metrics?.weight;
      const height = entry.metrics?.height;
      const bmi = weight && height ? (weight / Math.pow(height / 100, 2)).toFixed(1) : null;
      
      return {
        date: entryDate.toISOString().split('T')[0],
        dayOfWeek: entryDate.toLocaleDateString('en-US', { weekday: 'long' }),
        mood: entry.mood ? `${entry.mood}/10` : null,
        energyLevel: entry.energyLevel ? `${entry.energyLevel}/10` : null,
        metrics: {
          weight: weight ? `${weight} kg` : null,
          height: height ? `${height} cm` : null,
          bmi: bmi || null,
          bloodPressure: entry.metrics?.bloodPressure
            ? `${entry.metrics.bloodPressure.systolic}/${entry.metrics.bloodPressure.diastolic} mmHg`
            : null,
          heartRate: entry.metrics?.heartRate ? `${entry.metrics.heartRate} bpm` : null,
          temperature: entry.metrics?.temperature ? `${entry.metrics.temperature}°C` : null,
        },
        symptoms: entry.symptoms && entry.symptoms.length > 0 
          ? entry.symptoms.join(', ')
          : null,
        medications: entry.medications && entry.medications.length > 0
          ? entry.medications.map(m => `${m.name}${m.dosage ? ` (${m.dosage})` : ''}`).join(', ')
          : null,
        notes: entry.notes || null,
      };
    });

    // Create a more detailed prompt with analysis instructions
    const prompt = `${SYSTEM_PROMPT}

User's Health Data Analysis (${entries.length} entries from ${new Date(sortedEntries[0].date).toLocaleDateString()} to ${new Date(sortedEntries[sortedEntries.length - 1].date).toLocaleDateString()})

Key Statistics:
- Mood: ${stats.mood ? `Avg: ${stats.mood.avg.toFixed(1)}/10, Range: ${stats.mood.min}-${stats.mood.max}` : 'Insufficient data'}
- Energy: ${stats.energy ? `Avg: ${stats.energy.avg.toFixed(1)}/10, Range: ${stats.energy.min}-${stats.energy.max}` : 'Insufficient data'}
- Weight: ${stats.weight ? `Avg: ${stats.weight.avg.toFixed(1)} kg, Range: ${stats.weight.min}-${stats.weight.max} kg` : 'Insufficient data'}
- Heart Rate: ${stats.heartRate ? `Avg: ${stats.heartRate.avg.toFixed(0)} bpm, Range: ${stats.heartRate.min}-${stats.heartRate.max} bpm` : 'Insufficient data'}
- Blood Pressure: ${stats.bloodPressure.systolic && stats.bloodPressure.diastolic ? `Avg: ${stats.bloodPressure.systolic.avg.toFixed(0)}/${stats.bloodPressure.diastolic.avg.toFixed(0)} mmHg` : 'Insufficient data'}

Trend Analysis (slope per entry):
- Mood: ${trends.mood !== null ? trends.mood.toFixed(3) : 'Insufficient data'} ${trends.mood ? (trends.mood > 0.05 ? '↑ Improving' : trends.mood < -0.05 ? '↓ Declining' : '→ Stable') : ''}
- Energy: ${trends.energy !== null ? trends.energy.toFixed(3) : 'Insufficient data'} ${trends.energy ? (trends.energy > 0.05 ? '↑ Increasing' : trends.energy < -0.05 ? '↓ Decreasing' : '→ Stable') : ''}
- Weight: ${trends.weight !== null ? (trends.weight * 7).toFixed(3) + ' kg/week' : 'Insufficient data'} ${trends.weight ? (trends.weight > 0.1 ? '↑ Gaining' : trends.weight < -0.1 ? '↓ Losing' : '→ Stable') : ''}
- Heart Rate: ${trends.heartRate !== null ? trends.heartRate.toFixed(3) + ' bpm/entry' : 'Insufficient data'}

Raw Data (${entries.length} entries):
${JSON.stringify(formattedEntries, (key, value) => value === null ? undefined : value, 2)}

Please analyze this data and provide comprehensive health insights. Focus on:
1. Identifying significant trends and patterns in the data
2. Highlighting any concerning values or changes that may require attention
3. Explaining potential causes and implications of observed trends
4. Providing specific, actionable recommendations based on the data
5. Noting when professional medical advice should be sought
6. Correlating different metrics (e.g., mood and energy levels, weight and activity)
7. Considering the context of the data (e.g., time of day, day of week)
8. Noting any missing or incomplete data that could improve the analysis

Structure your response with clear sections and use bullet points for readability. Include specific values and trends from the data to support your analysis.`;

    // Add timeout to prevent hanging on slow responses
    const controller = new AbortController();
    const TIMEOUT_MS = 45000; // 45 second timeout (increased from 30s)
    
    // Set up the timeout
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        const errorMessage = `Request timed out after ${TIMEOUT_MS/1000} seconds`;
        console.warn(errorMessage);
        controller.abort();
        reject(new Error(errorMessage));
      }, TIMEOUT_MS);
    });
    
    // Clean up the timeout if the request completes
    controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));
    
    try {
      console.log('Sending request to Gemini API...');
      
      // Race between the API call and the timeout
      const result = await Promise.race([
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          },
        }, { signal: controller.signal }),
        timeoutPromise
      ]);
      
      if (!result || !result.response) {
        throw new Error('Invalid response from AI service');
      }
      
      const response = await result.response;
      return response.text();
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      // Handle specific error cases
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('503') || 
          errorMessage.includes('overloaded') ||
          errorMessage.includes('aborted') ||
          errorMessage.includes('time')) {
        console.warn(`AI service error (${errorMessage}), falling back to basic analysis`);
        return `## Service Temporarily Unavailable\n\n${generateFallbackInsights(entries)}\n\n*Note: The AI service is currently experiencing high demand. This is a basic analysis of your data. Please try again later for more detailed insights.*`;
      }
      
      throw error; // Re-throw other errors
    }
  } catch (error) {
    console.error('Error generating health insights:', error);
    
    // Fallback to basic analysis on any error
    return `## Unable to Generate AI Insights\n\nWe're having trouble connecting to the AI analysis service. Here's a basic summary of your data:\n\n${generateFallbackInsights(entries)}`;
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
