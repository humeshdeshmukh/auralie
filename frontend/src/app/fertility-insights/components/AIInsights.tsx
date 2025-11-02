'use client';

import { Loader2, Sparkles, Lightbulb, HeartPulse, CalendarCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FertilityInsight } from '../types';

interface AIInsightsProps {
  insights: FertilityInsight | null;
  isGenerating: boolean;
  onGenerateInsights: () => Promise<void>;
  symptomAnalysis?: string;
  lastGenerationTime?: number;
  rateLimitMs?: number;
}

// Helper function to clean and format markdown content
const cleanMarkdown = (text: any = '') => {
  // Convert non-string inputs to string
  const str = typeof text === 'string' ? text : String(text || '');
  
  // Remove markdown stars and other formatting
  return str
    .replace(/\*\*/g, '') // Remove ** **
    .replace(/^\*\s*/gm, '• ') // Convert * bullet points to •
    .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
    .trim();
};

// Component to render formatted text with proper line breaks and lists
const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;
  
  const lines = cleanMarkdown(text).split('\n');
  
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        // Check if line starts with a bullet point
        if (line.startsWith('• ')) {
          return (
            <div key={i} className="flex items-start">
              <span className="mr-2">•</span>
              <span>{line.substring(1).trim()}</span>
            </div>
          );
        }
        
        // Check if line is a section header (ends with :)
        if (line.endsWith(':')) {
          return <h4 key={i} className="font-medium text-black mt-4 mb-2">{line}</h4>;
        }
        
        // Regular paragraph
        return <p key={i} className="text-black">{line}</p>;
      })}
    </div>
  );
};

export default function AIInsights({
  insights,
  isGenerating,
  onGenerateInsights
}: Omit<AIInsightsProps, 'symptomAnalysis' | 'lastGenerationTime' | 'rateLimitMs'>) {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    if (insights && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [insights, isInitialLoad]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Fertility Insights</h3>
            </div>
            <button
              onClick={onGenerateInsights}
              disabled={isGenerating}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                insights 
                  ? 'text-primary border border-primary/20 hover:bg-primary/5' 
                  : 'bg-primary text-white hover:bg-primary/90'
              } transition-colors disabled:opacity-50`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {insights ? 'Refresh Insights' : 'Generate Insights'}
                </>
              )}
            </button>
          </div>
          
          {!insights && !isGenerating && (
            <p className="mt-3 text-sm text-gray-600 text-left">
              Get personalized fertility analysis and recommendations based on your health data.
            </p>
          )}
        </div>
        
        <div className="p-6">
          {isGenerating && !insights ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-gray-500">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
              <p>Analyzing your data...</p>
            </div>
          ) : insights ? (
            <div className="space-y-8">
              {/* Cycle Overview */}
              {insights.cycleAnalysis && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-gray-900">
                    <CalendarCheck className="h-5 w-5 text-purple-600" />
                    <h4 className="text-lg font-medium">Cycle Overview</h4>
                  </div>
                  <div className="pl-7">
                    <FormattedText text={insights.cycleAnalysis} />
                  </div>
                </div>
              )}
              
              {/* Fertility Window */}
              {insights.fertilityWindow && (
                <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-900">
                    <CalendarCheck className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-medium">Fertility Window</h4>
                    <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      Confidence: {insights.fertilityWindow.confidence}
                    </span>
                  </div>
                  <div className="pl-7 space-y-2">
                    <p className="text-blue-900">
                      <span className="font-medium">Start:</span> {insights.fertilityWindow.start}
                    </p>
                    <p className="text-blue-900">
                      <span className="font-medium">End:</span> {insights.fertilityWindow.end}
                    </p>
                  </div>
                </div>
              )}

              {/* Health Insights */}
              {insights.healthInsights && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-gray-900">
                    <HeartPulse className="h-5 w-5 text-pink-600" />
                    <h4 className="text-lg font-medium">Health Insights</h4>
                  </div>
                  <div className="pl-7 space-y-4">
                    {typeof insights.healthInsights === 'object' ? (
                      <>
                        {insights.healthInsights.exerciseImpact && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-1">Exercise Impact</h5>
                            <p className="text-gray-800">{insights.healthInsights.exerciseImpact}</p>
                          </div>
                        )}
                        {insights.healthInsights.stressImpact && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-1">Stress Impact</h5>
                            <p className="text-gray-800">{insights.healthInsights.stressImpact}</p>
                          </div>
                        )}
                        {insights.healthInsights.nutritionTips?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-1">Nutrition Tips</h5>
                            <ul className="space-y-1 list-disc pl-5">
                              {insights.healthInsights.nutritionTips.map((tip, index) => (
                                <li key={index} className="text-gray-800">
                                  {cleanMarkdown(tip)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <FormattedText text={insights.healthInsights} />
                    )}
                  </div>
                </div>
              )}
              
              {/* Recommendations */}
              {insights.recommendations?.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-gray-900">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h4 className="text-lg font-medium">Recommendations</h4>
                  </div>
                  <ul className="space-y-2 pl-7">
                    {insights.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2 text-primary">•</span>
                        <span className="text-gray-800">{cleanMarkdown(rec)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Last Updated */}
              {insights.lastUpdated && (
                <div className="pt-4 mt-6 border-t border-gray-100 text-sm text-gray-500">
                  Last updated: {new Date(insights.lastUpdated).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                <Lightbulb className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Insights Yet</h4>
              <p className="text-gray-500 max-w-md mx-auto">
                Click the button above to generate personalized fertility insights based on your data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
