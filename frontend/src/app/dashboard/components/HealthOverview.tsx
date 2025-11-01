import React from 'react';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import type { ChartData, ChartOptions } from 'chart.js';

interface HealthOverviewProps {
  chartData: ChartData<'line', number[], string>;
  chartOptions: ChartOptions<'line'>;
  chartSize: { width: number; height: number };
  recentLogs: Array<{
    date: string;
    mood: string | number;
    symptoms?: string[];
  }>;
  chartContainerRef: React.RefObject<HTMLDivElement>;
}

export const HealthOverview: React.FC<HealthOverviewProps> = ({
  chartData,
  chartOptions,
  chartSize,
  recentLogs,
  chartContainerRef,
}) => {
  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Health Trends</h3>

        {/* Chart container - fixed height + measured width */}
        <div ref={chartContainerRef} className="w-full" style={{ height: chartSize.height }}>
          {/* Pass stable numeric width/height to chart and disable responsive */}
          <Line options={chartOptions} data={chartData} width={chartSize.width} height={chartSize.height} />
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Recent Symptoms</h4>
          <div className="space-y-2">
            {recentLogs.slice(0, 3).map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">{format(new Date(entry.date), 'MMM d')}</span>
                <div className="flex space-x-2">
                  <span className="text-sm text-gray-600">Mood: {typeof entry.mood === 'number' ? entry.mood : entry.mood}</span>
                  {entry.symptoms && entry.symptoms.length > 0 && (
                    <>
                      <span className="text-sm text-gray-600">•</span>
                      <div className="flex flex-wrap gap-1">
                        {entry.symptoms.slice(0, 2).map((symptom: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-pink-100 text-pink-800">
                            {symptom}
                          </span>
                        ))}
                        {entry.symptoms.length > 2 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-pink-50 text-pink-600">
                            +{entry.symptoms.length - 2} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
