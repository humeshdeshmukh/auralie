'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { Loader2, Sparkles } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine,
  Label
} from 'recharts';
import { HealthEntry } from '../types';
import { generateHealthInsights } from '../services/geminiService';

interface HealthMetricsProps {
  entries: HealthEntry[];
  showInsightsByDefault?: boolean;
}

interface MetricOption {
  value: string;
  label: string;
  color: string;
  yAxisId?: string;
}

const METRIC_OPTIONS: MetricOption[] = [
  { value: 'weight', label: 'Weight (kg)', color: '#3B82F6', yAxisId: 'left' },
  { value: 'bmi', label: 'BMI', color: '#10B981', yAxisId: 'left' },
  { 
    value: 'bloodPressureSystolic', 
    label: 'Blood Pressure (Systolic)', 
    color: '#8B5CF6',
    yAxisId: 'right'
  },
  { 
    value: 'bloodPressureDiastolic', 
    label: 'Blood Pressure (Diastolic)', 
    color: '#A78BFA',
    yAxisId: 'right'
  },
  { value: 'heartRate', label: 'Heart Rate (BPM)', color: '#10B981', yAxisId: 'left' },
  { value: 'mood', label: 'Mood (1-10)', color: '#EC4899', yAxisId: 'right' },
  { value: 'energyLevel', label: 'Energy Level (1-10)', color: '#6366F1', yAxisId: 'right' },
];

const TREND_ANALYSIS_PROMPT = `Analyze the following health metrics and provide key insights:
- Identify any significant trends or patterns
- Note any concerning values or changes
- Highlight any correlations between different metrics
- Provide brief recommendations based on the data`;

export default function HealthMetrics({ entries, showInsightsByDefault = false }: HealthMetricsProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['weight', 'bmi']);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState('');
  const [showInsights, setShowInsights] = useState(showInsightsByDefault);

  // State for detail level
  const [detailLevel, setDetailLevel] = useState<'concise' | 'detailed'>('concise');

  // Generate AI-powered insights
  const generateInsights = useCallback(async () => {
    if (!entries.length) {
      setInsights('Not enough data to generate insights. Please add more health entries.');
      setShowInsights(true);
      return;
    }
    
    setIsLoading(true);
    try {
      // Generate insights without modifying the original function
      let analysis = await generateHealthInsights(entries);
      
      // Apply detail level filtering
      if (detailLevel === 'concise') {
        // For concise view, only keep the summary section
        const summaryMatch = analysis.match(/##\s*Summary\s*\n([\s\S]*?)(?=##\s*Trends|$)/i);
        if (summaryMatch && summaryMatch[1]) {
          analysis = summaryMatch[1].trim();
        } else {
          // If no summary section found, truncate to first paragraph
          analysis = analysis.split('\n\n')[0];
        }
      }
      
      // Clean up the output
      const cleanedAnalysis = analysis
        .replace(/\*\*/g, '')  // Remove all **
        .replace(/\*/g, '')    // Remove all *
        .replace(/^[-•]\s*/gm, '')  // Remove bullet points
        .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
        .replace(/^\s*\n/gm, '')   // Remove empty lines at start
        .trim();
      
      setInsights(cleanedAnalysis || 'No insights could be generated. Please try again later.');
      setShowInsights(true);
    } catch (error) {
      console.error('Error generating insights:', error);
      setInsights('Error Generating Insights\n\nWe encountered an issue while generating insights. Please try again later.');
      setShowInsights(true);
    } finally {
      setIsLoading(false);
    }
  }, [entries, detailLevel]);

  // Auto-generate insights when component mounts if showInsightsByDefault is true
  useEffect(() => {
    if (showInsightsByDefault && entries.length > 0) {
      generateInsights();
    }
  }, [showInsightsByDefault, entries, generateInsights]);

  // Process data for the chart
  useEffect(() => {
    if (!entries.length) {
      setChartData([]);
      return;
    }

    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Filter by time range
    let filteredEntries = [...sortedEntries];
    const now = new Date();
    
    if (timeRange === 'week') {
      const oneWeekAgo = subDays(now, 7);
      filteredEntries = filteredEntries.filter(entry => new Date(entry.date) >= oneWeekAgo);
    } else if (timeRange === 'month') {
      const oneMonthAgo = subDays(now, 30);
      filteredEntries = filteredEntries.filter(entry => new Date(entry.date) >= oneMonthAgo);
    }
    
    // Process data for the chart
    const processedData = filteredEntries.map(entry => {
      const entryDate = new Date(entry.date);
      const formattedDate = format(entryDate, 'MMM d');
      
      // Calculate BMI if weight and height are available
      const weight = entry.metrics?.weight;
      const height = entry.metrics?.height; // height in cm
      let bmi = null;
      
      if (weight && height) {
        const heightInMeters = height / 100; // convert cm to m
        bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
      }
      
      return {
        date: formattedDate,
        fullDate: entry.date,
        weight: weight || null,
        bmi: bmi ? parseFloat(bmi) : null,
        bloodPressureSystolic: entry.metrics?.bloodPressure?.systolic || null,
        bloodPressureDiastolic: entry.metrics?.bloodPressure?.diastolic || null,
        heartRate: entry.metrics?.heartRate || null,
        mood: entry.mood ? Number(entry.mood) : null,
        energyLevel: entry.energyLevel ? Number(entry.energyLevel) : null,
        // Add additional metrics for better insights
        steps: entry.metrics?.steps || null,
        sleepDuration: entry.metrics?.sleepDuration || null,
        waterIntake: entry.metrics?.waterIntake || null,
      };
    });

    setChartData(processedData);
  }, [entries, timeRange]);

  // Toggle metric selection
  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  // Get chart type based on selected metrics
  const getChartType = () => {
    const hasBloodPressure = selectedMetrics.some(m => m.includes('bloodPressure'));
    const hasMultipleMetrics = selectedMetrics.length > 1;
    
    if (hasBloodPressure && !hasMultipleMetrics) {
      return 'area';
    } else if (hasMultipleMetrics) {
      return 'line';
    } else {
      return 'line';
    }
  };

  const chartType = getChartType();

  // Render the appropriate chart
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available for the selected time range.
        </div>
      );
    }

    if (selectedMetrics.includes('bloodPressure') && selectedMetrics.length === 1) {
      // Special handling for blood pressure with area chart
      return (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke="#8B5CF6"
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                labelFormatter={(value) => {
                  const entry = chartData.find(d => d.date === value);
                  return entry ? format(parseISO(entry.fullDate), 'EEEE, MMM d, yyyy') : value;
                }}
                formatter={(value, name) => {
                  if (name === 'Systolic' || name === 'Diastolic') {
                    return [value, name];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="bloodPressureSystolic"
                name="Systolic"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.1}
                strokeWidth={2}
                dot={true}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="bloodPressureDiastolic"
                name="Diastolic"
                stroke="#EC4899"
                fill="#EC4899"
                fillOpacity={0.1}
                strokeWidth={2}
                dot={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // Default line chart for other metrics
    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              stroke="#8884d8"
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              formatter={(value, name) => {
                // Format BMI to 1 decimal place
                if (name === 'BMI') {
                  return [value, 'BMI'];
                }
                // Format blood pressure
                if (name === 'Systolic (mmHg)' || name === 'Diastolic (mmHg)') {
                  return [value, name];
                }
                // Default formatting
                return [value, name];
              }}
              labelFormatter={(value) => {
                const entry = chartData.find(d => d.date === value);
                return entry ? format(new Date(entry.fullDate), 'EEEE, MMM d, yyyy') : value;
              }}
            />
            <Legend />
            {selectedMetrics.map(metric => {
              const metricConfig = METRIC_OPTIONS.find(m => m.value === metric);
              if (!metricConfig) return null;
              
              // Special handling for blood pressure to show both systolic/diastolic
              if (metric === 'bloodPressure') {
                return (
                  <>
                    <Line
                      key="systolic"
                      yAxisId="left"
                      type="monotone"
                      dataKey="bloodPressureSystolic"
                      name="Systolic (mmHg)"
                      stroke={metricConfig.color}
                      strokeWidth={2}
                      dot={true}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      key="diastolic"
                      yAxisId="left"
                      type="monotone"
                      dataKey="bloodPressureDiastolic"
                      name="Diastolic (mmHg)"
                      stroke={metricConfig.color}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={true}
                      activeDot={{ r: 6 }}
                    />
                  </>
                );
              }
              
              return (
                <Line
                  key={metric}
                  yAxisId="left"
                  type="monotone"
                  dataKey={metric}
                  name={metricConfig.label}
                  stroke={metricConfig.color}
                  strokeWidth={2}
                  dot={true}
                  activeDot={{ r: 6 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render metric selector button
  const renderMetricButton = (metric: string) => {
    const isSelected = selectedMetrics.includes(metric);
    const metricConfig = METRIC_OPTIONS.find(m => m.value === metric);
    
    return (
      <button
        key={metric}
        type="button"
        onClick={() => {
          setSelectedMetrics(prev =>
            isSelected
              ? prev.filter(m => m !== metric)
              : [...prev, metric]
          );
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          isSelected
            ? 'bg-purple-100 text-purple-800 border border-purple-300'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        }`}
        style={isSelected && metricConfig ? { borderColor: `${metricConfig.color}80` } : {}}
      >
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: isSelected ? metricConfig?.color : '#9CA3AF' }}
        />
        {metricConfig?.label || metric}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Panel - Full Width */}
      <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="mb-3 sm:mb-0">
            <h2 className="text-lg font-semibold text-purple-900">AI Health Insights</h2>
            <p className="text-xs text-purple-600">Get personalized analysis of your health data</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="flex items-center space-x-2 bg-white rounded-md p-1 border border-gray-200">
              <button
                onClick={() => setDetailLevel('concise')}
                className={`px-3 py-1 text-xs rounded ${detailLevel === 'concise' 
                  ? 'bg-purple-100 text-purple-800 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Concise
              </button>
              <button
                onClick={() => setDetailLevel('detailed')}
                className={`px-3 py-1 text-xs rounded ${detailLevel === 'detailed' 
                  ? 'bg-purple-100 text-purple-800 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Detailed
              </button>
            </div>
            
            <button
              onClick={generateInsights}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Generate {detailLevel} insights
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="max-h-64 overflow-y-auto border-t border-gray-100">
          <div className="p-4 text-gray-700 bg-white">
            {showInsights ? (
              insights ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {insights}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">Click the button above to generate insights</p>
                  <p className="text-xs mt-1 text-gray-400">Select 'Concise' for quick highlights or 'Detailed' for in-depth analysis</p>
                </div>
              )
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">Your AI-generated health insights will appear here</p>
                <p className="text-xs mt-1 text-gray-400">Click 'Generate' to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Health Trends Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Health Trends</h2>
            <p className="text-sm text-gray-500">Track your health metrics over time</p>
          </div>
          <div className="w-full sm:w-48">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'all')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

      {/* Metric Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {METRIC_OPTIONS.map((metric) => (
          <button
            key={metric.value}
            type="button"
            onClick={() => toggleMetric(metric.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
              selectedMetrics.includes(metric.value)
                ? 'bg-pink-100 text-pink-700 border-pink-300'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            style={{
              borderColor: selectedMetrics.includes(metric.value) ? metric.color : '',
              backgroundColor: selectedMetrics.includes(metric.value) ? `${metric.color}20` : '',
              color: selectedMetrics.includes(metric.value) ? metric.color : '',
            }}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full">
        {selectedMetrics.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Select at least one metric to view the chart.
          </div>
        )}
      </div>

      {/* Data Table (optional) */}
      {selectedMetrics.length > 0 && chartData.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Data Table</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                {selectedMetrics.map((metric) => {
                  const metricConfig = METRIC_OPTIONS.find((m) => m.value === metric);
                  return (
                    <th 
                      key={metric} 
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ color: metricConfig?.color }}
                    >
                      {metricConfig?.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.map((data, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {data.date}
                  </td>
                  {selectedMetrics.map((metric) => {
                    const metricConfig = METRIC_OPTIONS.find((m) => m.value === metric);
                    return (
                      <td 
                        key={metric} 
                        className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                        style={{ color: metricConfig?.color }}
                      >
                        {data[metric] !== undefined ? data[metric] : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div> {/* Close Health Trends Section */}
    </div>
  );
}
