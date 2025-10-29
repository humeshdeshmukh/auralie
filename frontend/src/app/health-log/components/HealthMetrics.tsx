'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, subDays } from 'date-fns';
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
} from 'recharts';
import { HealthEntry } from '../types';

interface HealthMetricsProps {
  entries: HealthEntry[];
}

const METRIC_OPTIONS = [
  { value: 'weight', label: 'Weight (kg)', color: '#3B82F6' },
  { value: 'bmi', label: 'BMI', color: '#10B981' },
  { value: 'bloodPressure', label: 'Blood Pressure', color: '#8B5CF6' },
  { value: 'heartRate', label: 'Heart Rate (BPM)', color: '#10B981' },
  { value: 'mood', label: 'Mood', color: '#EC4899' },
  { value: 'energyLevel', label: 'Energy Level', color: '#6366F1' },
];

export default function HealthMetrics({ entries }: HealthMetricsProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['weight', 'mood']);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [chartData, setChartData] = useState<any[]>([]);

  // Process data for the chart
  useEffect(() => {
    if (!entries.length) return;

    // Sort entries by date
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Filter by time range
    let filteredEntries = [...sortedEntries];
    const now = new Date();
    
    if (timeRange === 'week') {
      const weekAgo = subDays(now, 7);
      filteredEntries = sortedEntries.filter(entry => new Date(entry.date) >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = subDays(now, 30);
      filteredEntries = sortedEntries.filter(entry => new Date(entry.date) >= monthAgo);
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
    const hasBloodPressure = selectedMetrics.includes('bloodPressure');
    
    if (hasBloodPressure && selectedMetrics.length === 1) {
      return 'area';
    } else if (selectedMetrics.includes('mood') || selectedMetrics.includes('energyLevel')) {
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
                return entry ? format(parseISO(entry.fullDate), 'EEEE, MMM d, yyyy') : value;
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

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">Health Trends</h2>
        
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-l-md ${
                timeRange === 'week'
                  ? 'bg-pink-100 text-pink-700 border-pink-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } border`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 text-sm font-medium ${
                timeRange === 'month'
                  ? 'bg-pink-100 text-pink-700 border-pink-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } border-t border-b border-r`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-r-md ${
                timeRange === 'all'
                  ? 'bg-pink-100 text-pink-700 border-pink-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } border`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {METRIC_OPTIONS.map(metric => (
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
              color: selectedMetrics.includes(metric.value) ? metric.color : ''
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
                {selectedMetrics.map(metric => {
                  const metricConfig = METRIC_OPTIONS.find(m => m.value === metric);
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
                  {selectedMetrics.map(metric => {
                    const metricConfig = METRIC_OPTIONS.find(m => m.value === metric);
                    let value = '';
                    
                    if (metric === 'bloodPressure') {
                      value = data.bloodPressureSystolic && data.bloodPressureDiastolic 
                        ? `${data.bloodPressureSystolic}/${data.bloodPressureDiastolic}` 
                        : '-';
                    } else {
                      value = data[metric] !== undefined ? data[metric] : '-';
                    }
                    
                    return (
                      <td 
                        key={metric} 
                        className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                        style={{ color: metricConfig?.color }}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
