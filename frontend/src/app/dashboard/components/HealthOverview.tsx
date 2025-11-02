import React from 'react';

interface HealthDataPoint {
  date: string;
  mood: number;
  energy: number;
  symptoms?: string[];
  notes?: string;
  temperature?: number;
  flow?: 'light' | 'medium' | 'heavy';
  cervicalMucus?: 'dry' | 'sticky' | 'creamy' | 'watery' | 'egg-white';
  sexualActivity?: boolean;
  birthControl?: boolean;
  medication?: string[];
  weight?: number;
  sleepHours?: number;
  stressLevel?: number;
  appetite?: 'low' | 'normal' | 'high';
  cravings?: string[];
  headaches?: boolean;
  bloating?: boolean;
  cramps?: boolean;
  backPain?: boolean;
  breastTenderness?: boolean;
  acne?: boolean;
  otherSymptoms?: string[];
  ovulationTest?: 'negative' | 'positive' | 'peak';
  pregnancyTest?: 'negative' | 'positive' | 'inconclusive';
}

interface HealthOverviewProps {
  onAnalyzePatterns: () => void;
  isAnalyzing?: boolean;
  aiInsights?: string;
}

const symptomColors: Record<string, string> = {
  headache: 'bg-blue-100 text-blue-800',
  cramps: 'bg-red-100 text-red-800',
  bloating: 'bg-purple-100 text-purple-800',
  fatigue: 'bg-yellow-100 text-yellow-800',
  'breast tenderness': 'bg-pink-100 text-pink-800',
  nausea: 'bg-green-100 text-green-800',
  backache: 'bg-indigo-100 text-indigo-800',
  acne: 'bg-orange-100 text-orange-800',
};

const moodEmoji = (mood: number) => {
  if (mood >= 8) return '😊';
  if (mood >= 6) return '🙂';
  if (mood >= 4) return '😐';
  if (mood >= 2) return '🙁';
  return '😢';
};

export const HealthOverview: React.FC<HealthOverviewProps> = ({
  onAnalyzePatterns,
  isAnalyzing = false,
  aiInsights,
}) => {
  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">AI Insights</h3>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] flex flex-col">
          <h4 className="font-medium text-gray-800 mb-3">AI-Powered Insights</h4>
          
          {aiInsights ? (
            <div className="bg-white p-4 rounded-lg border border-gray-200 flex-1 overflow-auto">
              <div className="prose prose-sm max-w-none">
                {aiInsights.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <svg
                className="w-12 h-12 text-gray-300 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <h4 className="text-gray-500 font-medium mb-1">No insights yet</h4>
              <p className="text-sm text-gray-400 max-w-xs mb-4">
                Click &quot;Generate Insights&quot; to get AI-powered analysis about your cycle and symptoms.
              </p>
              <button
                onClick={onAnalyzePatterns}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center"
              >
                {isAnalyzing ? 'Analyzing...' : 'Generate Insights'}
              </button>
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-400">
            <p>Insights are generated using AI and are for informational purposes only.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
