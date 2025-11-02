'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

interface CycleData {
  cycleDay: number;
  cycleLength: number;
  periodLength: number;
  nextPeriod: string | null;
}

interface HealthLog {
  date: string;
  mood?: string;
  symptoms?: string[];
  // Add other health log properties as needed
}

interface AIInsightsPanelProps {
  cycleData: CycleData;
  healthLogs: HealthLog[];
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ cycleData, healthLogs }) => {
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare the prompt for Gemini AI with more context
      let prompt = `Based on the following cycle data, provide health insights and recommendations:
      - Current Cycle Day: ${cycleData.cycleDay}
      - Cycle Length: ${cycleData.cycleLength} days
      - Period Length: ${cycleData.periodLength} days
      - Next Period: ${cycleData.nextPeriod || 'Not available'}`;
      
      // Add health logs context if available
      if (healthLogs.length > 0) {
        prompt += '\n\nRecent health logs summary:';
        // Add a summary of recent health logs
        const recentLogs = [...healthLogs].slice(-5).reverse(); // Get last 5 logs
        recentLogs.forEach(log => {
          prompt += `\n- ${new Date(log.date).toLocaleDateString()}: `;
          // Add relevant log details to the prompt
          // Adjust this based on your actual health log structure
          if ('mood' in log) prompt += `Mood: ${log.mood}`;
          if ('symptoms' in log && log.symptoms.length > 0) 
            prompt += `, Symptoms: ${log.symptoms.join(', ')}`;
        });
      }
      
      prompt += '\n\nProvide 3-5 key insights and recommendations based on this data.';

      // Call your API endpoint that interfaces with Gemini AI
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI-Powered Health Insights</h3>
        <Button 
          onClick={generateInsights} 
          disabled={isLoading}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Insights
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      {insights ? (
        <div className="text-black whitespace-pre-line">
          {insights.replace(/\*\*/g, '')}
        </div>
      ) : (
        <div className="text-gray-500 text-center py-8">
          <p>Click the button above to generate personalized health insights based on your cycle data.</p>
        </div>
      )}
    </div>
  );
};
